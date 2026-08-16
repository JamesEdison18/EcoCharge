# EcoMove AI

EcoMove AI is a production-quality, responsive prototype website designed as an **AI-powered renewable-aware EV charging recommendation platform for India**.

Unlike standard EV directories that only identify the closest charger, EcoMove AI answers:
> **"Where can I charge my EV with the least carbon impact?"**

---

## 🌟 Core Features

1. **Device/Browser GPS Geolocation**: Accurately tracks the user coordinates, calculates distance to charging stations, and orders search queries by proximity.
2. **Interactive Dark-Mode Map**: Interactive viewport utilizing Leaflet.js and custom markers color-coded by the source of energy (Solar, Wind, Hybrid, Grid).
3. **Advanced Filtering**: Filter chargers by renewable energy classification (pure green, hybrid, coal/gas heavy grid) and charging speed parameters (CCS2 DC Fast vs. Type 2 AC).
4. **Smart AI Recommendation Engine**: Selects the absolute best green charging hub by mathematically balancing carbon intensity and proximity (distance).
5. **Real-time Grid & Renewable Alerts**: Interactive dashboard feed simulating live alerts (e.g., peak solar dispatch times, local grid load adjustments).
6. **Carbon Savings Dashboard**: Visual representations using Chart.js comparing emissions from charging 40 kWh on the standard grid vs. the recommended renewable station.
7. **CSV & JSON Data Import/Export**: Support importing databases in CSV format using drag-and-drop or manual text inputs.

---

## ⚡ Station Energy Classifications

To avoid fake greenwashing claims, stations are classified under 6 distinct energy sources:
1. ☀️ **Solar-powered (30 g CO₂/kWh)**: Direct rooftop/canopy solar feed.
2. 🔋☀️ **Solar + Battery (45 g CO₂/kWh)**: Direct solar supplemented by battery storage for round-the-clock availability.
3. 🌬️ **Wind / verified renewable supply (25 g CO₂/kWh)**: Backed by 100% wind energy contracts or verified green tariffs.
4. ☀️🔌 **Solar + Grid (350 g CO₂/kWh)**: Hybrid charging utilizing solar when available and grid power otherwise.
5. 🔌 **Grid-connected (State-specific 420-820 g CO₂/kWh)**: Relying strictly on the standard Indian power grid.
6. ❓ **Energy source unknown**: Penally baseline rate (~700 g CO₂/kWh) is applied.

---

## 📂 File Architecture

* [`index.html`](file:///c:/Users/james/EcoCharge/index.html): The main dashboard layout containing the sidebar tabs (Explore, AI Insights, Data Tools), detail drawer, legend panel, and modals.
* [`styles.css`](file:///c:/Users/james/EcoCharge/styles.css): Custom CSS variables, grid adjustments, neon glows, glassmorphism overlays, custom pins, and animations.
* [`data.js`](file:///c:/Users/james/EcoCharge/data.js): Preloaded database of Indian EV stations (covering Mumbai, Bengaluru, Delhi, Hyderabad, Chennai) and emission calculation formulas.
* [`app.js`](file:///c:/Users/james/EcoCharge/app.js): Controller logic managing GPS coordinates, Leaflet map layers, filters, AI ranking algorithms, Chart.js updates, and data imports.

---

## 🚀 Running Locally

The project contains no mandatory build step, making it instantly executable in any environment.

### Option A: Open directly in Browser
Double-click on [`index.html`](file:///c:/Users/james/EcoCharge/index.html) or drag it into any web browser.

### Option B: Local Web Server (Recommended)
Launch a simple server inside the project root:
```bash
# Using Python
python -m http.server 8000

# Using Node (if http-server is installed)
npx http-server -p 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.
