# ⚡ RectifierLab - Power Electronics Simulation Studio

An interactive, high-fidelity web-based laboratory simulation for single-phase and three-phase uncontrolled, semi-controlled, and fully-controlled rectifier circuits with interactive schematic diagrams, real-time waveform analysis, FFT harmonic spectrum, and customizable loads (R, RL, RLE / Battery Charger, and Constant Current).

## 🚀 Features

- **Circuit Topologies**:
  - 1-Phase Half-Wave Uncontrolled & Controlled Rectifier
  - 1-Phase Full-Wave Bridge (Uncontrolled Diode & Controlled Thyristor)
  - 1-Phase Semi-Converter (Half-Controlled Bridge)
  - 3-Phase Half-Wave Rectifier
  - 3-Phase 6-Pulse Diode Bridge Rectifier
  - 3-Phase Fully-Controlled Thyristor Bridge Rectifier
  - 3-Phase Semi-Controlled Rectifier (Half-Controlled)
- **Comprehensive Load Types**:
  - Resistive ($R$)
  - Inductive ($R-L$)
  - Battery Charger ($R-L-E$) with series internal resistance, smoothing choke, and DC back-EMF
  - Constant Current Source ($I_{dc}$)
- **Freewheeling Diode ($D_{FW}$)**: Optional freewheeling diode integration with automatic conduction path visualization.
- **Waveform & Harmonics**: Real-time voltage ($v_o$), current ($i_o$), supply voltage, device voltages, average/RMS calculations, Ripple Factor, and FFT Harmonics bar charts.
- **Interactive Controls**: Firing angle ($\alpha$), frequency ($f$), supply voltage ($V_m$), inductance ($L$), resistance ($R$), and battery EMF ($E$).

## 🛠️ Built With

- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Lucide React** & **Framer Motion**

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

## 🌐 Deploy to GitHub Pages

This project is configured with GitHub Actions (`.github/workflows/deploy.yml`) and relative asset paths (`base: './'`). Simply push this repository to GitHub and select **GitHub Actions** under **Settings > Pages** to publish.
