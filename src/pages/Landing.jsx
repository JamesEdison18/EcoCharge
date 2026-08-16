import React from 'react';
import { ShieldCheck, Wind, BatteryCharging, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Landing({ onNavigate }) {
    return (
        <div className="landing-container">
            <Navbar currentRoute="landing" onNavigate={onNavigate} />
            
            <main className="hero-section" role="main">
                <span className="hero-tag">EcoMove AI v1.0</span>
                
                <h2 className="hero-title">
                    Find the <span>greenest</span><br />place to charge.
                </h2>
                
                <p className="hero-subtitle">
                    AI-powered EV charging recommendations based on renewable energy availability, state grid carbon-intensities, and verified clean sources.
                </p>
                
                <div className="hero-actions">
                    <button 
                        className="btn-primary btn-lg" 
                        onClick={() => onNavigate('dashboard')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        Find Green Chargers <ChevronRight size={18} />
                    </button>
                    <button 
                        className="btn-outline btn-lg"
                        onClick={() => onNavigate('dashboard')}
                    >
                        Explore India Stations
                    </button>
                </div>
            </main>

            <section className="features-grid" aria-label="EcoMove Key Strengths">
                <div className="feature-card">
                    <div className="feature-icon-wrapper">
                        <Wind size={24} />
                    </div>
                    <h3>100% Renewable Verification</h3>
                    <p>Identify chargers backed by verified on-site solar, utility battery storage, or green wind-energy purchase contracts.</p>
                </div>

                <div className="feature-card blue-icon">
                    <div className="feature-icon-wrapper">
                        <BatteryCharging size={24} />
                    </div>
                    <h3>State-wise Grid Carbon Index</h3>
                    <p>Accurately estimates charging-related carbon impact based on real-time and baseline state power-generation grids across India.</p>
                </div>

                <div className="feature-card purple-icon">
                    <div className="feature-icon-wrapper">
                        <ShieldCheck size={24} />
                    </div>
                    <h3>Zero Greenwashing Policy</h3>
                    <p>Clear, unverified energy sources are flagged as <em>Grid-connected (Unknown Source)</em>. Honest calculations for real climate action.</p>
                </div>
            </section>
        </div>
    );
}
