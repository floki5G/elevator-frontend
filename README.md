# 🚀 Elevator Simulation System

 real-time elevator movement simulator with a WebSocket-powered backend and an interactive frontend UI.

---

## 🔧 Setup Instructions

### Frontend

```bash
git clone https://github.com/floki5G/elevator-frontend
cd elevator-frontend
npm install
npm run dev
```

### Backend

```bash
git clone https://github.com/floki5G/elevator-backend
cd elevator-backend
npm install
npm run dev
```

Make sure both frontend and backend are running. WebSocket communication will sync the elevator simulation between them.

---

## 🧭 Application Overview

- **Tabs**
  - `Simulation`: Visual display of elevators, requests, and movement.
  - `Metrics`: Displays real-time system performance.

- **Real-Time Features**
  - Elevator movement
  - Auto-generation of requests
  - Request assignment using a scoring algorithm
  - Live metrics tracking

---

## ⚙️ Configuration Options

| Setting        | Description                            |
|----------------|----------------------------------------|
| Floors         | Range from 1 to 20                     |
| Elevators      | 1 to 8 elevators supported             |
| Request Rate   | 10% to 100%                            |
| Auto Requests  | Up to 100 before auto-generation stops |

---

## 🔄 Scheduling Algorithm

Requests are assigned to elevators using a scoring system.

### Example Calculation

```text
Current Floor: 3
Direction: Up
Passengers: 4/8
Request: Floor 5 (Up)

Distance = |5 - 3| = 2
Direction Penalty = -100 (same direction)
Capacity Penalty = (4/8) * 10 = 5

Total Score = 2 - 100 + 5 = -93
```

👉 Elevator with the **lowest score** is selected to serve the request.

---

## 🕹️ Controls

- ▶ **Start Auto** – Begin auto request generation
- 🔄 **Reset System** – Restart the simulation
- 🌅 **Morning Peak** – Peak traffic from the lobby (floor 0)
- 🟢 **Normal Traffic** – Resets to default traffic pattern

---

## 📊 Performance Metrics

- **Wait Time**: Time from request creation → pickup
- **Travel Time**: Time from pickup → dropoff
- **Utilization**: Percentage of elevator capacity used

---

## 📥 Request Handling Flow

1. **Request Creation**
   - External: Floor button pressed
   - Internal: Passengers choose destination

2. **Queue Update**
   - Add request to appropriate floor queue

3. **Elevator Assignment**
   - Score all elevators
   - Select the best fit based on score

4. **Destination Management**
   - Add request to elevator destination list
   - Sort based on direction

5. **Movement**
   - Move 1 floor per simulation tick
   - Handle boarding & drop-offs

---

## 📌 Special Case Handling

### 1. Morning Peak

```ts
public setPeakScenario(config: Partial<PeakConfig>): void
```

- 70% of requests come from floor 0
- Idle elevators return to lobby

### 2. Evening Peak

- 60% of requests are **to** floor 0
- Elevators prefer downward movement

### 3. Capacity Management

- Max: 8 passengers
- Partial boarding allowed
- Queue shrinks based on remaining capacity

### 4. Idle Elevators

- Idle elevators auto-return to lobby during peak
- First-come-first-served request assignment

### 5. Door Timing

- Doors remain open for 3 seconds
- Elevators are stationary during open state

---

## 🔗 WebSocket Communication

The system uses WebSockets for:
- Real-time request generation and updates
- Syncing elevator state
- Pushing metric data to the frontend