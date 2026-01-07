/**
 * InfoPark - Main Application
 * Public app for finding parking meters and reporting issues
 */

import { CONFIG } from './config.js';
import { GeoService } from './modules/geo.js';
import { MapDataService } from './modules/mapdata.js';

class InfoParkApp {
    constructor() {
        this.geo = new GeoService();
        this.mapData = new MapDataService();
        
        this.userPosition = null;
        this.currentCity = null;
        this.cityManuallySelected = false;
        this.map = null;
        this.userMarker = null;
        this.parcometriMarkers = [];
        this.nearestParcometro = null;
        this.allParcometri = [];
        this.availableCities = [];
        
        this.init();
    }
    
    async init() {
        console.log('🅿️ InfoPark initializing...');
        this.setupEventListeners();
        
        // Pre-load map data
        this.showLoading(true);
        await this.mapData.loadIndex();
        this.availableCities = this.mapData.getCityNames();
        this.showLoading(false);
        
        console.log('✅ InfoPark ready');
    }
    
    setupEventListeners() {
        // GPS Screen
        document.getElementById('btnEnableGps').addEventListener('click', () => this.requestGps());
        document.getElementById('btnRetryGps').addEventListener('click', () => this.requestGps());
        
        // Main Menu
        document.getElementById('btnFindParcometro').addEventListener('click', () => this.openMap());
        document.getElementById('btnReport').addEventListener('click', () => this.openReport());
        
        // Map View
        document.getElementById('btnBackFromMap').addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('btnCenterMap').addEventListener('click', () => this.centerOnUser());
        document.getElementById('btnNavigateNearest').addEventListener('click', () => this.navigateToNearest());
        
        // Report View
        document.getElementById('btnBackFromReport').addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('reportForm').addEventListener('submit', (e) => this.submitReport(e));
    }
    
    // ==================== GPS ====================
    
    async requestGps() {
        const errorDiv = document.getElementById('gpsError');
        const errorMsg = document.getElementById('gpsErrorMessage');
        
        errorDiv.style.display = 'none';
        document.getElementById('btnEnableGps').disabled = true;
        document.getElementById('btnEnableGps').textContent = '⏳ Rilevamento...';
        
        try {
            const coords = await this.geo.getCurrentPosition();
            this.userPosition = coords;
            
            // Try to detect city from coordinates
            const cityDetected = await this.detectCity(coords.lat, coords.lon);
            
            if (cityDetected && this.isCityAvailable(this.currentCity)) {
                // City detected and available
                this.showScreen('mainMenu');
            } else {
                // City not detected or not available - show selection
                this.showCitySelection('Non abbiamo trovato parcometri nella tua zona. Seleziona la città:');
            }
            
        } catch (error) {
            console.error('GPS Error:', error);
            errorMsg.textContent = error.message;
            errorDiv.style.display = 'block';
            
            document.getElementById('btnEnableGps').disabled = false;
            document.getElementById('btnEnableGps').textContent = '📍 Attiva Posizione';
        }
    }
    
    async detectCity(lat, lon) {
        try {
            const response = await fetch(
                `${CONFIG.nominatimUrl}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
                { headers: { 'Accept-Language': 'it' } }
            );
            const data = await response.json();
            
            const address = data.address || {};
            this.currentCity = address.city || address.town || address.village || address.municipality || null;
            
            return this.currentCity !== null;
            
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            this.currentCity = null;
            return false;
        }
    }
    
    isCityAvailable(cityName) {
        if (!cityName) return false;
        const cityLower = cityName.toLowerCase();
        return this.availableCities.some(c => 
            c.toLowerCase().includes(cityLower) || cityLower.includes(c.toLowerCase())
        );
    }
    
    // ==================== CITY SELECTION ====================
    
    showCitySelection(message) {
        // Update subtitle if provided
        if (message) {
            document.querySelector('.city-select-subtitle').textContent = message;
        }
        
        // Populate city list
        const cityList = document.getElementById('cityList');
        cityList.innerHTML = this.availableCities.map(city => 
            `<button class="city-btn" data-city="${this.escapeHtml(city)}">${this.escapeHtml(city)}</button>`
        ).join('');
        
        // Add click handlers
        cityList.querySelectorAll('.city-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectCity(btn.dataset.city));
        });
        
        this.showScreen('citySelectScreen');
    }
    
    selectCity(cityName) {
        this.currentCity = cityName;
        this.cityManuallySelected = true;
        
        // If no GPS position, set a default position for the city (will be updated when map loads)
        if (!this.userPosition) {
            // Use a temporary position - will be centered on parcometri instead
            this.userPosition = { lat: 0, lon: 0, accuracy: 0 };
        }
        
        this.showScreen('mainMenu');
        this.showToast(`Città selezionata: ${cityName}`, 'success');
    }
    
    // ==================== SCREENS ====================
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId)?.classList.add('active');
        
        if (screenId === 'mapView') {
            setTimeout(() => this.initMap(), 100);
        }
    }
    
    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }
    
    // ==================== MAP ====================
    
    async openMap() {
        this.showScreen('mapView');
    }
    
    async initMap() {
        if (this.map) {
            this.map.invalidateSize();
            this.loadParcometriNearby();
            return;
        }
        
        // Determine initial center
        let initialCenter = [this.userPosition.lat, this.userPosition.lon];
        let hasValidPosition = this.userPosition.lat !== 0 && this.userPosition.lon !== 0;
        
        // Create map
        this.map = L.map('map', {
            center: initialCenter,
            zoom: hasValidPosition ? CONFIG.map.defaultZoom : 10,
            zoomControl: true
        });
        
        L.tileLayer(CONFIG.map.tileLayer, {
            attribution: CONFIG.map.attribution,
            maxZoom: 19
        }).addTo(this.map);
        
        // Add user marker only if we have a valid position
        if (hasValidPosition) {
            this.addUserMarker();
        }
        
        // Load parcometri
        await this.loadParcometriNearby();
    }
    
    addUserMarker() {
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }
        
        const userIcon = L.divIcon({
            className: 'user-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        this.userMarker = L.marker(
            [this.userPosition.lat, this.userPosition.lon],
            { icon: userIcon, zIndexOffset: 1000 }
        ).addTo(this.map);
        
        this.userMarker.bindPopup('<b>Tu sei qui</b>');
    }
    
    async loadParcometriNearby() {
        this.showLoading(true);
        
        try {
            // Load data for current city
            const cityData = await this.mapData.loadCity(this.currentCity);
            
            if (cityData) {
                this.allParcometri = cityData.points;
            } else {
                this.allParcometri = await this.mapData.loadAllCities();
            }
            
            this.updateVisibleParcometri();
            
        } catch (error) {
            console.error('Error loading parcometri:', error);
            this.showToast('Errore nel caricamento dei parcometri', 'error');
        }
        
        this.showLoading(false);
    }
    
    updateVisibleParcometri() {
        // Clear existing markers
        this.parcometriMarkers.forEach(m => this.map.removeLayer(m));
        this.parcometriMarkers = [];
        
        const hasValidPosition = this.userPosition.lat !== 0 && this.userPosition.lon !== 0;
        const radius = CONFIG.map.maxRadius;
        
        let parcometriToShow;
        
        if (hasValidPosition) {
            // Filter by distance
            parcometriToShow = this.allParcometri.filter(p => {
                const distance = this.geo.calculateDistance(
                    this.userPosition.lat, this.userPosition.lon,
                    p.lat, p.lon
                );
                p.distance = distance;
                return distance <= radius;
            });
            parcometriToShow.sort((a, b) => a.distance - b.distance);
        } else {
            // Show all parcometri for the city (no distance filter)
            parcometriToShow = this.allParcometri.map(p => ({ ...p, distance: null }));
        }
        
        // Add markers
        const bounds = [];
        parcometriToShow.forEach(p => {
            const marker = L.marker([p.lat, p.lon])
                .bindPopup(this.createPopup(p, hasValidPosition))
                .addTo(this.map);
            this.parcometriMarkers.push(marker);
            bounds.push([p.lat, p.lon]);
        });
        
        // Fit bounds if no valid position or if we have parcometri
        if (bounds.length > 0 && (!hasValidPosition || this.cityManuallySelected)) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        // Update info
        const countText = hasValidPosition 
            ? `${parcometriToShow.length} parcometr${parcometriToShow.length === 1 ? 'o' : 'i'}`
            : `${parcometriToShow.length} parcometr${parcometriToShow.length === 1 ? 'o' : 'i'} a ${this.currentCity}`;
        
        document.getElementById('parcometriCount').textContent = countText;
        document.getElementById('radiusDisplay').textContent = hasValidPosition ? radius : '--';
        
        // Show nearest panel only if we have valid position
        if (hasValidPosition && parcometriToShow.length > 0) {
            this.nearestParcometro = parcometriToShow[0];
            document.getElementById('nearestParcometro').style.display = 'block';
            document.getElementById('nearestDistance').textContent = 
                `${Math.round(this.nearestParcometro.distance)} m`;
            document.getElementById('nearestAddress').textContent = 
                this.nearestParcometro.address || 'Indirizzo non disponibile';
        } else {
            document.getElementById('nearestParcometro').style.display = 'none';
        }
    }
    
    createPopup(parcometro, hasValidPosition) {
        const distanceText = hasValidPosition && parcometro.distance 
            ? `<div style="font-size:0.8rem;color:#666;margin-bottom:8px;">${Math.round(parcometro.distance)} m da te</div>`
            : '';
        
        return `
            <div class="popup-content">
                <div class="popup-address">${this.escapeHtml(parcometro.address || 'Parcometro')}</div>
                ${distanceText}
                <a href="https://www.google.com/maps/dir/?api=1&destination=${parcometro.lat},${parcometro.lon}" 
                   target="_blank" class="popup-btn">🧭 Naviga</a>
            </div>
        `;
    }
    
    centerOnUser() {
        if (this.map && this.userPosition && this.userPosition.lat !== 0) {
            this.map.setView([this.userPosition.lat, this.userPosition.lon], CONFIG.map.defaultZoom);
        } else {
            this.showToast('Posizione non disponibile', 'error');
        }
    }
    
    navigateToNearest() {
        if (this.nearestParcometro) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${this.nearestParcometro.lat},${this.nearestParcometro.lon}`;
            window.open(url, '_blank');
        }
    }
    
    // ==================== REPORT ====================
    
    openReport() {
        // Pre-fill city (from detection or manual selection)
        document.getElementById('reportCity').value = this.currentCity || '';
        
        // Pre-fill coords if available
        if (this.userPosition && this.userPosition.lat !== 0) {
            document.getElementById('reportCoords').value = 
                `${this.userPosition.lat.toFixed(6)}, ${this.userPosition.lon.toFixed(6)}`;
        } else {
            document.getElementById('reportCoords').value = 'Non disponibile';
        }
        
        document.getElementById('reportAddress').value = '';
        document.getElementById('reportDescription').value = '';
        
        this.showScreen('reportView');
    }
    
    submitReport(event) {
        event.preventDefault();
        
        const city = document.getElementById('reportCity').value;
        const address = document.getElementById('reportAddress').value;
        const description = document.getElementById('reportDescription').value;
        const coords = document.getElementById('reportCoords').value;
        
        // Build email
        const subject = encodeURIComponent(`Segnalazione malfunzionamento - ${city}`);
        const body = encodeURIComponent(
`SEGNALAZIONE MALFUNZIONAMENTO PARCOMETRO

Città: ${city}
Indirizzo/Zona: ${address}
Coordinate GPS: ${coords}

DESCRIZIONE:
${description}

---
Inviato da InfoPark`
        );
        
        // Open email client
        window.location.href = `mailto:${CONFIG.reportEmail}?subject=${subject}&body=${body}`;
        
        this.showToast('Apertura client email...', 'success');
        
        // Go back to menu after a delay
        setTimeout(() => this.showScreen('mainMenu'), 1000);
    }
    
    // ==================== UTILITIES ====================
    
    showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast visible' + (type ? ` ${type}` : '');
        setTimeout(() => toast.classList.remove('visible'), 3000);
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Start app
window.app = new InfoParkApp();
