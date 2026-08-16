import React, { useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import { Compass, Leaf, BarChart2, ShieldAlert } from 'lucide-react';

export default function App() {
    const [route, setRoute] = useState('landing');

    const handleNavigate = (newRoute) => {
        setRoute(newRoute);
        // Scroll to top on navigation change
        window.scrollTo(0, 0);
    };

    // Render page content based on current route
    if (route === 'landing') {
        return <Landing onNavigate={handleNavigate} />;
    }

    if (route === 'dashboard') {
        return <Dashboard onNavigate={handleNavigate} initialTab="explore" />;
    }

    if (route === 'india-stations') {
        return <Dashboard onNavigate={handleNavigate} initialTab="explore" />;
    }

    if (route === 'carbon-impact') {
        return <Dashboard onNavigate={handleNavigate} initialTab="ai" />;
    }

    if (route === 'about') {
        return (
            <div className="landing-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar currentRoute="about" onNavigate={handleNavigate} />
                
                <main style={{ flex: 1, maxWidth: '800px', margin: '60px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '30px' }} role="main">
                    <header style={{ textAlign: 'center' }}>
                        <span className="hero-tag">About EcoMove AI</span>
                        <h2 style={{ fontSize: '36px', fontWeight: 800, marginTop: '12px' }}>Empowering Greener EV Mobility</h2>
                    </header>

                    <article className="about-panel-desc">
                        <h3>Our Core Thesis</h3>
                        <p>
                            Transitioning to an Electric Vehicle (EV) is a critical step towards reducing global carbon emissions. 
                            However, the electricity used to charge these vehicles is only as clean as the power grid supplying it. 
                            In India, where coal still powers a large share of the national electrical grid, EV charging emissions vary widely by geography and source.
                        </p>
                        <p style={{ marginTop: '12px' }}>
                            <strong>EcoMove AI</strong> is developed to solve this transparency gap. By identifying and highlighting stations backed by verified solar, battery storage, and wind energy tariffs, we empower users to align their vehicle charging with grid-efficiency peaks.
                        </p>
                    </article>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                        <div className="feature-card" style={{ padding: '20px', gap: '8px' }}>
                            <div className="feature-icon-wrapper" style={{ width: '36px', height: '36px', fontSize: '16px' }}>
                                <Compass size={18} />
                            </div>
                            <h4 style={{ color: 'white', fontSize: '16px' }}>Geospatial Analysis</h4>
                            <p style={{ fontSize: '12px' }}>Plots station data across multiple states, factoring in state-level grid baseline ratios.</p>
                        </div>

                        <div className="feature-card" style={{ padding: '20px', gap: '8px' }}>
                            <div className="feature-icon-wrapper" style={{ width: '36px', height: '36px', fontSize: '16px' }}>
                                <Leaf size={18} />
                            </div>
                            <h4 style={{ color: 'white', fontSize: '16px' }}>Clean Fuel Badges</h4>
                            <p style={{ fontSize: '12px' }}>Distinguishes off-grid solar generators, solar-storage hybrids, and standard grids.</p>
                        </div>

                        <div className="feature-card" style={{ padding: '20px', gap: '8px' }}>
                            <div className="feature-icon-wrapper" style={{ width: '36px', height: '36px', fontSize: '16px' }}>
                                <BarChart2 size={18} />
                            </div>
                            <h4 style={{ color: 'white', fontSize: '16px' }}>AI Carbon Score</h4>
                            <p style={{ fontSize: '12px' }}>Finds the carbon footprint sweet spot balancing user distance and charging source efficiency.</p>
                        </div>
                    </div>

                    <article className="about-panel-desc" style={{ borderColor: 'rgba(239, 68, 68, 0.15)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.03), transparent)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                            <ShieldAlert size={18} /> Anti-Greenwashing Promise
                        </h3>
                        <p style={{ fontSize: '13px', marginTop: '6px' }}>
                            We strictly label stations with unknown or unverified electricity inputs as <em>Energy source unknown</em>. 
                            We do not make physical claims that specific electrons can be directed, but rather estimate offsets using verified generation capacity data.
                        </p>
                    </article>
                </main>
            </div>
        );
    }

    return null;
}
