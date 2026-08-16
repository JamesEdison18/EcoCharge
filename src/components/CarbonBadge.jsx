import React from 'react';
import { calculateCarbonSavings } from '../data/stations';

export default function CarbonBadge({ station }) {
    const carbonMetric = calculateCarbonSavings(station);
    const pct = carbonMetric.savingPercentage;
    
    let grade = 'F';
    let labelColor = 'score-F';
    
    if (pct >= 90) {
        grade = 'A+';
        labelColor = 'score-A';
    } else if (pct >= 80) {
        grade = 'A';
        labelColor = 'score-A';
    } else if (pct >= 50) {
        grade = 'B';
        labelColor = 'score-B';
    } else if (pct >= 20) {
        grade = 'C';
        labelColor = 'score-C';
    } else if (pct > 0) {
        grade = 'D';
        labelColor = 'score-D';
    }
    
    return (
        <div className="carbon-score-indicator">
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Eco Score:</span>
            <span className={`carbon-letter ${labelColor}`} title={`Reduces carbon emissions by ${pct}% compared to baseline grid.`}>
                {grade}
            </span>
        </div>
    );
}
