/**
 * EcoMove AI - Charging Station Database & Utilities
 */

// Grid Carbon Intensity averages by state in India (g CO2 per kWh)
// Source: CEA (Central Electricity Authority) CO2 Baseline Database for Indian Power Sector (approx averages)
const STATE_GRID_CARBON_INTENSITY = {
    "Karnataka": 650,
    "Maharashtra": 720,
    "Delhi": 780,
    "Tamil Nadu": 620,
    "Telangana": 740,
    "Kerala": 420,  // Higher hydro share
    "West Bengal": 820, // High coal share
    "Rajasthan": 680,
    "Gujarat": 690,
    "Default": 700
};

// Energy Source classifications and their estimated carbon intensity (g CO2/kWh)
const ENERGY_SOURCES = {
    "Solar-powered": {
        name: "Solar-powered",
        icon: "☀️",
        carbon: 30, // Life-cycle emissions only
        description: "Powered directly by on-site solar panels. Near-zero operational emissions.",
        class: "pure-renewable"
    },
    "Solar + Battery": {
        name: "Solar + Battery",
        icon: "🔋☀️",
        carbon: 45, // Direct solar + storage life-cycle
        description: "On-site solar power stored in batteries. Available day and night.",
        class: "pure-renewable"
    },
    "Wind / verified renewable supply": {
        name: "Wind / verified renewable supply",
        icon: "🌬️",
        carbon: 25, // Green tariffs / direct wind PPA
        description: "Backed by 100% wind energy contracts or verified green tariffs.",
        class: "pure-renewable"
    },
    "Solar + Grid": {
        name: "Solar + Grid",
        icon: "☀️🔌",
        carbon: 350, // Hybrid blend (assumed 50% solar, 50% grid)
        description: "Hybrid charging. Uses solar when available, supplemented by grid power.",
        class: "hybrid-green"
    },
    "Grid-connected": {
        name: "Grid-connected",
        icon: "🔌",
        carbon: -1, // Calculated dynamically based on state grid intensity
        description: "Powered by the standard electrical grid. Carbon impact depends on regional energy mix.",
        class: "standard-grid"
    },
    "Energy source unknown": {
        name: "Energy source unknown",
        icon: "❓",
        carbon: -1, // Treated as grid or default grid
        description: "No verified energy source data available. Standard grid baseline is assumed.",
        class: "unknown-source"
    }
};

// High-fidelity preloaded database of charging stations in India
const INITIAL_STATIONS = [
    // BENGALURU (Karnataka)
    {
        id: "BLR-001",
        name: "Zeon Charging - Electronic City Hub",
        operator: "Zeon Charging",
        address: "Phase 1, Electronic City, Near Wipro Gate",
        city: "Bengaluru",
        state: "Karnataka",
        latitude: 12.8452,
        longitude: 77.6635,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 120,
        availability: "Available",
        energySource: "Solar + Battery",
        statusAlerts: "Solar generation optimal. Peak green energy available."
    },
    {
        id: "BLR-002",
        name: "Tata Power EZ Charge - Indiranagar Metro",
        operator: "Tata Power",
        address: "Indiranagar Metro Station Parking",
        city: "Bengaluru",
        state: "Karnataka",
        latitude: 12.9784,
        longitude: 77.6408,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 50,
        availability: "In Use",
        energySource: "Solar + Grid",
        statusAlerts: "Drawing 60% Solar, 40% Grid power currently."
    },
    {
        id: "BLR-003",
        name: "Ather Grid - JP Nagar 3rd Phase",
        operator: "Ather Energy",
        address: "Organic Cafe Parking, 24th Main Road",
        city: "Bengaluru",
        state: "Karnataka",
        latitude: 12.9082,
        longitude: 77.5912,
        chargerType: "Type 2 (AC)",
        chargingPower: 22,
        availability: "Available",
        energySource: "Solar-powered",
        statusAlerts: "Direct off-grid solar active."
    },
    {
        id: "BLR-004",
        name: "BESCOM EV Zone - Vidhana Soudha",
        operator: "BESCOM",
        address: "Ambedkar Veedhi, Sampangi Rama Nagar",
        city: "Bengaluru",
        state: "Karnataka",
        latitude: 12.9796,
        longitude: 77.5908,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 60,
        availability: "Available",
        energySource: "Grid-connected",
        statusAlerts: "Standard grid charging."
    },
    {
        id: "BLR-005",
        name: "Statiq Station - MG Road",
        operator: "Statiq",
        address: "Utility Building Complex, MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        latitude: 12.9742,
        longitude: 77.6110,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 30,
        availability: "Offline",
        energySource: "Energy source unknown",
        statusAlerts: "Maintenance in progress."
    },

    // DELHI (NCR)
    {
        id: "DEL-001",
        name: "ChargeZone - IGI Airport T3",
        operator: "ChargeZone",
        address: "Multi-level Car Parking, Terminal 3",
        city: "Delhi",
        state: "Delhi",
        latitude: 28.5562,
        longitude: 77.1002,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 150,
        availability: "Available",
        energySource: "Solar + Battery",
        statusAlerts: "EcoCharge Recommended: Off-peak carbon pricing applied."
    },
    {
        id: "DEL-002",
        name: "Magenta ChargeGrid - Dwarka Sector 10",
        operator: "Magenta",
        address: "Metro Station Parking, Sector 10 Dwarka",
        city: "Delhi",
        state: "Delhi",
        latitude: 28.5802,
        longitude: 77.0573,
        chargerType: "Type 2 (AC)",
        chargingPower: 22,
        availability: "Available",
        energySource: "Wind / verified renewable supply",
        statusAlerts: "Verified 100% wind energy supply via green open access."
    },
    {
        id: "DEL-003",
        name: "Tata Power EZ Charge - Connaught Place",
        operator: "Tata Power",
        address: "Radial Road 3, Inner Circle, CP",
        city: "Delhi",
        state: "Delhi",
        latitude: 28.6304,
        longitude: 77.2177,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 60,
        availability: "In Use",
        energySource: "Solar + Grid",
        statusAlerts: "Drawing 40% Solar, 60% Grid. High load on local transformer."
    },
    {
        id: "DEL-004",
        name: "Fortum Charge & Drive - Saket Select Citywalk",
        operator: "Fortum",
        address: "Select Citywalk Mall Parking",
        city: "Delhi",
        state: "Delhi",
        latitude: 28.5287,
        longitude: 77.2194,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 50,
        availability: "Available",
        energySource: "Grid-connected",
        statusAlerts: "Standard Delhi Grid. Current carbon intensity is high."
    },

    // MUMBAI (Maharashtra)
    {
        id: "BOM-001",
        name: "Tata Power EZ Charge - BKC G Block",
        operator: "Tata Power",
        address: "G Block, Bandra Kurla Complex",
        city: "Mumbai",
        state: "Maharashtra",
        latitude: 19.0607,
        longitude: 72.8682,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 120,
        availability: "Available",
        energySource: "Solar + Grid",
        statusAlerts: "Solar canopy active. Delivering 45% renewable energy."
    },
    {
        id: "BOM-002",
        name: "Adani Electricity - Andheri West Hub",
        operator: "Adani",
        address: "Adani Power Station Complex, Link Road",
        city: "Mumbai",
        state: "Maharashtra",
        latitude: 19.1197,
        longitude: 72.8277,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 60,
        availability: "Available",
        energySource: "Solar + Battery",
        statusAlerts: "100% solar supply enabled via battery dispatch."
    },
    {
        id: "BOM-003",
        name: "Statiq Station - Dadar TT Circle",
        operator: "Statiq",
        address: "Metro Parking Plot, Dadar East",
        city: "Mumbai",
        state: "Maharashtra",
        latitude: 19.0178,
        longitude: 72.8478,
        chargerType: "Type 2 (AC)",
        chargingPower: 22,
        availability: "In Use",
        energySource: "Energy source unknown",
        statusAlerts: "Standard grid charging."
    },

    // CHENNAI (Tamil Nadu)
    {
        id: "MAA-001",
        name: "Zeon Charging - Guindy Industrial Estate",
        operator: "Zeon Charging",
        address: "Ekkatuthangal, Guindy Industrial Area",
        city: "Chennai",
        state: "Tamil Nadu",
        latitude: 13.0182,
        longitude: 80.2035,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 120,
        availability: "Available",
        energySource: "Wind / verified renewable supply",
        statusAlerts: "Drawing wind power from solar-wind hybrid corridor in Muppandal."
    },
    {
        id: "MAA-002",
        name: "Relux Electric - T. Nagar Commercial Zone",
        operator: "Relux Electric",
        address: "Opposite Pondy Bazar Parking Plaza",
        city: "Chennai",
        state: "Tamil Nadu",
        latitude: 13.0405,
        longitude: 80.2337,
        chargerType: "Type 2 (AC)",
        chargingPower: 22,
        availability: "Available",
        energySource: "Solar-powered",
        statusAlerts: "Solar rooftop canopy active. Zero carbon charge."
    },
    {
        id: "MAA-003",
        name: "Tata Power EZ Charge - OMR Food Street",
        operator: "Tata Power",
        address: "Navalur, OMR Road",
        city: "Chennai",
        state: "Tamil Nadu",
        latitude: 12.8378,
        longitude: 80.2212,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 60,
        availability: "In Use",
        energySource: "Grid-connected",
        statusAlerts: "Standard Tamil Nadu grid power."
    },

    // HYDERABAD (Telangana)
    {
        id: "HYD-001",
        name: "ChargeZone - Gachibowli IT Hub",
        operator: "ChargeZone",
        address: "Financial District Road, Gachibowli",
        city: "Hyderabad",
        state: "Telangana",
        latitude: 17.4483,
        longitude: 78.3488,
        chargerType: "CCS2 (DC Fast)",
        chargingPower: 150,
        availability: "Available",
        energySource: "Solar + Battery",
        statusAlerts: "Microgrid dispatching solar battery power. 92% lower emissions."
    },
    {
        id: "HYD-002",
        name: "Magenta ChargeGrid - Jubilee Hills Road 36",
        operator: "Magenta",
        address: "Metro pillar 1622, Jubilee Hills Road 36",
        city: "Hyderabad",
        state: "Telangana",
        latitude: 17.4322,
        longitude: 78.4072,
        chargerType: "Type 2 (AC)",
        chargingPower: 22,
        availability: "Available",
        energySource: "Solar + Grid",
        statusAlerts: "Grid assisted solar charging. 40% emission reduction."
    },
    {
        id: "HYD-003",
        name: "Ather Grid - Secunderabad Club",
        operator: "Ather Energy",
        address: "Lighthouse Building Entrance, Secunderabad",
        city: "Hyderabad",
        state: "Telangana",
        latitude: 17.4439,
        longitude: 78.4983,
        chargerType: "Type 2 (AC)",
        chargingPower: 22,
        availability: "Available",
        energySource: "Energy source unknown",
        statusAlerts: "Source details unverified. Assumed grid carbon footprint."
    }
];

/**
 * Calculates the estimated carbon intensity of a station's power source (g CO2/kWh)
 * @param {object} station - The charging station object
 * @returns {number} - Carbon intensity in g CO2 / kWh
 */
function getStationCarbonIntensity(station) {
    const energyData = ENERGY_SOURCES[station.energySource] || ENERGY_SOURCES["Energy source unknown"];
    
    // If it has a fixed renewable value, return it
    if (energyData.carbon !== -1) {
        return energyData.carbon;
    }
    
    // Otherwise, compute it based on the regional grid intensity
    const stateGridVal = STATE_GRID_CARBON_INTENSITY[station.state] || STATE_GRID_CARBON_INTENSITY["Default"];
    
    if (station.energySource === "Grid-connected") {
        return stateGridVal;
    }
    
    // Unknown or invalid source is penalized to default grid rate
    return stateGridVal;
}

/**
 * Calculates the estimated carbon savings compared to standard Indian grid baseline (700g CO2/kWh)
 * @param {object} station - The charging station object
 * @param {number} kwhCharged - The energy charged in kWh (default: 40 kWh for a standard EV session)
 * @returns {object} - { savingsKg: number, savingPercentage: number, intensity: number }
 */
function calculateCarbonSavings(station, kwhCharged = 40) {
    const baselineIntensity = STATE_GRID_CARBON_INTENSITY["Default"]; // Standard Grid baseline (700g/kWh)
    const stationIntensity = getStationCarbonIntensity(station);
    
    const baselineEmissions = baselineIntensity * kwhCharged; // grams
    const stationEmissions = stationIntensity * kwhCharged; // grams
    
    const savingsGrams = Math.max(0, baselineEmissions - stationEmissions);
    const savingsKg = (savingsGrams / 1000).toFixed(2);
    const savingPercentage = Math.round((savingsGrams / baselineEmissions) * 100);
    
    return {
        savingsKg: parseFloat(savingsKg),
        savingPercentage: savingPercentage,
        intensity: stationIntensity
    };
}

/**
 * Parses CSV file content to import a new set of stations
 * @param {string} csvText - Raw CSV text
 * @returns {array} - Array of station objects
 */
function parseCSVStations(csvText) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    // Simple header extraction
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const stations = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Match comma-separated values, respecting quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const values = matches.map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        if (values.length < headers.length) continue;
        
        const station = {};
        headers.forEach((header, index) => {
            const val = values[index];
            if (header === 'latitude' || header === 'longitude' || header === 'chargingPower') {
                station[header] = parseFloat(val) || 0;
            } else {
                station[header] = val;
            }
        });
        
        // Ensure default properties
        if (station.name && station.latitude && station.longitude) {
            station.id = station.id || `IMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            station.operator = station.operator || "Unknown Operator";
            station.address = station.address || "Unknown Address";
            station.city = station.city || "Unknown City";
            station.state = station.state || "Default";
            station.chargerType = station.chargerType || "Type 2 (AC)";
            station.chargingPower = station.chargingPower || 22;
            station.availability = station.availability || "Available";
            
            // Validate energy source, map to official types
            const src = station.energySource;
            if (ENERGY_SOURCES[src]) {
                station.energySource = src;
            } else if (src && src.toLowerCase().includes("solar") && src.toLowerCase().includes("battery")) {
                station.energySource = "Solar + Battery";
            } else if (src && src.toLowerCase().includes("solar") && src.toLowerCase().includes("grid")) {
                station.energySource = "Solar + Grid";
            } else if (src && src.toLowerCase().includes("solar")) {
                station.energySource = "Solar-powered";
            } else if (src && src.toLowerCase().includes("wind")) {
                station.energySource = "Wind / verified renewable supply";
            } else if (src && src.toLowerCase().includes("grid")) {
                station.energySource = "Grid-connected";
            } else {
                station.energySource = "Energy source unknown";
            }
            
            station.statusAlerts = station.statusAlerts || "Imported station data.";
            stations.push(station);
        }
    }
    
    return stations;
}

// Export modules globally for simple static file usage in index.html/app.js
window.EcoData = {
    STATE_GRID_CARBON_INTENSITY,
    ENERGY_SOURCES,
    INITIAL_STATIONS,
    getStationCarbonIntensity,
    calculateCarbonSavings,
    parseCSVStations
};
