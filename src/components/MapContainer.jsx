import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getStationCarbonIntensity, ENERGY_SOURCES } from '../data/stations';

// Helper to determine the greenest station
function getGreenestStation(stations, userLocation) {
    if (!stations || stations.length === 0) return null;
    let bestStation = null;
    let minScore = Infinity;
    
    stations.forEach(station => {
        if (station.availability === 'Offline') return;
        const intensity = getStationCarbonIntensity(station);
        let score = intensity;
        
        if (userLocation && station.distance) {
            score += (station.distance * 15);
        }
        
        if (score < minScore) {
            minScore = score;
            bestStation = station;
        }
    });
    return bestStation;
}

export default function MapContainer({
    stations,
    selectedStation,
    userLocation,
    onSelectStation
}) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const userMarkerRef = useRef(null);

    // 1. Initialize Map
    useEffect(() => {
        if (mapInstance.current) return; // already initialized

        // Center on India by default
        mapInstance.current = L.map(mapRef.current, {
            center: [20.5937, 78.9629],
            zoom: 5,
            zoomControl: false
        });

        // Add zoom controls bottom-left
        L.control.zoom({ position: 'bottomleft' }).addTo(mapInstance.current);

        // Dark tiles matching sustainability dashboard
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(mapInstance.current);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // 2. Render Station Markers
    useEffect(() => {
        if (!mapInstance.current) return;

        // Clear existing markers
        Object.keys(markersRef.current).forEach(id => {
            mapInstance.current.removeLayer(markersRef.current[id]);
        });
        markersRef.current = {};

        const greenest = getGreenestStation(stations, userLocation);

        stations.forEach(station => {
            const energyDetails = ENERGY_SOURCES[station.energySource] || ENERGY_SOURCES["Energy source unknown"];
            
            let markerColor = 'var(--color-unknown)';
            if (energyDetails.class === 'pure-renewable') {
                markerColor = station.energySource.includes("Wind") ? 'var(--color-wind)' : 'var(--color-solar)';
            } else if (energyDetails.class === 'hybrid-green') {
                markerColor = 'var(--accent-green)';
            } else if (energyDetails.class === 'standard-grid') {
                markerColor = 'var(--color-grid)';
            }

            const isGreenest = greenest && station.id === greenest.id;
            
            // Custom marker HTML template
            const iconHtml = `
                <div class="custom-div-icon ${isGreenest ? 'recommended-marker' : ''}">
                    <div class="marker-pulse" style="background-color: ${markerColor}"></div>
                    <div class="marker-pin" style="background-color: ${markerColor}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
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
                .addTo(mapInstance.current)
                .on('click', () => {
                    onSelectStation(station.id);
                });

            // Bind tooltip
            marker.bindTooltip(`
                <div style="font-weight:600; font-family:var(--font-heading); color:#ffffff; padding: 2px;">
                    ${station.name}<br>
                    <span style="font-size:10px; color:${markerColor}">${energyDetails.icon} ${station.energySource}</span>
                </div>
            `, { direction: 'top', className: 'map-tooltip', opacity: 0.95 });

            markersRef.current[station.id] = marker;
        });
    }, [stations, userLocation, onSelectStation]);

    // 3. Update User GPS Location Marker
    useEffect(() => {
        if (!mapInstance.current || !userLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        } else {
            const userIcon = L.divIcon({
                html: `<div style="background-color: var(--accent-blue); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px var(--accent-blue); position: relative;"><div class="marker-pulse" style="background-color: var(--accent-blue); width:32px; height:32px; margin: -10px 0 0 -10px;"></div></div>`,
                className: 'user-gps-marker',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                .addTo(mapInstance.current)
                .bindTooltip("Your Location", { direction: 'top' });
        }

        // Center map view on user location
        mapInstance.current.setView([userLocation.lat, userLocation.lng], 11);
    }, [userLocation]);

    // 4. Pan to Selected Station
    useEffect(() => {
        if (!mapInstance.current || !selectedStation) return;
        
        mapInstance.current.setView(
            [selectedStation.latitude, selectedStation.longitude],
            13
        );

        if (markersRef.current[selectedStation.id]) {
            markersRef.current[selectedStation.id].openTooltip();
        }
    }, [selectedStation]);

    return (
        <div className="map-view-area">
            <div id="map-view-container" ref={mapRef}></div>
        </div>
    );
}
