/**
 * InfoPark - Main Application
 * Public app for finding parking meters and reporting issues
 */

import { CONFIG } from './config.js';
import { GeoService } from './modules/geo.js';
import { MapDataService } from './modules/mapdata.js';
import { TariffeService } from './modules/tariffe.js';

class InfoParkApp {
    constructor() {
        this.geo = new GeoService();
        this.mapData = new MapDataService();
        this.tariffe = new TariffeService();
        
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
        
        // Check cookie consent
        this.checkCookieConsent();
        
        // Pre-load map data and tariffe
        this.showLoading(true);
        await this.mapData.loadIndex();
        await this.tariffe.loadIndex();
        this.availableCities = this.mapData.getCityNames();
        this.showLoading(false);
        
        console.log('✅ InfoPark ready');
    }
    
    checkCookieConsent() {
        const cookieChoice = localStorage.getItem('cookieChoice');
        if (!cookieChoice) {
            // Show banner after 2 seconds
            setTimeout(() => {
                document.getElementById('cookieBanner').classList.add('visible');
            }, 2000);
        }
    }
    
    acceptCookies() {
        localStorage.setItem('cookieChoice', 'accepted');
        document.getElementById('cookieBanner').classList.remove('visible');
    }
    
    closeCookieBanner() {
        localStorage.setItem('cookieChoice', 'declined');
        document.getElementById('cookieBanner').classList.remove('visible');
    }
    
    checkGpsDisclaimer() {
        const disclaimerAccepted = localStorage.getItem('gpsDisclaimerAccepted');
        if (!disclaimerAccepted) {
            document.getElementById('gpsDisclaimer').style.display = 'flex';
            return false;
        }
        return true;
    }
    
    acceptGpsDisclaimer() {
        localStorage.setItem('gpsDisclaimerAccepted', 'true');
        document.getElementById('gpsDisclaimer').style.display = 'none';
        // Continue to open map after accepting
        this.openMap();
    }
    
    setupEventListeners() {
        // Cookie Consent
        document.getElementById('btnAcceptCookies').addEventListener('click', () => this.acceptCookies());
        document.getElementById('btnCloseCookies').addEventListener('click', () => this.closeCookieBanner());
        
        // GPS Disclaimer
        document.getElementById('btnAcceptDisclaimer').addEventListener('click', () => this.acceptGpsDisclaimer());
        
        // GPS Screen
        document.getElementById('btnEnableGps').addEventListener('click', () => this.requestGps());
        document.getElementById('btnRetryGps').addEventListener('click', () => this.requestGps());
        
        // Main Menu
        document.getElementById('btnTariffe').addEventListener('click', () => this.openTariffe());
        document.getElementById('btnFindParcometro').addEventListener('click', () => this.openMap());
        document.getElementById('btnReport').addEventListener('click', () => this.openReport());
        document.getElementById('btnPrivacy').addEventListener('click', () => this.openPrivacy());
        
        // Tariffe View
        document.getElementById('btnBackFromTariffe').addEventListener('click', () => this.showScreen('mainMenu'));
        
        // Map View
        document.getElementById('btnBackFromMap').addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('btnCenterMap').addEventListener('click', () => this.centerOnUser());
        document.getElementById('btnRefreshMap').addEventListener('click', () => this.refreshMapPosition());
        
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
    
    // ==================== TARIFFE ====================
    
    async openTariffe() {
        this.showScreen('tariffeView');
        
        document.getElementById('tariffeCity').textContent = this.currentCity || 'Caricamento...';
        document.getElementById('tariffeText').innerHTML = '<p class="tariffe-loading">Caricamento tariffe...</p>';
        
        try {
            const tariffeData = await this.tariffe.loadCity(this.currentCity);
            
            if (tariffeData) {
                document.getElementById('tariffeCity').textContent = tariffeData.city;
                document.getElementById('tariffeText').innerHTML = tariffeData.content;
            } else {
                document.getElementById('tariffeText').innerHTML = 
                    '<p class="tariffe-error">Visualizzabili a breve. Per le tariffe complete fare riferimento alla segnaletica verticale.</p>';
            }
        } catch (error) {
            console.error('Error loading tariffe:', error);
            document.getElementById('tariffeText').innerHTML = 
                '<p class="tariffe-error">Visualizzabili a breve. Per le tariffe complete fare riferimento alla segnaletica verticale.</p>';
        }
    }
    
    // ==================== PRIVACY ====================
    
    openPrivacy() {
        window.open('https://privacy.gestopark.it', '_blank');
    }
    
    // ==================== MAP ====================
    
    async openMap() {
        // Check if disclaimer was accepted
        const disclaimerAccepted = localStorage.getItem('gpsDisclaimerAccepted');
        if (!disclaimerAccepted) {
            document.getElementById('gpsDisclaimer').style.display = 'flex';
            return;
        }
        
        // Proceed to map
        this.showScreen('mapView');
        await this.initMap();
    }
    
    async initMap() {
        if (this.map) {
            this.map.invalidateSize();
            await this.loadParcometriNearby();
            return;
        }
        
        // Determine initial center
        let initialCenter = [45.5, 11.5]; // Default center Italy
        let hasValidPosition = this.userPosition && 
                               this.userPosition.lat !== 0 && 
                               this.userPosition.lon !== 0;
        
        if (hasValidPosition) {
            initialCenter = [this.userPosition.lat, this.userPosition.lon];
        }
        
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
            console.log(`🔍 Loading parcometri for city: ${this.currentCity}`);
            
            // Load data for current city
            const cityData = await this.mapData.loadCity(this.currentCity);
            
            if (cityData && cityData.points && cityData.points.length > 0) {
                this.allParcometri = cityData.points;
                console.log(`✅ Loaded ${this.allParcometri.length} parcometri for ${this.currentCity}`);
                this.updateVisibleParcometri();
            } else {
                console.log(`⚠️ No data for ${this.currentCity}`);
                this.allParcometri = [];
                this.showMapServiceUnavailable();
            }
            
        } catch (error) {
            console.error('Error loading parcometri:', error);
            this.allParcometri = [];
            this.showMapServiceUnavailable();
        }
        
        this.showLoading(false);
    }
    
    showMapServiceUnavailable() {
        // Clear markers
        this.parcometriMarkers.forEach(m => this.map.removeLayer(m));
        this.parcometriMarkers = [];
        
        // Update count
        document.getElementById('parcometriCount').textContent = '0 parcometri';
        
        // Show error message in list
        const listContainer = document.getElementById('parcometriList');
        listContainer.innerHTML = `
            <div class="parcometri-list-inner">
                <div class="service-unavailable">
                    <div class="service-unavailable-icon">🚧</div>
                    <p>Il servizio non è attualmente disponibile, verrà attivato presto.</p>
                </div>
            </div>
        `;
    }
    
    updateVisibleParcometri() {
        // Clear existing markers
        this.parcometriMarkers.forEach(m => this.map.removeLayer(m));
        this.parcometriMarkers = [];
        
        const hasValidPosition = this.userPosition && 
                                 this.userPosition.lat !== 0 && 
                                 this.userPosition.lon !== 0;
        
        // Calculate distance for all parcometri
        let parcometriToShow = this.allParcometri.map(p => {
            const distance = hasValidPosition 
                ? this.geo.calculateDistance(this.userPosition.lat, this.userPosition.lon, p.lat, p.lon)
                : null;
            return { ...p, distance };
        });
        
        // Sort by distance if we have valid position
        if (hasValidPosition) {
            parcometriToShow.sort((a, b) => a.distance - b.distance);
        }
        
        console.log(`📍 Showing ${parcometriToShow.length} parcometri on map`);
        
        // Add markers
        const bounds = [];
        parcometriToShow.forEach((p, index) => {
            const marker = L.marker([p.lat, p.lon])
                .bindPopup(this.createPopup(p, hasValidPosition, index + 1))
                .addTo(this.map);
            this.parcometriMarkers.push(marker);
            bounds.push([p.lat, p.lon]);
        });
        
        // Fit bounds to show all parcometri when manually selected or no GPS
        if (bounds.length > 0 && (this.cityManuallySelected || !hasValidPosition)) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        // Update count
        document.getElementById('parcometriCount').textContent = 
            `${parcometriToShow.length} parcometr${parcometriToShow.length === 1 ? 'o' : 'i'}`;
        
        // Render parcometri list
        this.renderParcometriList(parcometriToShow, hasValidPosition);
    }
    
    renderParcometriList(parcometri, hasValidPosition) {
        const listContainer = document.getElementById('parcometriList');
        
        if (parcometri.length === 0) {
            listContainer.innerHTML = '<div class="parcometri-empty">Nessun parcometro trovato</div>';
            return;
        }
        
        const items = parcometri.map((p, index) => {
            const distanceText = hasValidPosition && p.distance !== null
                ? `${Math.round(p.distance)} m`
                : '';
            
            return `
                <div class="parcometro-item" onclick="app.focusOnParcometro(${p.lat}, ${p.lon})">
                    <div class="parcometro-rank">${index + 1}</div>
                    <div class="parcometro-info">
                        <div class="parcometro-address">${this.escapeHtml(p.address || 'Parcometro')}</div>
                        ${distanceText ? `<div class="parcometro-distance">📍 ${distanceText}</div>` : ''}
                    </div>
                    <button class="parcometro-nav" onclick="event.stopPropagation(); app.navigateTo(${p.lat}, ${p.lon})">
                        🧭 Naviga
                    </button>
                </div>
            `;
        }).join('');
        
        // Wrap in inner container for proper scroll padding
        listContainer.innerHTML = `<div class="parcometri-list-inner">${items}</div>`;
    }
    
    focusOnParcometro(lat, lon) {
        this.map.setView([lat, lon], 18);
        
        // Find and open the marker popup
        this.parcometriMarkers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            if (Math.abs(markerLatLng.lat - lat) < 0.0001 && Math.abs(markerLatLng.lng - lon) < 0.0001) {
                marker.openPopup();
            }
        });
    }
    
    createPopup(parcometro, hasValidPosition, rank) {
        const distanceText = hasValidPosition && parcometro.distance 
            ? `<div style="font-size:0.8rem;color:#666;margin-bottom:8px;">📍 ${Math.round(parcometro.distance)} m da te</div>`
            : '';
        
        const rankBadge = rank 
            ? `<div style="font-size:0.75rem;color:#4C84BC;font-weight:600;margin-bottom:4px;">#${rank}</div>`
            : '';
        
        return `
            <div class="popup-content">
                ${rankBadge}
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
            this.showToast('📍 Mappa centrata sulla tua posizione', 'success');
        } else {
            this.showToast('Posizione non disponibile', 'error');
        }
    }
    
    async refreshMapPosition() {
        this.showToast('📍 Aggiornamento posizione GPS...', '');
        
        try {
            const coords = await this.geo.getCurrentPosition();
            this.userPosition = coords;
            
            // Update user marker
            if (this.userMarker) {
                this.userMarker.setLatLng([coords.lat, coords.lon]);
            } else {
                this.addUserMarker();
            }
            
            // Recalculate distances and update list
            this.updateVisibleParcometri();
            
            // Center on user
            this.map.setView([coords.lat, coords.lon], CONFIG.map.defaultZoom);
            
            this.showToast('✅ Posizione aggiornata! Classifica ricalcolata', 'success');
            
        } catch (error) {
            console.error('Error refreshing position:', error);
            this.showToast('❌ Errore aggiornamento posizione', 'error');
        }
    }
    
    navigateTo(lat, lon) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
        window.open(url, '_blank');
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