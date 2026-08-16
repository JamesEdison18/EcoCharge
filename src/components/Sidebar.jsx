import React, { useRef } from 'react';
import { Search, MapPin, Sparkles, Database, FileSpreadsheet, Download, Upload, Trash2, ArrowUpRight } from 'lucide-react';
import FilterPanel from './FilterPanel';
import StationCard from './StationCard';
import EnergySourceBadge from './EnergySourceBadge';
import { calculateCarbonSavings } from '../data/stations';

export default function Sidebar({
    activeTab,
    setActiveTab,
    searchQuery,
    onSearchChange,
    activeFilters,
    onFilterChange,
    filteredStations,
    selectedStation,
    onSelectStation,
    userLocation,
    onRequestGPS,
    aiRecommendation,
    avgIntensity,
    co2Saved,
    importText,
    onImportTextChange,
    onImportTextSubmit,
    onCSVImport,
    onCSVDownloadTemplate,
    onExportBackup,
    alertsFeed
}) {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onCSVImport(file);
        }
    };

    return (
        <aside className="sidebar-react" role="complementary" aria-label="EcoMove Sidebar">
            {/* Sidebar Header Brand */}
            <div className="brand-header">
                <div className="logo">
                    <span style={{ fontSize: '24px', background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>🌱</span>
                    <h1 style={{ fontSize: '20px', fontWeight: 800 }}>EcoMove <span style={{ color: 'var(--accent-green)' }}>AI</span></h1>
                </div>
                <div className="badge-pure-renewable energy-badge" style={{ fontSize: '10px', padding: '2px 6px' }}>
                    Dashboard
                </div>
            </div>

            {/* Dashboard Tabs */}
            <nav className="dash-tabs" role="tablist">
                <button 
                    className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
                    onClick={() => setActiveTab('explore')}
                    role="tab"
                    aria-selected={activeTab === 'explore'}
                >
                    Explore
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ai')}
                    role="tab"
                    aria-selected={activeTab === 'ai'}
                >
                    <Sparkles size={14} style={{ marginRight: '4px' }} /> AI Insights
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                    onClick={() => setActiveTab('data')}
                    role="tab"
                    aria-selected={activeTab === 'data'}
                >
                    <Database size={14} style={{ marginRight: '4px' }} /> Data Tools
                </button>
            </nav>

            <div className="sidebar-scrollable">
                {/* Panel 1: Explore */}
                {activeTab === 'explore' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Search */}
                        <div className="search-container">
                            <Search className="search-icon-inside" size={18} />
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="Search by city, state, or operator..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <FilterPanel 
                            activeFilters={activeFilters}
                            onFilterChange={onFilterChange}
                        />

                        {/* Location Action */}
                        <div className="location-card">
                            <h3><MapPin size={16} style={{ color: 'var(--accent-blue)' }} /> Set GPS Location</h3>
                            <p>Enable browser GPS to locate the greenest stations in your immediate vicinity.</p>
                            <button 
                                className={`btn-primary ${userLocation ? 'btn-outline' : ''}`}
                                onClick={onRequestGPS}
                            >
                                {userLocation ? 'GPS Location Active' : 'Get Current Location'}
                            </button>
                        </div>

                        {/* List of Stations */}
                        <div className="station-list-container">
                            <h2 className="station-list-title">
                                Nearby Stations
                                <span className="station-count">{filteredStations.length} stations</span>
                            </h2>
                            <div className="station-list">
                                {filteredStations.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        <p>No stations match current filters.</p>
                                    </div>
                                ) : (
                                    filteredStations.map(station => (
                                        <StationCard 
                                            key={station.id}
                                            station={station}
                                            isSelected={selectedStation && selectedStation.id === station.id}
                                            onClick={() => onSelectStation(station.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Panel 2: AI Insights */}
                {activeTab === 'ai' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Recommendation */}
                        <div className="ai-recommendation-panel">
                            <div className="ai-header">
                                <h2 className="ai-title">EcoMove Smart AI</h2>
                                <span className="ai-badge">Best Match</span>
                            </div>
                            <p className="ai-desc">
                                {userLocation 
                                    ? "AI calculated carbon savings and distance factors. Here is the lowest-emission charging option closest to you:" 
                                    : "No GPS coordinates set. Showing the overall greenest charging station in the database:"}
                            </p>
                            
                            {aiRecommendation ? (
                                <div className="rec-station-card" onClick={() => onSelectStation(aiRecommendation.id)}>
                                    <div className="rec-title">{aiRecommendation.name}</div>
                                    <div style={{ display: 'flex', align-items: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                        <EnergySourceBadge energySource={aiRecommendation.energySource} />
                                        <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: '700' }}>
                                            -{calculateCarbonSavings(aiRecommendation).savingPercentage}% CO₂
                                        </span>
                                    </div>
                                    <div className="rec-details" style={{ marginTop: '8px' }}>
                                        <span>{aiRecommendation.chargingPower} kW • {aiRecommendation.chargerType}</span>
                                        {aiRecommendation.distance && (
                                            <span style={{ color: 'var(--accent-blue)', fontWeight: 550 }}>
                                                {aiRecommendation.distance.toFixed(1)} km away
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '10px' }}>
                                    No recommended stations found.
                                </div>
                            )}
                        </div>

                        {/* Carbon Stats Summary */}
                        <div className="carbon-dashboard-card">
                            <h3 className="filter-title"><i className="fa-solid fa-chart-line"></i> Cumulative Carbon Savings</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                Emissions statistics for EV charging baseline sessions.
                            </p>
                            
                            <div className="stat-grid" style={{ marginTop: '8px' }}>
                                <div className="stat-item">
                                    <div className="stat-val">{avgIntensity}</div>
                                    <div className="stat-lbl">Intensity (g/kWh)</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-val blue">{co2Saved} kg</div>
                                    <div className="stat-lbl">CO₂ Saved (vs grid)</div>
                                </div>
                            </div>
                        </div>

                        {/* Alert notifications */}
                        <div className="filter-group">
                            <span className="filter-title">Real-Time Renewable Alerts</span>
                            <div className="alert-feed">
                                {alertsFeed.map((alert, index) => (
                                    <div key={index} className={`alert-item ${alert.type}`}>
                                        <div className="alert-dot"></div>
                                        <div>{alert.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Panel 3: Data Import */}
                {activeTab === 'data' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="carbon-dashboard-card">
                            <h3 className="filter-title"><FileSpreadsheet size={14} style={{ marginRight: '6px' }} /> CSV Dataset Import</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '8px' }}>
                                Drag & drop or upload a CSV file to add new charging stations to the prototype.
                            </p>
                            
                            <div 
                                className="upload-drag-area" 
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            >
                                <Upload className="upload-icon" size={24} />
                                <span className="upload-text">Click to choose CSV file</span>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <button className="btn-outline" style={{ width: '100%', marginTop: '10px' }} onClick={onCSVDownloadTemplate}>
                                <Download size={14} style={{ marginRight: '6px' }} /> Download Sample CSV
                            </button>
                        </div>

                        {/* Paste Records */}
                        <div className="carbon-dashboard-card">
                            <h3 className="filter-title"><Upload size={14} style={{ marginRight: '6px' }} /> Paste CSV / JSON</h3>
                            <textarea 
                                className="search-input"
                                style={{ height: '100px', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', marginTop: '8px' }}
                                placeholder="name,latitude,longitude,city,state,energySource&#10;My Green Station,12.98,77.59,Bengaluru,Karnataka,Solar + Battery"
                                value={importText}
                                onChange={(e) => onImportTextChange(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="btn-primary" style={{ flex: 1, fontSize: '12px' }} onClick={onImportTextSubmit}>
                                    Load Data
                                </button>
                            </div>
                        </div>

                        {/* Backup exports */}
                        <div className="carbon-dashboard-card">
                            <h3 className="filter-title"><Download size={14} style={{ marginRight: '6px' }} /> Backup Database</h3>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button className="btn-outline" style={{ flex: 1 }} onClick={() => onExportBackup('json')}>
                                    Backup JSON
                                </button>
                                <button class="btn-outline" style={{ flex: 1 }} onClick={() => onExportBackup('csv')}>
                                    Backup CSV
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
