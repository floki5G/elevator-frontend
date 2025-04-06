import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import useWebSocket from 'react-use-websocket';
import { Bell, ArrowUp, ArrowDown, Activity, Clock, Users } from 'lucide-react';

Chart.register(...registerables);

interface MetricsChartProps {
  data: number[];
  title: string;
  color?: string;
  icon?: React.ReactNode;
}

const MetricsChart = ({ data, title, color = 'rgb(59, 130, 246)', icon }: MetricsChartProps) => (
  <div className="p-6 transition-all bg-white shadow-md rounded-xl hover:shadow-lg">
    <div className="flex items-center mb-4">
      <div className="p-2 mr-3 rounded-lg bg-opacity-20" style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    <div className="h-52">
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [{
            label: title,
            data,
            borderColor: color,
            backgroundColor: `${color}20`,
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointHoverRadius: 4
          }]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f3f4f6' }
            },
            x: {
              grid: { display: false }
            }
          }
        }}
      />
    </div>
  </div>
);

const App = () => {
  const [config, setConfig] = useState({
    floors: 10,
    elevators: 4,
    frequency: 0.3
  });
  const [selectedElevator, setSelectedElevator] = useState<number | null>(null);
  const [peakScenario, setPeakScenario] = useState<string>('none');
  const [showAlert, setShowAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('simulation');

  const { sendJsonMessage, lastJsonMessage } = useWebSocket('https://elevator-backend.onrender.com', {
    shouldReconnect: () => true,
    onOpen: () => sendJsonMessage({ type: 'config', ...config })
  });

  useEffect(() => {
    sendJsonMessage({ type: 'config', ...config });
  }, [config]);

  const isAutoMode = (lastJsonMessage as any)?.isAutoGenerating;

  const handleFloorClick = async (floor: number, direction: 'up' | 'down') => {
    if (isAutoMode) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const passengers = prompt(`Number of waiting passengers (1-8):`);
    const numPassengers = Math.min(8, Math.max(1, parseInt(passengers || '0', 10)));

    if (numPassengers > 0) {
      sendJsonMessage({
        type: 'external',
        floor,
        direction,
        passengers: numPassengers
      });
    }
  };

  const handleDestinationClick = async (floor: number) => {
    if (selectedElevator === null || isAutoMode) {
      if (isAutoMode) setShowAlert(true);
      return;
    }

    const elevator = (lastJsonMessage as any)?.elevators?.find((e: any) => e.id === selectedElevator);
    const maxPassengers = elevator?.passengers || 0;

    const passengersOut = prompt(`Number of passengers exiting (0-${maxPassengers}):`);
    const numPassengersOut = Math.min(maxPassengers, Math.max(0, parseInt(passengersOut || '0', 10)));

    sendJsonMessage({
      type: 'internal',
      floor,
      passengersOut: numPassengersOut
    });
  };

  const handleSetPeak = (scenario: string) => {
    let config: any = { active: false };

    switch (scenario) {
      case 'morning':
        config = { active: true, lobbyFloor: 0, requestPercentage: 0.7, direction: 'up' };
        break;
      case 'evening':
        config = { active: true, lobbyFloor: config.floors - 1, requestPercentage: 0.6, direction: 'down' };
        break;
    }

    sendJsonMessage({ type: 'set-peak', config });
    setPeakScenario(scenario);
  };

  const floorHeight = 600 / config.floors;

  const handleSelectElevator = (id: number) => {
    setSelectedElevator(selectedElevator === id ? null : id);
  };

  const getMetricsData = () => {
    const metrics = (lastJsonMessage as any)?.metrics;
    return {
      waitTimes: metrics?.waitTimes.map((t: any) => t / 1000) || [],
      travelTimes: metrics?.travelTimes.map((t: any) => t / 1000) || [],
      utilization: metrics?.elevatorUtilization.map((u: any) => u * 100) || []
    };
  };

  const metrics = getMetricsData();

  return (
    <div className="min-h-screen bg-gray-50">
      {showAlert && (
        <div className="fixed z-50 flex items-center p-4 text-white bg-red-500 rounded-lg shadow-lg top-4 right-4 animate-fade-in">
          <Bell size={18} className="mr-2" />
          <span>Disable auto-generation to use manual controls!</span>
        </div>
      )}

      <header className="bg-white shadow-sm">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Elevator Simulation System</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('simulation')}
                className={`px-4 py-2 rounded-lg ${activeTab === 'simulation' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                Simulation
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg ${activeTab === 'analytics' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Control Panel */}
        <div className="p-6 mb-6 bg-white shadow-md rounded-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Configuration</h2>
          <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Floors: {config.floors}</label>
              <div className="flex items-center">
                <span className="mr-2 text-gray-500">5</span>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={config.floors}
                  onChange={e => setConfig(prev => ({ ...prev, floors: +e.target.value }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  disabled={isAutoMode}
                />
                <span className="ml-2 text-gray-500">20</span>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Elevators: {config.elevators}</label>
              <div className="flex items-center">
                <span className="mr-2 text-gray-500">1</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={config.elevators}
                  onChange={e => setConfig(prev => ({ ...prev, elevators: +e.target.value }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  disabled={isAutoMode}
                />
                <span className="ml-2 text-gray-500">8</span>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Request Rate: {(config.frequency * 100).toFixed(0)}%
              </label>
              <div className="flex items-center">
                <span className="mr-2 text-gray-500">10%</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={config.frequency}
                  onChange={e => setConfig(prev => ({ ...prev, frequency: +e.target.value }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  disabled={isAutoMode}
                />
                <span className="ml-2 text-gray-500">100%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => sendJsonMessage({ type: 'toggle-auto' })}
                className={`px-4 py-2 rounded-lg font-medium ${(lastJsonMessage as any)?.isAutoGenerating
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
                  } text-white transition-colors`}
              >
                {(lastJsonMessage as any)?.isAutoGenerating ? '⏹ Stop Auto' : '▶ Start Auto'}
              </button>
              <button
                onClick={() => sendJsonMessage({ type: 'reset' })}
                className="px-4 py-2 font-medium text-white transition-colors bg-gray-600 rounded-lg hover:bg-gray-700"
              >
                Reset System
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSetPeak('morning')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${peakScenario === 'morning' ? 'bg-blue-600' : 'bg-blue-400 hover:bg-blue-500'
                  } text-white`}
              >
                🌅 Morning Peak
              </button>
              <button
                onClick={() => handleSetPeak('evening')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${peakScenario === 'evening' ? 'bg-orange-600' : 'bg-orange-400 hover:bg-orange-500'
                  } text-white`}
              >
                🌆 Evening Peak
              </button>
              <button
                onClick={() => handleSetPeak('none')}
                className="px-4 py-2 font-medium text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
              >
                Normal Traffic
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
            <MetricsChart
              data={metrics.waitTimes}
              title="Wait Time (seconds)"
              color="#10B981"
              icon={<Clock size={24} color="#10B981" />}
            />
            <MetricsChart
              data={metrics.travelTimes}
              title="Travel Time (seconds)"
              color="#3B82F6"
              icon={<Activity size={24} color="#3B82F6" />}
            />
            <MetricsChart
              data={metrics.utilization}
              title="Utilization (%)"
              color="#F59E0B"
              icon={<Users size={24} color="#F59E0B" />}
            />
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Floor Panel */}
            <div className="w-full p-4 bg-white shadow-md lg:w-32 rounded-xl">
              <h3 className="mb-3 font-semibold text-gray-700 text-md">Floor Controls</h3>
              <div className="lg:h-[600px] overflow-y-auto grid grid-cols-5 lg:grid-cols-1 gap-2">
                {Array.from({ length: config.floors }).map((_, i) => {
                  const floorNumber = config.floors - i - 1;
                  const upQueue = (lastJsonMessage as any)?.floors?.[floorNumber]?.upQueue || 0;
                  const downQueue = (lastJsonMessage as any)?.floors?.[floorNumber]?.downQueue || 0;

                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium">{floorNumber + 1}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleFloorClick(floorNumber, 'up')}
                          className={`w-8 h-8 rounded-lg relative flex items-center justify-center ${isAutoMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100'
                            } transition-colors`}
                          disabled={isAutoMode}
                        >
                          <ArrowUp size={16} className="text-blue-600" />
                          {upQueue > 0 && (
                            <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-green-500 rounded-full -top-1 -right-1">
                              {upQueue}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleFloorClick(floorNumber, 'down')}
                          className={`w-8 h-8 rounded-lg relative flex items-center justify-center ${isAutoMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100'
                            } transition-colors`}
                          disabled={isAutoMode}
                        >
                          <ArrowDown size={16} className="text-blue-600" />
                          {downQueue > 0 && (
                            <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
                              {downQueue}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Elevators */}
            <div className="flex-1 relative bg-white rounded-xl shadow-md p-4 h-[600px] overflow-hidden">
              <h3 className="mb-3 font-semibold text-gray-700 text-md">Elevator Shafts</h3>

              {/* Floor indicators */}
              <div className="absolute top-0 bottom-0 left-0 w-8 border-r border-gray-200 bg-gray-50">
                {Array.from({ length: config.floors }).map((_, i) => {
                  const floorNumber = config.floors - i - 1;
                  return (
                    <div
                      key={i}
                      className="absolute flex items-center justify-center w-full border-b border-gray-200"
                      style={{
                        bottom: `${floorNumber * floorHeight}px`,
                        height: `${floorHeight}px`
                      }}
                    >
                      <span className="text-xs font-medium text-gray-500">{floorNumber + 1}</span>
                    </div>
                  );
                })}
              </div>

              {/* Floor lines */}
              {Array.from({ length: config.floors + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 h-px bg-gray-200"
                  style={{ bottom: `${i * floorHeight}px` }}
                />
              ))}

              {/* Elevator shafts */}
              {Array.from({ length: config.elevators }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 bg-gray-50"
                  style={{
                    left: `${(i * (100 / config.elevators)) + 8}%`,
                    width: `${(100 / config.elevators) - 2}%`
                  }}
                />
              ))}

              {/* Elevators */}
              {(lastJsonMessage as any)?.elevators?.map((elevator: any) => (
                <div
                  key={elevator.id}
                  className="absolute transition-all duration-500 ease-in-out"
                  style={{
                    bottom: `${elevator.currentFloor * floorHeight}px`,
                    left: `${((elevator.id * (100 / config.elevators)) + 8) + ((100 / config.elevators) - 2) / 4}%`,
                    width: `${((100 / config.elevators) - 2) / 2}%`
                  }}
                >
                  <div
                    className={`bg-gray-800 text-white p-3 rounded-lg border-2 cursor-pointer transform transition-all
                      ${elevator.doorState === 'open' ? 'border-green-500' : 'border-gray-600'}
                      ${selectedElevator === elevator.id ? 'ring-4 ring-blue-400 scale-105' : 'hover:scale-105'}
                    `}
                    onClick={() => handleSelectElevator(elevator.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold">#{elevator.id + 1}</span>
                      <span className={`text-sm ${elevator.direction === 'up' ? 'text-green-400' :
                        elevator.direction === 'down' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                        {elevator.direction === 'up' ? <ArrowUp size={14} /> :
                          elevator.direction === 'down' ? <ArrowDown size={14} /> : '•'}
                      </span>
                    </div>
                    <div className="mb-2 text-xl font-bold text-center">
                      {elevator.currentFloor + 1}
                    </div>
                    <div className="h-2 mb-1 overflow-hidden bg-gray-600 rounded-full">
                      <div
                        className="h-full transition-all rounded-full"
                        style={{
                          width: `${(elevator.passengers / elevator.capacity) * 100}%`,
                          backgroundColor: `rgba(${(elevator.passengers / elevator.capacity) * 255}, ${255 - (elevator.passengers / elevator.capacity) * 128}, 0)`
                        }}
                      />
                    </div>
                    <div className="text-xs text-center text-gray-300">
                      {elevator.passengers}/{elevator.capacity}
                    </div>
                    {elevator.destinations.length > 0 && (
                      <div className="p-1 mt-2 text-xs text-center bg-gray-700 rounded">
                        Next: {elevator.destinations[0] + 1}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Destination Panel */}
            <div className="w-full p-4 bg-white shadow-md lg:w-48 rounded-xl">
              <h3 className="mb-3 font-semibold text-gray-700 text-md">
                {selectedElevator !== null ?
                  `Elevator #${selectedElevator + 1} Controls` :
                  'Select an Elevator'}
              </h3>

              {selectedElevator !== null ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: config.floors }).map((_, i) => {
                    const floorNumber = config.floors - i - 1;
                    const elevator = (lastJsonMessage as any)?.elevators?.find((e: any) => e.id === selectedElevator);
                    const isDestination = elevator?.destinations?.includes(floorNumber);
                    const isCurrent = elevator?.currentFloor === floorNumber;

                    return (
                      <button
                        key={i}
                        onClick={() => handleDestinationClick(floorNumber)}
                        className={`
                          p-2 rounded-lg text-sm font-medium transition-all
                          ${isCurrent ? 'bg-blue-500 text-white' :
                            isDestination ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              isAutoMode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                'bg-gray-100 hover:bg-blue-50 text-gray-700'
                          }
                        `}
                        disabled={isAutoMode || isCurrent}
                      >
                        {floorNumber + 1}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                  <p className="text-sm text-center text-gray-500">
                    Click on an elevator<br />to select it
                  </p>
                </div>
              )}

              {selectedElevator !== null && (
                <button
                  onClick={() => setSelectedElevator(null)}
                  className="w-full p-2 mt-4 text-sm text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Deselect Elevator
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;