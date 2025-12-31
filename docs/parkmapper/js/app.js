/**
 * ParkMapper v2 - Main Application
 */

import { CONFIG, isAuthorized } from './config.js';
import { StorageService } from './modules/storage.js';
import { GeoService } from './modules/geo.js';
import { ExportService } from './modules/export.js';
import { ImportService } from './modules/import.js';

class ParkMapperApp {
    constructor() {
        this.storage = new StorageService();
        this.geo = new GeoService();
        this.export = new ExportService();
        this.import = new ImportService();
        
        this.currentUser = null;
        this.currentMode = null;
        this.currentStep = 1;
        this.sessionData = { city: '', points: [] };
        this.uploadedData = { city: '', points: [], filename: '' };
        this.currentCoords = null;
        this.miniMap = null;
        this.miniMapMarker = null;
        this.fullMap = null;
        this.fullMapMarkers = [];
        
        this.init();
    }
    
    async init() {
        console.log('🅿️ ParkMapper v2 initializing...');
        this.checkSavedSession();
        this.setupEventListeners();
        this.populateCitySuggestions();
        console.log('✅ ParkMapper ready');
    }
    
    checkSavedSession() {
        const savedEmail = localStorage.getItem('parkMapper_user');
        if (savedEmail && isAuthorized(savedEmail)) {
            this.currentUser = savedEmail;
            this.showMainApp();
            
            const savedSession = localStorage.getItem('parkMapper_session');
            if (savedSession) {
                try {
                    this.sessionData = JSON.parse(savedSession);
                    if (this.sessionData.city && this.sessionData.points.length > 0) {
                        this.showResumeSession();
                    }
                } catch (e) { console.warn('Could not restore session:', e); }
            }
        }
    }
    
    showResumeSession() {
        document.getElementById('resumeSession').style.display = 'block';
        document.getElementById('resumeCity').textContent = this.sessionData.city;
        document.getElementById('resumeCount').textContent = this.sessionData.points.length;
    }
    
    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        
        document.getElementById('btnModeRecord').addEventListener('click', () => this.selectMode('record'));
        document.getElementById('btnModeUpload').addEventListener('click', () => this.selectMode('upload'));
        document.getElementById('btnResumeSession')?.addEventListener('click', () => this.resumeSession());
        document.getElementById('btnDiscardSession')?.addEventListener('click', () => this.discardSession());
        
        document.getElementById('btnBackToMode').addEventListener('click', () => this.showModeSelection());
        document.getElementById('btnSelectFile').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('btnCancelUpload').addEventListener('click', () => this.cancelUpload());
        document.getElementById('btnConfirmUpload').addEventListener('click', () => this.confirmUpload());
        
        document.getElementById('btnBackToUpload').addEventListener('click', () => this.showSection('uploadSection'));
        document.getElementById('btnExportFromMap').addEventListener('click', () => this.exportUploadedData());
        
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
        uploadZone.addEventListener('dragleave', (e) => { e.preventDefault(); uploadZone.classList.remove('dragover'); });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) this.processFile(e.dataTransfer.files[0]);
        });
        
        document.getElementById('btnBackToModeFromRecord').addEventListener('click', () => this.backToModeFromRecord());
        document.getElementById('cityName').addEventListener('input', () => this.validateStep1());
        document.getElementById('btnToStep2').addEventListener('click', () => this.goToStep(2));
        document.getElementById('parcometroId').addEventListener('input', () => this.validateStep2());
        document.getElementById('btnBackToStep1').addEventListener('click', () => this.goToStep(1));
        document.getElementById('btnToStep3').addEventListener('click', () => this.goToStep(3));
        document.getElementById('getLocationBtn').addEventListener('click', () => this.getLocation());
        document.getElementById('btnBackToStep2').addEventListener('click', () => this.goToStep(2));
        document.getElementById('btnSavePoint').addEventListener('click', () => this.savePoint());
        document.getElementById('btnAddAnother').addEventListener('click', () => this.goToStep(2));
        document.getElementById('btnFinishSession').addEventListener('click', () => this.finishSession());
        document.getElementById('btnViewAll').addEventListener('click', () => this.showAllPoints());
        document.getElementById('btnBackToStep4').addEventListener('click', () => this.goToStep(4));
        document.getElementById('btnDownloadFromView').addEventListener('click', () => this.finishSession());
        document.getElementById('btnRetryGps')?.addEventListener('click', () => this.getLocation());
    }
    
    populateCitySuggestions() {
        const datalist = document.getElementById('citySuggestions');
        CONFIG.citySuggestions.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            datalist.appendChild(option);
        });
    }
    
    handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const errorEl = document.getElementById('loginError');
        
        if (!email) { errorEl.textContent = 'Inserisci un indirizzo email'; return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = 'Formato email non valido'; return; }
        if (!isAuthorized(email)) { errorEl.textContent = 'Email non autorizzata. Contatta l\'amministratore.'; return; }
        
        this.currentUser = email;
        localStorage.setItem('parkMapper_user', email);
        errorEl.textContent = '';
        this.showMainApp();
        this.showToast('Benvenuto!', 'success');
    }
    
    handleLogout() {
        if (this.sessionData.points.length > 0 && !confirm('Hai punti non salvati. Vuoi davvero uscire?')) return;
        this.currentUser = null;
        localStorage.removeItem('parkMapper_user');
        localStorage.removeItem('parkMapper_session');
        this.sessionData = { city: '', points: [] };
        document.getElementById('mainApp').classList.remove('active');
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('loginForm').reset();
    }
    
    showMainApp() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        document.getElementById('userEmail').textContent = this.currentUser;
        
        // Request GPS permission immediately after login
        this.requestGpsPermission();
    }
    
    async requestGpsPermission() {
        // Check if we already have permission (via Permissions API if available)
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                console.log('GPS permission status:', result.state);
                
                if (result.state === 'granted') {
                    // Already have permission, no need to ask
                    return;
                }
            } catch (e) {
                console.log('Permissions API not supported, will request directly');
            }
        }
        
        // Request position to trigger browser permission dialog
        try {
            await this.geo.getCurrentPosition();
            console.log('GPS permission granted');
            this.showToast('📍 GPS attivato!', 'success');
        } catch (error) {
            console.log('GPS permission not granted:', error.message);
            // Don't show error here - user will see it when they try to record
        }
    }
    
    selectMode(mode) {
        this.currentMode = mode;
        if (mode === 'record') {
            this.showSection('recordSection');
            setTimeout(() => this.initMiniMap(), 300);
        } else {
            this.showSection('uploadSection');
        }
    }
    
    showModeSelection() {
        this.showSection('modeSelection');
        this.currentMode = null;
    }
    
    showSection(sectionId) {
        document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId)?.classList.add('active');
    }
    
    resumeSession() {
        document.getElementById('resumeSession').style.display = 'none';
        document.getElementById('cityName').value = this.sessionData.city;
        this.selectMode('record');
        setTimeout(() => this.goToStep(2), 100);
    }
    
    discardSession() {
        this.sessionData = { city: '', points: [] };
        localStorage.removeItem('parkMapper_session');
        document.getElementById('resumeSession').style.display = 'none';
    }
    
    backToModeFromRecord() {
        if (this.sessionData.points.length > 0 && !confirm('Hai punti non salvati. Tornare al menu principale?')) return;
        this.showModeSelection();
        this.resetWizardState();
    }
    
    handleFileSelect(e) {
        if (e.target.files[0]) this.processFile(e.target.files[0]);
        e.target.value = '';
    }
    
    async processFile(file) {
        try {
            const result = await this.import.fromFile(file);
            this.uploadedData = { city: result.city, points: result.points, filename: file.name };
            this.showUploadPreview();
        } catch (error) {
            console.error('Import error:', error);
            this.showToast(error.message, 'error');
        }
    }
    
    showUploadPreview() {
        document.getElementById('uploadZone').style.display = 'none';
        document.getElementById('uploadPreview').style.display = 'block';
        document.getElementById('previewFilename').textContent = this.uploadedData.filename;
        document.getElementById('previewCity').textContent = this.uploadedData.city;
        document.getElementById('previewCount').textContent = this.uploadedData.points.length;
        
        const previewList = document.getElementById('previewList');
        previewList.innerHTML = this.uploadedData.points.slice(0, 5).map(p => 
            `<div class="preview-item"><strong>${this.escapeHtml(String(p.name))}</strong> - ${this.escapeHtml(p.address || 'N/A')}</div>`
        ).join('');
        if (this.uploadedData.points.length > 5) {
            previewList.innerHTML += `<div class="preview-item">... e altri ${this.uploadedData.points.length - 5} punti</div>`;
        }
    }
    
    cancelUpload() {
        document.getElementById('uploadZone').style.display = 'block';
        document.getElementById('uploadPreview').style.display = 'none';
        this.uploadedData = { city: '', points: [], filename: '' };
    }
    
    confirmUpload() {
        this.showSection('mapViewSection');
        setTimeout(() => { this.initFullMap(); this.displayUploadedPoints(); }, 100);
    }
    
    initFullMap() {
        if (this.fullMap) this.fullMap.remove();
        this.fullMap = L.map('fullMap', { center: CONFIG.map.defaultCenter, zoom: CONFIG.map.defaultZoom });
        L.tileLayer(CONFIG.map.tileLayer, { attribution: CONFIG.map.attribution, maxZoom: 19 }).addTo(this.fullMap);
        setTimeout(() => this.fullMap.invalidateSize(), 100);
    }
    
    displayUploadedPoints() {
        document.getElementById('mapCity').textContent = this.uploadedData.city;
        document.getElementById('mapCount').textContent = `${this.uploadedData.points.length} punti`;
        
        this.fullMapMarkers.forEach(m => this.fullMap.removeLayer(m));
        this.fullMapMarkers = [];
        const bounds = [];
        
        this.uploadedData.points.forEach(point => {
            let lat = point.latDecimal || point.lat / 10000;
            let lon = point.lonDecimal || point.lon / 10000;
            
            const marker = L.marker([lat, lon])
                .bindPopup(`<strong>${this.escapeHtml(String(point.name))}</strong><br>${this.escapeHtml(point.address || '')}<br><button onclick="app.navigateTo(${lat}, ${lon})" style="margin-top:8px;padding:4px 8px;">🧭 Naviga</button>`)
                .addTo(this.fullMap);
            
            this.fullMapMarkers.push(marker);
            bounds.push([lat, lon]);
        });
        
        if (bounds.length > 0) this.fullMap.fitBounds(bounds, { padding: [20, 20] });
        
        document.getElementById('mapPointsList').innerHTML = this.uploadedData.points.map(p => {
            let lat = p.latDecimal || p.lat / 10000;
            let lon = p.lonDecimal || p.lon / 10000;
            return `<div class="preview-item" style="cursor:pointer" onclick="app.focusPoint(${lat}, ${lon})"><strong>${this.escapeHtml(String(p.name))}</strong> - ${this.escapeHtml(p.address || 'N/A')}</div>`;
        }).join('');
    }
    
    focusPoint(lat, lon) { this.fullMap.setView([lat, lon], 18); }
    exportUploadedData() { this.export.toExcel(this.uploadedData.city, this.uploadedData.points); this.showToast('File esportato!', 'success'); }
    
    goToStep(stepNumber) {
        if (stepNumber > this.currentStep) {
            if (this.currentStep === 1 && !this.validateStep1()) return;
            if (this.currentStep === 2 && !this.validateStep2()) return;
        }
        this.currentStep = stepNumber;
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
        document.getElementById(`step${stepNumber}`)?.classList.add('active');
        this.updateStepsNav();
        
        if (stepNumber === 2) this.setupStep2();
        else if (stepNumber === 3) this.setupStep3();
        else if (stepNumber === 4) this.setupStep4();
    }
    
    updateStepsNav() {
        document.querySelectorAll('.steps-nav .step').forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            if (stepNum === this.currentStep) step.classList.add('active');
            else if (stepNum < this.currentStep) step.classList.add('completed');
        });
    }
    
    validateStep1() {
        const city = document.getElementById('cityName').value.trim();
        const isValid = city.length >= 2;
        document.getElementById('btnToStep2').disabled = !isValid;
        if (isValid) { this.sessionData.city = city; this.saveSession(); }
        return isValid;
    }
    
    validateStep2() {
        const isValid = document.getElementById('parcometroId').value.trim().length >= 1;
        document.getElementById('btnToStep3').disabled = !isValid;
        return isValid;
    }
    
    setupStep2() {
        document.getElementById('displayCity').textContent = this.sessionData.city;
        this.updatePointCount();
        document.getElementById('parcometroId').value = '';
        document.getElementById('indirizzo').value = '';
        document.getElementById('parcometroId').focus();
        this.validateStep2();
    }
    
    setupStep3() {
        document.getElementById('displayParcometro').textContent = `📍 ${document.getElementById('parcometroId').value.trim()}`;
        this.currentCoords = null;
        document.getElementById('currentLat').textContent = '--';
        document.getElementById('currentLon').textContent = '--';
        document.getElementById('gpsStatus').textContent = '';
        document.getElementById('gpsStatus').className = 'gps-status';
        document.getElementById('btnSavePoint').disabled = true;
        document.getElementById('gpsHelp').style.display = 'none';
        if (this.miniMapMarker && this.miniMap) { this.miniMap.removeLayer(this.miniMapMarker); this.miniMapMarker = null; }
        if (this.miniMap) setTimeout(() => this.miniMap.invalidateSize(), 100);
        
        // Auto-detect position if permission was already granted
        this.autoDetectIfPermitted();
    }
    
    async autoDetectIfPermitted() {
        // Check if we already have permission
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                if (result.state === 'granted') {
                    // Permission already granted, auto-detect
                    this.getLocation();
                }
            } catch (e) {
                // Permissions API not supported, don't auto-detect
            }
        }
    }
    
    setupStep4() {
        const lastPoint = this.sessionData.points[this.sessionData.points.length - 1];
        if (lastPoint) {
            document.getElementById('summaryParcometro').textContent = lastPoint.name;
            document.getElementById('summaryIndirizzo').textContent = lastPoint.address || '-';
            document.getElementById('summaryCoords').textContent = `${lastPoint.lat}, ${lastPoint.lon}`;
            document.getElementById('summaryDateTime').textContent = lastPoint.dateTime;
        }
        document.getElementById('totalPoints').textContent = this.sessionData.points.length;
    }
    
    initMiniMap() {
        if (this.miniMap) return;
        this.miniMap = L.map('miniMap', { center: CONFIG.map.defaultCenter, zoom: CONFIG.map.defaultZoom, zoomControl: true });
        L.tileLayer(CONFIG.map.tileLayer, { attribution: CONFIG.map.attribution, maxZoom: 19 }).addTo(this.miniMap);
        this.miniMap.locate({ setView: true, maxZoom: 16 });
    }
    
    async getLocation() {
        const statusEl = document.getElementById('gpsStatus');
        const helpEl = document.getElementById('gpsHelp');
        
        // Hide help if visible
        helpEl.style.display = 'none';
        
        statusEl.innerHTML = '<span class="gps-loading-spinner"></span> Rilevamento posizione in corso...';
        statusEl.className = 'gps-status loading';
        
        try {
            const coords = await this.geo.getCurrentPosition();
            this.currentCoords = coords;
            document.getElementById('currentLat').textContent = Math.round(coords.lat * 10000);
            document.getElementById('currentLon').textContent = Math.round(coords.lon * 10000);
            statusEl.innerHTML = `✅ Posizione rilevata con precisione di ±${coords.accuracy.toFixed(0)} metri`;
            statusEl.className = 'gps-status success';
            document.getElementById('btnSavePoint').disabled = false;
            
            if (this.miniMap) {
                this.miniMap.setView([coords.lat, coords.lon], 17);
                if (this.miniMapMarker) this.miniMap.removeLayer(this.miniMapMarker);
                this.miniMapMarker = L.marker([coords.lat, coords.lon]).addTo(this.miniMap);
            }
            
            // Vibrate on success (if supported)
            if (navigator.vibrate) navigator.vibrate(100);
            
        } catch (error) {
            console.error('GPS Error:', error);
            statusEl.innerHTML = `❌ ${error.message}`;
            statusEl.className = 'gps-status error';
            document.getElementById('btnSavePoint').disabled = true;
            
            // Always show help on any GPS error
            helpEl.style.display = 'block';
            
            // Scroll to help after a small delay
            setTimeout(() => {
                helpEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
    
    savePoint() {
        if (!this.currentCoords) { this.showToast('Rileva prima la posizione GPS', 'error'); return; }
        const now = new Date();
        const point = {
            id: Date.now().toString(),
            name: document.getElementById('parcometroId').value.trim(),
            address: document.getElementById('indirizzo').value.trim(),
            lat: Math.round(this.currentCoords.lat * 10000),
            lon: Math.round(this.currentCoords.lon * 10000),
            latDecimal: this.currentCoords.lat,
            lonDecimal: this.currentCoords.lon,
            dateTime: this.formatDateTime(now),
            timestamp: now.toISOString()
        };
        this.sessionData.points.push(point);
        this.saveSession();
        this.showToast('Punto salvato!', 'success');
        this.goToStep(4);
    }
    
    finishSession() {
        if (this.sessionData.points.length === 0) { this.showToast('Nessun punto da esportare', 'error'); return; }
        this.export.toExcel(this.sessionData.city, this.sessionData.points);
        this.showToast(`File scaricato con ${this.sessionData.points.length} punti!`, 'success');
        setTimeout(() => { if (confirm('Vuoi iniziare una nuova sessione?')) this.resetSession(); }, 500);
    }
    
    resetSession() {
        this.sessionData = { city: '', points: [] };
        localStorage.removeItem('parkMapper_session');
        document.getElementById('cityName').value = '';
        this.showModeSelection();
        this.resetWizardState();
    }
    
    resetWizardState() {
        this.currentStep = 1;
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
        document.getElementById('step1')?.classList.add('active');
        this.updateStepsNav();
    }
    
    saveSession() { localStorage.setItem('parkMapper_session', JSON.stringify(this.sessionData)); }
    
    showAllPoints() {
        document.getElementById('step4').classList.remove('active');
        document.getElementById('viewAllSection').classList.add('active');
        document.getElementById('viewCity').textContent = this.sessionData.city;
        document.getElementById('viewCount').textContent = this.sessionData.points.length;
        
        const container = document.getElementById('pointsList');
        container.innerHTML = this.sessionData.points.map((point, index) => `
            <div class="point-card">
                <div class="point-card-header"><span class="point-name">${this.escapeHtml(point.name)}</span><span class="point-meta">#${index + 1}</span></div>
                <div class="point-address">${this.escapeHtml(point.address) || '-'}</div>
                <div class="point-coords">${point.lat}, ${point.lon}</div>
                <div class="point-meta">${point.dateTime}</div>
                <div class="point-actions">
                    <button class="btn btn-secondary" onclick="app.navigateTo(${point.latDecimal}, ${point.lonDecimal})">🧭 Naviga</button>
                    <button class="btn btn-danger" onclick="app.deletePoint('${point.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    navigateTo(lat, lon) { window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank'); }
    
    deletePoint(pointId) {
        if (!confirm('Eliminare questo punto?')) return;
        this.sessionData.points = this.sessionData.points.filter(p => p.id !== pointId);
        this.saveSession();
        this.showAllPoints();
        this.showToast('Punto eliminato', 'success');
    }
    
    updatePointCount() { document.getElementById('pointCount').textContent = this.sessionData.points.length; }
    
    formatDateTime(date) {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`;
    }
    
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

window.app = new ParkMapperApp();
