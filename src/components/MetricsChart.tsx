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

export default function MetricsCharts() {
    const [metrics, setMetrics] = useState({
        waitTimes: [] as number[],
        travelTimes: [] as number[],
        elevatorUtilization: [] as number[],
        peakMode: false
    });

    const { sendMessage } = useWebSocket('ws://localhost:3001', {
        onMessage: (event) => {
            const data = JSON.parse(event.data);
            setMetrics(data.metrics);
        }
    });

    useEffect(() => {
        sendMessage(JSON.stringify({ type: 'get-metrics' }));
    }, [sendMessage]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <MetricsChart data={metrics.waitTimes} title="Average Wait Time" color="#3b82f6" icon={<Clock />} />
            <MetricsChart data={metrics.travelTimes} title="Average Travel Time" color="#4ade80" icon={<Activity />} />
            <MetricsChart data={metrics.elevatorUtilization} title="Elevator Utilization" color="#fbbf24" icon={<Users />} />
            <MetricsChart data={metrics.peakMode ? [1] : [0]} title="Peak Mode" color="#ef4444" icon={<Bell />} />
        </div>
    );
}