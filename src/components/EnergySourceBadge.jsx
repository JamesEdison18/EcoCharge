import React from 'react';
import { ENERGY_SOURCES } from '../data/stations';

export default function EnergySourceBadge({ energySource }) {
    const energyInfo = ENERGY_SOURCES[energySource] || ENERGY_SOURCES["Energy source unknown"];
    
    let badgeClass = 'badge-unknown-source';
    if (energyInfo.class === 'pure-renewable') {
        badgeClass = 'badge-pure-renewable';
    } else if (energyInfo.class === 'hybrid-green') {
        badgeClass = 'badge-hybrid-green';
    } else if (energyInfo.class === 'standard-grid') {
        badgeClass = 'badge-standard-grid';
    }
    
    return (
        <span className={`energy-badge ${badgeClass}`}>
            <span>{energyInfo.icon}</span>
            <span>{energyInfo.name}</span>
        </span>
    );
}
