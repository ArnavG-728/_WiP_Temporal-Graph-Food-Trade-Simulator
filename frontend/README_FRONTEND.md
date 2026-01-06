# Temporal Food Graph - Frontend

This is the research-grade visualization suite for the Global Food Trade Digital Twin.

## 🚀 Features
- **Live Graph Snapshots**: Dynamic node-link diagrams of global trade flows using Cytoscape.js.
- **Predictive Simulator**: Interactive attribute sliders to simulate production shocks and climate stress.
- **Data Explorer**: Deep-dive into individual country metrics and historical trends using Recharts.
- **Insights Dashboard**: Vulnerability rankings and critical trade route identification.
- **Premium UI**: Dark-mode primary design with glassmorphism, mesh gradients, and framer-motion animations.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Custom Design System
- **Visualization**: Cytoscape.js, Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 🏁 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` if you need to point to a remote backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📂 Structure
- `/app`: Pages and routing
- `/components`: Reusable UI elements (Navbar, Graph, etc.)
- `/lib`: API client and utility helpers
- `/public`: Static assets
