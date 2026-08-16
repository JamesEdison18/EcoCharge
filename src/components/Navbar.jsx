import React from 'react';
import { Leaf } from 'lucide-react';

export default function Navbar({ currentRoute, onNavigate }) {
    return (
        <header class="navbar-header" role="banner">
            <div class="nav-logo" onClick={() => onNavigate('landing')}>
                <Leaf className="logo-icon-svg" />
                <h1>EcoMove <span>AI</span></h1>
            </div>
            
            <nav role="navigation" aria-label="Main navigation">
                <ul class="nav-menu">
                    <li>
                        <a 
                            className={`nav-link ${currentRoute === 'landing' ? 'active' : ''}`}
                            onClick={() => onNavigate('landing')}
                        >
                            Home
                        </a>
                    </li>
                    <li>
                        <a 
                            className={`nav-link ${currentRoute === 'dashboard' ? 'active' : ''}`}
                            onClick={() => onNavigate('dashboard')}
                        >
                            Find Chargers
                        </a>
                    </li>
                    <li>
                        <a 
                            className={`nav-link ${currentRoute === 'india-stations' ? 'active' : ''}`}
                            onClick={() => onNavigate('india-stations')}
                        >
                            India Stations
                        </a>
                    </li>
                    <li>
                        <a 
                            className={`nav-link ${currentRoute === 'carbon-impact' ? 'active' : ''}`}
                            onClick={() => onNavigate('carbon-impact')}
                        >
                            Carbon Impact
                        </a>
                    </li>
                    <li>
                        <a 
                            className={`nav-link ${currentRoute === 'about' ? 'active' : ''}`}
                            onClick={() => onNavigate('about')}
                        >
                            About
                        </a>
                    </li>
                    <li>
                        <button 
                            class="nav-btn-green"
                            onClick={() => onNavigate('dashboard')}
                        >
                            Launch Map
                        </button>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
