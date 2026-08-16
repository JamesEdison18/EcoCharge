import React from 'react';
import { Bolt, Plug } from 'lucide-react';

export default function FilterPanel({ activeFilters, onFilterChange }) {
    
    const energyOptions = [
        { label: 'All Sources', value: 'all' },
        { label: '☀️ Solar', value: 'Solar-powered' },
        { label: '🔋 Solar + Battery', value: 'Solar + Battery' },
        { label: '🌬️ Wind', value: 'Wind / verified renewable supply' },
        { label: '☀️🔌 Hybrid', value: 'Solar + Grid' },
        { label: '🔌 Grid', value: 'Grid-connected' },
        { label: '❓ Unknown', value: 'Energy source unknown' }
    ];

    const chargerOptions = [
        { label: 'All Chargers', value: 'all', icon: null },
        { label: 'CCS2 (DC Fast)', value: 'CCS2', icon: Bolt },
        { label: 'Type 2 (AC)', value: 'Type 2', icon: Plug }
    ];

    const handleEnergyClick = (value) => {
        onFilterChange({ ...activeFilters, energy: value });
    };

    const handleChargerClick = (value) => {
        onFilterChange({ ...activeFilters, charger: value });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Energy Filter Group */}
            <div className="filter-group">
                <span className="filter-title">Renewable Status / Energy Source</span>
                <div className="filter-pills" role="group" aria-label="Energy Source Filters">
                    {energyOptions.map(opt => (
                        <button
                            key={opt.value}
                            className={`filter-pill ${activeFilters.energy === opt.value ? 'active' : ''}`}
                            onClick={() => handleEnergyClick(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Charger Type Filter Group */}
            <div className="filter-group">
                <span className="filter-title">Charger Speed & Power</span>
                <div className="filter-pills" role="group" aria-label="Charger Type Filters">
                    {chargerOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                            <button
                                key={opt.value}
                                className={`filter-pill blue-pill ${activeFilters.charger === opt.value ? 'active' : ''}`}
                                onClick={() => handleChargerClick(opt.value)}
                            >
                                {Icon && <Icon size={13} style={{ marginRight: '4px' }} />}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
