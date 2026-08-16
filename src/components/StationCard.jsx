import React from 'react';
import EnergySourceBadge from './EnergySourceBadge';
import CarbonBadge from './CarbonBadge';

export default function StationCard({ station, isSelected, onClick }) {
    const distStr = station.distance !== undefined ? `${station.distance.toFixed(1)} km` : '';
    
    return (
        <div 
            className={`station-card ${isSelected ? 'selected' : ''}`} 
            onClick={onClick}
            role="button" 
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
        >
            <div className="card-top">
                <div className="card-name">{station.name}</div>
                <div className="card-distance">{distStr}</div>
            </div>
            
            <div className="card-meta">
                <span className="card-power">{station.chargingPower} kW</span>
                <EnergySourceBadge energySource={station.energySource} />
            </div>
            
            <div className="card-footer">
                <span>{station.city}, {station.state}</span>
                <CarbonBadge station={station} />
            </div>
        </div>
    );
}
