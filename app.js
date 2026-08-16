/**
 * EcoMove AI - Main Controller Logic
 */

// Application State
const state = {
    stations: [],
    filteredStations: [],
    userLocation: null, // { lat, lng }
    selectedStation: null,
    activeFilters: {
        energy: 'all',
        charger: 'all'
    },
    searchQuery: '',
    map: null,
    markers: {}, // maps station ID to Leaflet marker
    userMarker: null,
    carbonChart: null
};

// Default center coordinates (Central India)
const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

// Lifecycle Init
document.addEventListener("DOMContentLoaded", () => {
    // 1. Load initial dataset from data.js
    if (window.EcoData && window.EcoData.INITIAL_STATIONS) {
        state.stations = [...window.EcoData.INITIAL_STATIONS];
    } else {
        console.error("EcoData module not loaded or INITIAL_STATIONS empty.");
    }
    
    // 2. Initialize Leaflet Map
    initMap();
    
    // 3. Render Stations
    applyFiltersAndRender();
    
    // 4. Initialize Carbon Savings Chart
    initChart();
    
    // 5. Setup File Drag & Drop listeners
    setupDragAndDrop();
    
    // 6. Simulate a periodic real-time alert event to show live capabilities
    setInterval(simulateRealTimeAlerts, 15000);
});

/**
 * Initializes the Leaflet Map with CartoDB Dark Matter tiles
 */
function initMap() {
    try {
        state.map = L.map('map', {
            zoomControl: false // Customizing zoom positioning
        }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        
        // Add zoom control at bottom-left
        L.control.zoom({ position: 'bottomleft' }).addTo(state.map);

        // Dark Matter map tiles for premium futuristic styling
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(state.map);
        
    } catch (e) {
        console.error("Leaflet Map failed to initialize: ", e);
    }
}

/**
 * Renders markers on the Leaflet map based on filtered stations
 */
function updateMapMarkers() {
    if (!state.map) return;
    
    // Clear existing markers
    Object.keys(state.markers).forEach(id => {
        state.map.removeLayer(state.markers[id]);
    });
    state.markers = {};
    
    // Determine the greenest station to add a special glow animation
    const greenestStation = getGreenestStation();
    
    state.filteredStations.forEach(station => {
        const energyDetails = window.EcoData.ENERGY_SOURCES[station.energySource] || window.EcoData.ENERGY_SOURCES["Energy source unknown"];
        
        // Pin color determination
        let markerColor = 'var(--color-unknown)';
        if (energyDetails.class === 'pure-renewable') {
            markerColor = station.energySource.includes("Wind") ? 'var(--color-wind)' : 'var(--color-solar)';
        } else if (energyDetails.class === 'hybrid-green') {
            markerColor = 'var(--accent-green)';
        } else if (energyDetails.class === 'standard-grid') {
            markerColor = 'var(--color-grid)';
        }
        
        const isGreenest = greenestStation && station.id === greenestStation.id;
        const iconHtml = `
            <div class="custom-div-icon ${isGreenest ? 'recommended-marker' : ''}">
                <div class="marker-pulse" style="background-color: ${markerColor}"></div>
                <div class="marker-pin" style="background-color: ${markerColor}">
                    <i class="fa-solid ${station.chargerType.includes("DC") ? 'fa-bolt' : 'fa-plug'}"></i>
                </div>
            </div>
        `;
        
        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'div-icon-wrapper',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });
        
        const marker = L.marker([station.latitude, station.longitude], { icon: customIcon })
            .addTo(state.map)
            .on('click', () => {
                selectStation(station.id);
            });
            
        // Bind basic hover tooltip
        marker.bindTooltip(`
            <div style="font-weight:600; font-family:var(--font-heading); color:#ffffff; padding: 2px;">
                ${station.name}<br>
                <span style="font-size:10px; color:${markerColor}">${energyDetails.icon} ${station.energySource}</span>
            </div>
        `, { direction: 'top', className: 'map-tooltip', opacity: 0.95 });
        
        state.markers[station.id] = marker;
    });
}

/**
 * Handles Global tab navigation switches
 */
function switchTab(tabName) {
    // Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
    });
    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add("active");
        activeBtn.setAttribute("aria-selected", "true");
    }
    
    // Panels
    document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.classList.remove("active");
    });
    const activePanel = document.getElementById(`panel-${tabName}`);
    if (activePanel) {
        activePanel.classList.add("active");
    }
    
    // Refit chart if tab-ai is selected
    if (tabName === 'ai' && state.carbonChart) {
        setTimeout(() => state.carbonChart.update(), 100);
    }
}

/**
 * Filters the database and triggers UI redraw
 */
function applyFiltersAndRender() {
    const query = state.searchQuery.toLowerCase().trim();
    
    state.filteredStations = state.stations.filter(station => {
        // Query Match
        const matchesQuery = !query || 
            station.name.toLowerCase().includes(query) ||
            station.city.toLowerCase().includes(query) ||
            station.state.toLowerCase().includes(query) ||
            station.operator.toLowerCase().includes(query);
            
        // Energy Filter Match
        const matchesEnergy = state.activeFilters.energy === 'all' || 
            station.energySource === state.activeFilters.energy;
            
        // Charger Filter Match
        const matchesCharger = state.activeFilters.charger === 'all' || 
            station.chargerType.includes(state.activeFilters.charger);
            
        return matchesQuery && matchesEnergy && matchesCharger;
    });
    
    // Compute distance if GPS user coordinates are set
    if (state.userLocation) {
        state.filteredStations.forEach(station => {
            station.distance = calculateHaversineDistance(
                state.userLocation.lat, state.userLocation.lng,
                station.latitude, station.longitude
            );
        });
        // Sort by closest distance first
        state.filteredStations.sort((a, b) => a.distance - b.distance);
    } else {
        // Fallback: Sort alphabetically by name
        state.filteredStations.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Render list sidebar
    renderStationList();
    
    // Redraw map markers
    updateMapMarkers();
    
    // Update AI recommendations
    updateAIRecommendation();
}

/**
 * Renders lists of charging stations in the sidebar
 */
function renderStationList() {
    const listContainer = document.getElementById("station-list");
    const countBadge = document.getElementById("station-list-count");
    
    if (!listContainer) return;
    
    countBadge.textContent = `${state.filteredStations.length} station${state.filteredStations.length === 1 ? '' : 's'}`;
    
    if (state.filteredStations.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 24px; margin-bottom: 12px; color: var(--color-solar);"></i>
                <p>No stations match current filters.</p>
                <button class="btn-outline" style="margin-top: 12px; margin-inline: auto;" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = state.filteredStations.map(station => {
        const energyInfo = window.EcoData.ENERGY_SOURCES[station.energySource] || window.EcoData.ENERGY_SOURCES["Energy source unknown"];
        const carbonMetric = window.EcoData.calculateCarbonSavings(station);
        
        let badgeClass = 'badge-unknown-source';
        if (energyInfo.class === 'pure-renewable') badgeClass = 'badge-pure-renewable';
        else if (energyInfo.class === 'hybrid-green') badgeClass = 'badge-hybrid-green';
        else if (energyInfo.class === 'standard-grid') badgeClass = 'badge-standard-grid';
        
        // Custom carbon scale letter grades
        let carbonGrade = 'F';
        if (carbonMetric.savingPercentage >= 90) carbonGrade = 'A+';
        else if (carbonMetric.savingPercentage >= 80) carbonGrade = 'A';
        else if (carbonMetric.savingPercentage >= 50) carbonGrade = 'B';
        else if (carbonMetric.savingPercentage >= 20) carbonGrade = 'C';
        else if (carbonMetric.savingPercentage > 0) carbonGrade = 'D';
        
        const distStr = station.distance !== undefined ? `${station.distance.toFixed(1)} km` : '';
        const isSelected = state.selectedStation && state.selectedStation.id === station.id;
        
        return `
            <div class="station-card ${isSelected ? 'selected' : ''}" onclick="selectStation('${station.id}')" role="button" tabindex="0">
                <div class="card-top">
                    <div class="card-name">${station.name}</div>
                    <div class="card-distance">${distStr}</div>
                </div>
                <div class="card-meta">
                    <span class="card-power">${station.chargingPower} kW</span>
                    <span class="energy-badge ${badgeClass}">
                        ${energyInfo.icon} ${station.energySource}
                    </span>
                </div>
                <div class="card-footer">
                    <span>${station.city}, ${station.state}</span>
                    <div class="carbon-score-indicator">
                        <span style="font-size:10px; color:var(--text-muted)">Eco Score:</span>
                        <span class="carbon-letter score-${carbonGrade.charAt(0)}">${carbonGrade}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Selects a station, centers the map view, and opens details drawer
 */
function selectStation(stationId) {
    const station = state.stations.find(s => s.id === stationId);
    if (!station) return;
    
    state.selectedStation = station;
    
    // Zoom to coordinate on map
    if (state.map) {
        state.map.setView([station.latitude, station.longitude], 13);
        
        // Open map popup programmatically
        if (state.markers[stationId]) {
            state.markers[stationId].openTooltip();
        }
    }
    
    // Render list selected state
    renderStationList();
    
    // Open details drawer
    openDetailsDrawer(station);
    
    // Update chart with this station's carbon metrics
    updateChart(station);
}

/**
 * Populates and opens the detailed drawer panel
 */
function openDetailsDrawer(station) {
    const drawer = document.getElementById("detail-drawer");
    if (!drawer) return;
    
    document.getElementById("drawer-station-name").textContent = station.name;
    document.getElementById("drawer-station-operator").textContent = `Operated by ${station.operator}`;
    document.getElementById("drawer-power").textContent = `${station.chargingPower} kW`;
    
    const intensity = window.EcoData.getStationCarbonIntensity(station);
    document.getElementById("drawer-carbon-intensity").textContent = `${intensity} g/kWh`;
    
    document.getElementById("drawer-address").textContent = station.address;
    document.getElementById("drawer-city-state").textContent = `${station.city}, ${station.state}`;
    document.getElementById("drawer-type").textContent = station.chargerType;
    document.getElementById("drawer-energy-source").textContent = station.energySource;
    document.getElementById("drawer-availability").textContent = station.availability;
    
    // Availability class color
    const availText = document.getElementById("drawer-availability");
    const availIcon = document.getElementById("drawer-status-icon");
    if (station.availability === 'Available') {
        availText.style.color = 'var(--accent-green)';
        availIcon.style.color = 'var(--accent-green)';
        availIcon.className = 'fa-solid fa-circle-check';
    } else if (station.availability === 'In Use') {
        availText.style.color = 'var(--color-solar)';
        availIcon.style.color = 'var(--color-solar)';
        availIcon.className = 'fa-solid fa-spinner fa-spin';
    } else {
        availText.style.color = 'var(--color-grid)';
        availIcon.style.color = 'var(--color-grid)';
        availIcon.className = 'fa-solid fa-circle-xmark';
    }
    
    // Classification Badge card
    const energyInfo = window.EcoData.ENERGY_SOURCES[station.energySource] || window.EcoData.ENERGY_SOURCES["Energy source unknown"];
    const carbonMetric = window.EcoData.calculateCarbonSavings(station);
    
    const classBadge = document.getElementById("drawer-classification");
    classBadge.className = 'energy-badge';
    
    if (energyInfo.class === 'pure-renewable') {
        classBadge.classList.add('badge-pure-renewable');
        classBadge.textContent = 'Pure Renewable';
    } else if (energyInfo.class === 'hybrid-green') {
        classBadge.classList.add('badge-hybrid-green');
        classBadge.textContent = 'Hybrid Green';
    } else if (energyInfo.class === 'standard-grid') {
        classBadge.classList.add('badge-standard-grid');
        classBadge.textContent = 'Standard Grid';
    } else {
        classBadge.classList.add('badge-unknown-source');
        classBadge.textContent = 'Unknown Baseline';
    }
    
    document.getElementById("drawer-carbon-description").textContent = energyInfo.description;
    
    // CO2 Savings calculations
    document.getElementById("drawer-co2-savings").textContent = `${carbonMetric.savingsKg} kg Saved (${carbonMetric.savingPercentage}%)`;
    
    // Alerts Box
    const alertBox = document.getElementById("drawer-alerts-box");
    if (station.statusAlerts) {
        alertBox.style.display = 'flex';
        document.getElementById("drawer-alerts-text").innerHTML = `<strong>Status Update:</strong> ${station.statusAlerts}`;
    } else {
        alertBox.style.display = 'none';
    }
    
    drawer.style.display = "flex";
}

/**
 * Closes details drawer
 */
function closeDrawer() {
    const drawer = document.getElementById("detail-drawer");
    if (drawer) drawer.style.display = "none";
    state.selectedStation = null;
    renderStationList();
}

/**
 * Search Bar Handler
 */
function handleSearch() {
    state.searchQuery = document.getElementById("search-bar").value;
    applyFiltersAndRender();
}

/**
 * Filters energy source switches
 */
function setEnergyFilter(type) {
    state.activeFilters.energy = type;
    
    // Toggle active classes
    const pills = document.querySelectorAll("#energy-filter-group .filter-pill");
    pills.forEach(pill => {
        const text = pill.textContent.trim().toLowerCase();
        
        if (type === 'all' && text === 'all') {
            pill.classList.add("active");
        } else if (type !== 'all' && pill.getAttribute("onclick").includes(type)) {
            pill.classList.add("active");
        } else {
            pill.classList.remove("active");
        }
    });
    
    applyFiltersAndRender();
}

/**
 * Filters charger types switches
 */
function setChargerFilter(type) {
    state.activeFilters.charger = type;
    
    // Toggle active classes
    const pills = document.querySelectorAll("#charger-filter-group .filter-pill");
    pills.forEach(pill => {
        if (pill.getAttribute("onclick").includes(type)) {
            pill.classList.add("active");
        } else {
            pill.classList.remove("active");
        }
    });
    
    applyFiltersAndRender();
}

/**
 * Reset filters helper
 */
function resetFilters() {
    document.getElementById("search-bar").value = '';
    state.searchQuery = '';
    state.activeFilters.energy = 'all';
    state.activeFilters.charger = 'all';
    
    // Reset Pills
    const ePills = document.querySelectorAll("#energy-filter-group .filter-pill");
    ePills.forEach(p => p.classList.remove("active"));
    ePills[0].classList.add("active");
    
    const cPills = document.querySelectorAll("#charger-filter-group .filter-pill");
    cPills.forEach(p => p.classList.remove("active"));
    cPills[0].classList.add("active");
    
    applyFiltersAndRender();
}

/**
 * Locates the user using GPS API
 */
function requestGPS() {
    const btn = document.getElementById("btn-gps");
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Locating...`;
    
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        btn.innerHTML = `<i class="fa-solid fa-location-dot"></i> Get Current Location`;
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            state.userLocation = { lat, lng };
            
            // Re-center map to user location
            if (state.map) {
                state.map.setView([lat, lng], 11);
                
                // Add user marker
                if (state.userMarker) {
                    state.userMarker.setLatLng([lat, lng]);
                } else {
                    const userIcon = L.divIcon({
                        html: `<div style="background-color: var(--accent-blue); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px var(--accent-blue); position: relative;"><div class="marker-pulse" style="background-color: var(--accent-blue); width:32px; height:32px; margin: -10px 0 0 -10px;"></div></div>`,
                        className: 'user-gps-marker',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });
                    state.userMarker = L.marker([lat, lng], { icon: userIcon })
                        .addTo(state.map)
                        .bindTooltip("Your Location", { permanent: false, direction: 'top' });
                }
            }
            
            btn.innerHTML = `<i class="fa-solid fa-check"></i> GPS Location Active`;
            btn.classList.add("btn-outline");
            btn.classList.remove("btn-primary");
            
            // Re-apply filters which will calculate distances and sort
            applyFiltersAndRender();
        },
        error => {
            console.error("GPS Access Error: ", error);
            alert("Unable to retrieve location. Fallback active (Default: Central Bengaluru).");
            
            // Fallback: Set location to Indiranagar, Bengaluru
            state.userLocation = { lat: 12.9716, lng: 77.5946 };
            
            if (state.map) {
                state.map.setView([12.9716, 77.5946], 12);
            }
            
            btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Location Fallback Active`;
            applyFiltersAndRender();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

/**
 * Identifies the Greenest Station based on Carbon Rating & Distance
 */
function getGreenestStation() {
    if (state.stations.length === 0) return null;
    
    // We score each station. Lower score is better.
    // If distance is available, score = CarbonIntensity + (Distance * 10)
    // If no distance, score = CarbonIntensity
    
    let bestStation = null;
    let minScore = Infinity;
    
    state.stations.forEach(station => {
        if (station.availability === 'Offline') return; // Skip offline chargers
        
        const carbonIntensity = window.EcoData.getStationCarbonIntensity(station);
        let score = carbonIntensity;
        
        if (state.userLocation && station.distance) {
            // Balance distance and carbon: 1 km of distance roughly equates to 15g carbon penalty
            score += (station.distance * 15);
        }
        
        if (score < minScore) {
            minScore = score;
            bestStation = station;
        }
    });
    
    return bestStation;
}

/**
 * Updates the Smart AI Recommendation UI Panel
 */
function updateAIRecommendation() {
    const container = document.getElementById("ai-rec-card-slot");
    const explanation = document.getElementById("ai-rec-explanation");
    
    const greenest = getGreenestStation();
    
    if (!greenest) {
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    No active recommended stations found.
                </div>
            `;
        }
        return;
    }
    
    const carbonMetric = window.EcoData.calculateCarbonSavings(greenest);
    
    if (explanation) {
        if (state.userLocation) {
            explanation.textContent = "AI calculated carbon savings and distance factors. Here is the lowest-emission charging option closest to you:";
        } else {
            explanation.textContent = "No GPS coordinates set. Showing the overall greenest charging station in the database:";
        }
    }
    
    const energyInfo = window.EcoData.ENERGY_SOURCES[greenest.energySource] || window.EcoData.ENERGY_SOURCES["Energy source unknown"];
    const distText = greenest.distance ? `${greenest.distance.toFixed(1)} km away` : '';
    
    if (container) {
        container.innerHTML = `
            <div class="rec-station-card" onclick="selectStation('${greenest.id}')">
                <div class="rec-title">${greenest.name}</div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
                    <span class="energy-badge badge-pure-renewable" style="font-size:10px; padding: 2px 8px;">
                        ${energyInfo.icon} ${greenest.energySource}
                    </span>
                    <span style="font-size: 12px; color: var(--accent-green); font-weight: 700;">
                        -${carbonMetric.savingPercentage}% CO₂
                    </span>
                </div>
                <div class="rec-details" style="margin-top: 8px;">
                    <span>${greenest.chargingPower} kW • ${greenest.chargerType}</span>
                    <span style="color: var(--accent-blue); font-weight: 500;">${distText}</span>
                </div>
            </div>
        `;
    }
    
    // Also update global carbon savings panel in UI
    document.getElementById("stat-carbon-intensity").textContent = `${carbonMetric.intensity}`;
    document.getElementById("stat-co2-saved").textContent = `${carbonMetric.savingsKg} kg`;
    
    // Automatically update chart if active
    updateChart(greenest);
}

/**
 * Initializes Chart.js comparison chart
 */
function initChart() {
    const ctx = document.getElementById('carbon-chart');
    if (!ctx) return;
    
    state.carbonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Indian Grid Avg', 'This Station', 'Theoretical Min'],
            datasets: [{
                label: 'CO₂ Emissions (kg per 40kWh charge)',
                data: [28, 14, 1.0], // Initial dummy values
                backgroundColor: [
                    'rgba(239, 68, 68, 0.4)',  // Red for grid
                    'rgba(59, 130, 246, 0.5)',  // Blue for selected
                    'rgba(16, 185, 129, 0.6)'   // Green for Wind/Solar
                ],
                borderColor: [
                    'var(--color-grid)',
                    'var(--accent-blue)',
                    'var(--accent-green)'
                ],
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.parsed.y.toFixed(2)} kg CO₂`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 10 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

/**
 * Updates the chart dataset based on current station selection
 */
function updateChart(station) {
    if (!state.carbonChart) return;
    
    const kwh = 40; // baseline charge session
    const gridIntensity = 700; // default Indian grid baseline intensity
    const bestIntensity = 25; // wind minimum
    const stationIntensity = window.EcoData.getStationCarbonIntensity(station);
    
    const gridKg = (gridIntensity * kwh) / 1000;
    const stationKg = (stationIntensity * kwh) / 1000;
    const bestKg = (bestIntensity * kwh) / 1000;
    
    state.carbonChart.data.datasets[0].data = [gridKg, stationKg, bestKg];
    state.carbonChart.update();
}

/**
 * Resets the map viewport to default Indian coordinates
 */
function resetMapView() {
    if (state.map) {
        state.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
}

/**
 * Modal toggle helpers
 */
function toggleModal(modalId, display) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = display ? "flex" : "none";
    }
}

/**
 * Processes text-area custom JSON/CSV pasting
 */
function importRawText() {
    const txt = document.getElementById("import-text").value.trim();
    if (!txt) {
        alert("Please paste some valid CSV or JSON text first.");
        return;
    }
    
    let newStations = [];
    
    try {
        if (txt.startsWith("[") || txt.startsWith("{")) {
            // Attempt JSON parse
            const data = JSON.parse(txt);
            newStations = Array.isArray(data) ? data : [data];
        } else {
            // Attempt CSV parse
            newStations = window.EcoData.parseCSVStations(txt);
        }
    } catch (e) {
        alert(`Error parsing data: ${e.message}`);
        return;
    }
    
    if (newStations.length === 0) {
        alert("No valid stations imported. Please verify column headers and coordinates.");
        return;
    }
    
    // Add to main state
    state.stations = [...state.stations, ...newStations];
    
    // Trigger update
    applyFiltersAndRender();
    
    alert(`Successfully imported ${newStations.length} station(s) to the database.`);
    
    // Clear area
    document.getElementById("import-text").value = '';
    
    // Switch to Explore tab to view them
    switchTab('explore');
}

/**
 * Clears text in import box
 */
function clearImportText() {
    document.getElementById("import-text").value = '';
}

/**
 * Downloads a template CSV file for mock data creation
 */
function downloadSampleCSV() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "id,name,operator,address,city,state,latitude,longitude,chargerType,chargingPower,availability,energySource,statusAlerts\n"
        + "SAMPLE-01,GoGreen Solar Hub,GoGreen,Rooftop Mall Area,Bengaluru,Karnataka,12.9352,77.6182,CCS2 (DC Fast),120,Available,Solar + Battery,Peak efficiency active.\n"
        + "SAMPLE-02,EcoPower Wind Station,EcoPower,High Corridor Zone,Pune,Maharashtra,18.5204,73.8567,CCS2 (DC Fast),60,Available,Wind / verified renewable supply,Backed by clean wind energy PPA.";
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ecomove_station_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Exports data to JSON/CSV download
 */
function exportData(format) {
    let dataStr = "";
    let mimeType = "";
    let filename = "";
    
    if (format === 'json') {
        dataStr = JSON.stringify(state.stations, null, 2);
        mimeType = "application/json;charset=utf-8;";
        filename = "ecomove_stations_backup.json";
    } else {
        // Build CSV
        const headers = ["id", "name", "operator", "address", "city", "state", "latitude", "longitude", "chargerType", "chargingPower", "availability", "energySource", "statusAlerts"];
        const rows = state.stations.map(s => 
            headers.map(header => {
                const val = s[header] !== undefined ? s[header] : '';
                // Escape commas/quotes
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
            }).join(',')
        );
        dataStr = [headers.join(','), ...rows].join('\n');
        mimeType = "text/csv;charset=utf-8;";
        filename = "ecomove_stations_backup.csv";
    }
    
    const blob = new Blob([dataStr], { type: mimeType });
    const link = document.createElement("a");
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Setup File drag-and-drop listeners
 */
function setupDragAndDrop() {
    const area = document.getElementById("csv-drag-area");
    if (!area) return;
    
    ['dragenter', 'dragover'].forEach(eventName => {
        area.addEventListener(eventName, e => {
            e.preventDefault();
            area.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, e => {
            e.preventDefault();
            area.classList.remove('dragover');
        }, false);
    });
    
    area.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleCSVFile(files[0]);
        }
    }, false);
}

function triggerFileInput(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.click();
}

function handleFileSelect(event, type) {
    const files = event.target.files;
    if (files.length > 0) {
        handleCSVFile(files[0]);
    }
}

function handleCSVFile(file) {
    if (!file.name.endsWith('.csv')) {
        alert("Please upload a valid .csv file.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const newStations = window.EcoData.parseCSVStations(text);
        
        if (newStations.length > 0) {
            state.stations = [...state.stations, ...newStations];
            applyFiltersAndRender();
            alert(`Successfully loaded ${newStations.length} station(s) from CSV.`);
            switchTab('explore');
        } else {
            alert("No valid station entries found in CSV. Please verify formatting.");
        }
    };
    reader.readAsText(file);
}

/**
 * Helper to compute distance using Haversine formula
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Simulates random real-time peak solar or wind triggers for interactive immersion
 */
function simulateRealTimeAlerts() {
    const feed = document.getElementById("alert-feed-container");
    if (!feed) return;
    
    const cities = ["Mumbai", "Chennai", "Delhi NCR", "Hyderabad", "Bengaluru"];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    
    // Array of mock events
    const alerts = [
        {
            type: "alert-green",
            text: `<strong>${randomCity}:</strong> Wind corridor output peaking. Dynamic green charging discount active for the next 2 hours.`
        },
        {
            type: "alert-warn",
            text: `<strong>${randomCity}:</strong> Local substation reports peak grid load. Grid carbon intensity elevated by 15%. Recommend waiting.`
        },
        {
            type: "alert-green",
            text: `<strong>${randomCity}:</strong> Rooftop solar storage batteries at 100% capacity. Zero-emissions fast charging available.`
        }
    ];
    
    const pick = alerts[Math.floor(Math.random() * alerts.length)];
    
    // Add to alert feed
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert-item ${pick.type}`;
    alertDiv.innerHTML = `
        <div class="alert-dot"></div>
        <div>${pick.text}</div>
    `;
    
    feed.insertBefore(alertDiv, feed.firstChild);
    
    // Cap feed at 4 items
    if (feed.children.length > 4) {
        feed.removeChild(feed.lastChild);
    }
}
