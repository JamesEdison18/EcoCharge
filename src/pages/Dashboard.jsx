import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MapContainer from '../components/MapContainer';
import EnergySourceBadge from '../components/EnergySourceBadge';
import CarbonBadge from '../components/CarbonBadge';
import { HelpCircle, X, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import {
    INITIAL_STATIONS,
    getStationCarbonIntensity,
    calculateCarbonSavings,
    parseCSVStations
} from '../data/stations';

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
);

export default function Dashboard({ onNavigate, initialTab = 'explore' }) {
    // 1. Core States
    const [stations, setStations] = useState(INITIAL_STATIONS);
    const [filteredStations, setFilteredStations] = useState(INITIAL_STATIONS);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState({ energy: 'all', charger: 'all' });
    const [selectedStation, setSelectedStation] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showHelp, setShowHelp] = useState(false);
    
    // Import text-area pasting state
    const [importText, setImportText] = useState('');
    
    // Alerts feed simulations
    const [alertsFeed, setAlertsFeed] = useState([
        {
            type: 'alert-green',
            text: 'Bengaluru: Solar-to-Grid generation exceeds 60% capacity at Electronic City Hub. Charging recommended.'
        },
        {
            type: 'alert-warn',
            text: 'Delhi NCR: Solar generation dipping due to cloud cover. Stations reverting to backup grid mode.'
        }
    ]);

    // 2. Geolocation Calculation (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // 3. Apply search, filters, and distance sorting
    useEffect(() => {
        const query = searchQuery.toLowerCase().trim();
        
        let result = stations.map(station => {
            const copy = { ...station };
            if (userLocation) {
                copy.distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    station.latitude, station.longitude
                );
            }
            return copy;
        });

        // Filters
        result = result.filter(station => {
            const matchesQuery = !query || 
                station.name.toLowerCase().includes(query) ||
                station.city.toLowerCase().includes(query) ||
                station.state.toLowerCase().includes(query) ||
                station.operator.toLowerCase().includes(query);
                
            const matchesEnergy = activeFilters.energy === 'all' || 
                station.energySource === activeFilters.energy;
                
            const matchesCharger = activeFilters.charger === 'all' || 
                station.chargerType.includes(activeFilters.charger);
                
            return matchesQuery && matchesEnergy && matchesCharger;
        });

        // Sorting
        if (userLocation) {
            result.sort((a, b) => a.distance - b.distance);
        } else {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        setFilteredStations(result);
    }, [stations, searchQuery, activeFilters, userLocation]);

    // 4. GPS Geolocation Request
    const handleRequestGPS = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            error => {
                console.error("GPS Error: ", error);
                alert("Location permission blocked. Setting default fallback (Bengaluru).");
                setUserLocation({ lat: 12.9716, lng: 77.5946 });
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // 5. Select Station Handler
    const handleSelectStation = (stationId) => {
        const found = stations.find(s => s.id === stationId);
        if (found) {
            // Apply distance parameter if user location exists
            if (userLocation) {
                found.distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    found.latitude, found.longitude
                );
            }
            setSelectedStation(found);
        }
    };

    // 6. AI Recommendation calculator
    const getAIRecommendation = () => {
        const activeStations = stations.filter(s => s.availability !== 'Offline');
        if (activeStations.length === 0) return null;

        let best = null;
        let minScore = Infinity;

        activeStations.forEach(station => {
            const intensity = getStationCarbonIntensity(station);
            let score = intensity;

            if (userLocation) {
                const dist = calculateDistance(userLocation.lat, userLocation.lng, station.latitude, station.longitude);
                score += (dist * 15); // Distance penalty
            }

            if (score < minScore) {
                minScore = score;
                best = station;
            }
        });

        if (best && userLocation) {
            best.distance = calculateDistance(userLocation.lat, userLocation.lng, best.latitude, best.longitude);
        }
        return best;
    };

    const aiRec = getAIRecommendation();

    // 7. Carbon Dashboard metrics
    const getCarbonAverages = () => {
        const currentStation = selectedStation || aiRec;
        if (!currentStation) return { avgIntensity: '--', co2Saved: '--' };

        const savings = calculateCarbonSavings(currentStation);
        return {
            avgIntensity: savings.intensity,
            co2Saved: savings.savingsKg
        };
    };

    const { avgIntensity, co2Saved } = getCarbonAverages();

    // Chart.js data configuration
    const getChartData = () => {
        const currentStation = selectedStation || aiRec;
        const stationIntensity = currentStation ? getStationCarbonIntensity(currentStation) : 700;
        
        const gridKg = (700 * 40) / 1000;
        const stationKg = (stationIntensity * 40) / 1000;
        const bestKg = (25 * 40) / 1000;

        return {
            labels: ['Standard Grid', 'Selected Station', 'Pure Renewable Min'],
            datasets: [{
                label: 'CO₂ emissions (kg per 40kWh charge)',
                data: [gridKg, stationKg, bestKg],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.4)',
                    'rgba(59, 130, 246, 0.5)',
                    'rgba(16, 185, 129, 0.6)'
                ],
                borderColor: [
                    '#ef4444',
                    '#3b82f6',
                    '#10b981'
                ],
                borderWidth: 1.5,
                borderRadius: 4
            }]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { size: 9 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 10 } }
            }
        }
    };

    // 8. CSV Import/Export handlers
    const handleCSVImport = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            const newStations = parseCSVStations(csvText);
            if (newStations.length > 0) {
                setStations(prev => [...prev, ...newStations]);
                alert(`Successfully imported ${newStations.length} stations from CSV!`);
                setActiveTab('explore');
            } else {
                alert("No valid station database headers found in CSV.");
            }
        };
        reader.readAsText(file);
    };

    const handleImportTextSubmit = () => {
        const text = importText.trim();
        if (!text) return;

        let parsed = [];
        try {
            if (text.startsWith("[") || text.startsWith("{")) {
                const data = JSON.parse(text);
                parsed = Array.isArray(data) ? data : [data];
            } else {
                parsed = parseCSVStations(text);
            }
        } catch (e) {
            alert(`Format Error: ${e.message}`);
            return;
        }

        if (parsed.length > 0) {
            setStations(prev => [...prev, ...parsed]);
            alert(`Successfully loaded ${parsed.length} stations.`);
            setImportText('');
            setActiveTab('explore');
        } else {
            alert("No valid coordinates or name parameters detected.");
        }
    };

    const handleCSVDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "id,name,operator,address,city,state,latitude,longitude,chargerType,chargingPower,availability,energySource,statusAlerts\n"
            + "TEMP-01,GreenWay Wind Station,GreenWay,A1 Highway Corridor,Salem,Tamil Nadu,11.6643,78.1460,CCS2 (DC Fast),120,Available,Wind / verified renewable supply,Peak wind generation active.";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ecomove_station_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportBackup = (format) => {
        let text = "";
        let mime = "";
        let filename = "";

        if (format === 'json') {
            text = JSON.stringify(stations, null, 2);
            mime = "application/json;charset=utf-8;";
            filename = "ecomove_backup.json";
        } else {
            const headers = ["id", "name", "operator", "address", "city", "state", "latitude", "longitude", "chargerType", "chargingPower", "availability", "energySource", "statusAlerts"];
            const rows = stations.map(s => 
                headers.map(h => {
                    const str = String(s[h] || '').replace(/"/g, '""');
                    return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
                }).join(',')
            );
            text = [headers.join(','), ...rows].join('\n');
            mime = "text/csv;charset=utf-8;";
            filename = "ecomove_backup.csv";
        }

        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 9. Simulation Alerts updates
    useEffect(() => {
        const interval = setInterval(() => {
            const alerts = [
                { type: 'alert-green', text: 'Chennai: Green corridor wind turbines pumping 100% capacity. Green discount active.' },
                { type: 'alert-warn', text: 'Mumbai BKC: Hybrid transformer load exceeding 80%. CO₂ emissions temporarily elevated.' }
            ];
            const randomPick = alerts[Math.floor(Math.random() * alerts.length)];
            setAlertsFeed(prev => [randomPick, ...prev.slice(0, 2)]);
        }, 20000);
        return () => clearInterval(interval);
    }, []);

    // 10. Details calculations
    const selectedSavings = selectedStation ? calculateCarbonSavings(selectedStation) : null;

    return (
        <div className="app-container-react">
            {/* Left Sidebar Menu */}
            <Sidebar 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilters={activeFilters}
                onFilterChange={setActiveFilters}
                filteredStations={filteredStations}
                selectedStation={selectedStation}
                onSelectStation={handleSelectStation}
                userLocation={userLocation}
                onRequestGPS={handleRequestGPS}
                aiRecommendation={aiRec}
                avgIntensity={avgIntensity}
                co2Saved={co2Saved}
                importText={importText}
                onImportTextChange={setImportText}
                onImportTextSubmit={handleImportTextSubmit}
                onCSVImport={handleCSVImport}
                onCSVDownloadTemplate={handleCSVDownloadTemplate}
                onExportBackup={handleExportBackup}
                alertsFeed={alertsFeed}
            />

            {/* Map Container Viewport */}
            <main style={{ position: 'relative', width: '100%', height: '100%' }}>
                <MapContainer 
                    stations={filteredStations}
                    selectedStation={selectedStation}
                    userLocation={userLocation}
                    onSelectStation={handleSelectStation}
                />

                {/* Floating Widgets Top Right */}
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
                    <button 
                        className="btn-outline" 
                        style={{ backgroundColor: 'var(--bg-surface)', padding: '8px 12px' }}
                        onClick={() => onNavigate('landing')}
                    >
                        Landing Page
                    </button>
                    <button 
                        className="btn-outline" 
                        style={{ backgroundColor: 'var(--bg-surface)', padding: '8px 12px' }}
                        onClick={() => setShowHelp(true)}
                    >
                        <HelpCircle size={16} style={{ marginRight: '6px' }} /> Help Guide
                    </button>
                </div>

                {/* Floating Legend Bottom Right */}
                <div 
                    className="map-widget" 
                    style={{ position: 'absolute', bottom: '24px', right: '20px', zIndex: 1000, minWidth: '240px', backgroundColor: 'var(--bg-surface)', backdropFilter: 'blur(8px)' }}
                >
                    <h3 className="widget-title">Map Legend</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span>☀️ Solar / Battery (Gold)</span>
                            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Pure Green</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span>🌬️ Wind Supply (Cyan)</span>
                            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Pure Green</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span>☀️🔌 Solar + Grid (Emerald)</span>
                            <span style={{ color: '#22d3ee', fontWeight: 600 }}>Hybrid</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span>🔌 Standard Grid (Red)</span>
                            <span style={{ color: '#f87171' }}>Grid Baseline</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span>❓ Unknown Source (Gray)</span>
                            <span style={{ color: 'var(--text-muted)' }}>Assumed Grid</span>
                        </div>
                    </div>
                </div>

                {/* Details Drawer */}
                {selectedStation && (
                    <article className="details-drawer" id="detail-drawer">
                        <header className="drawer-header">
                            <div>
                                <h2 style={{ fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>{selectedStation.name}</h2>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Operated by {selectedStation.operator}</span>
                            </div>
                            <button className="drawer-close" onClick={() => setSelectedStation(null)}>
                                <X size={20} />
                            </button>
                        </header>

                        <div className="drawer-body">
                            {/* Stats */}
                            <div className="stat-grid">
                                <div className="stat-item" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                    <div className="stat-val">{selectedStation.chargingPower} kW</div>
                                    <div className="stat-lbl">Charging Power</div>
                                </div>
                                <div className="stat-item" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                    <div className="stat-val blue">{getStationCarbonIntensity(selectedStation)}</div>
                                    <div className="stat-lbl">Carbon (g/kWh)</div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="detail-row">
                                <div className="detail-icon"><Navigation size={15} /></div>
                                <div className="detail-info">
                                    <span className="detail-label">Address</span>
                                    <span className="detail-val" style={{ fontSize: '13px' }}>{selectedStation.address}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-icon"><Sparkles size={15} /></div>
                                <div className="detail-info">
                                    <span className="detail-label">Carbon Classification</span>
                                    <span className="detail-val">
                                        <EnergySourceBadge energySource={selectedStation.energySource} />
                                    </span>
                                </div>
                            </div>

                            {selectedSavings && (
                                <div className="ai-recommendation-panel" style={{ marginTop: '5px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>CO₂ Displaced (per charge)</span>
                                        <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>-{selectedSavings.savingPercentage}%</span>
                                    </div>
                                    <p className="ai-desc" style={{ marginTop: '5px', fontSize: '12px' }}>
                                        Choosing this station prevents <strong>{selectedSavings.savingsKg} kg of CO₂</strong> emissions compared to standard grid charging (average 40 kWh battery top-up).
                                    </p>
                                </div>
                            )}

                            {/* Chart visualizer */}
                            <div style={{ height: '140px', marginTop: '5px', position: 'relative' }}>
                                <Bar data={getChartData()} options={chartOptions} />
                            </div>
                        </div>
                    </article>
                )}
            </main>

            {/* Help Guide Modal */}
            {showHelp && (
                <div className="modal-overlay" onClick={() => setShowHelp(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HelpCircle style={{ color: 'var(--accent-green)' }} /> Carbon Intensity index
                            </h2>
                            <button className="drawer-close" onClick={() => setShowHelp(false)}>
                                <X size={20} />
                            </button>
                        </header>
                        <div className="modal-body" style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                            <p>
                                Carbon metrics reflect life-cycle greenhouse gas values (measured in <strong>g CO₂e/kWh</strong>). 
                                Grid parameters represent standard state-level baselines monitored by the Central Electricity Authority (CEA) of India.
                            </p>
                            <ul style={{ marginLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li>☀️ <strong>Solar / Battery (30-45g):</strong> Direct photovoltaic generation. Low baseline offsets.</li>
                                <li>🌬️ <strong>Wind Power (25g):</strong> Pure green open-access turbine feeds.</li>
                                <li>☀️🔌 <strong>Solar-Grid Hybrids (350g):</strong> Estimated 50% solar and 50% state grid baseline calculations.</li>
                                <li>🔌 <strong>State Grid Baseline (420-820g):</strong> Average grid factors (coal/natural gas/hydro mixtures).</li>
                                <li>❓ <strong>Unknown source (700g):</strong> Safety default baseline applied to avoid greenwashing.</li>
                            </ul>
                        </div>
                        <footer className="modal-footer">
                            <button className="btn-primary" onClick={() => setShowHelp(false)}>Understood</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
