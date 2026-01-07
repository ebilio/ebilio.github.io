/**
 * Geo Service Module for InfoPark
 */

import { CONFIG } from '../config.js';

const GEO_ERROR = {
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3
};

export class GeoService {
    constructor() {
        this.options = CONFIG.gps;
    }
    
    isAvailable() {
        return 'geolocation' in navigator;
    }
    
    isSecureContext() {
        return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
    }
    
    async getCurrentPosition() {
        if (!this.isSecureContext()) {
            const error = new Error('Richiesta connessione sicura (HTTPS)');
            error.showHelp = true;
            throw error;
        }
        
        if (!this.isAvailable()) {
            const error = new Error('Geolocalizzazione non supportata');
            error.showHelp = true;
            throw error;
        }
        
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (geoError) => {
                    reject(this.parseError(geoError));
                },
                this.options
            );
        });
    }
    
    parseError(geoError) {
        let message;
        
        switch (geoError.code) {
            case GEO_ERROR.PERMISSION_DENIED:
                message = 'Accesso alla posizione negato';
                break;
            case GEO_ERROR.POSITION_UNAVAILABLE:
                message = 'Posizione non disponibile';
                break;
            case GEO_ERROR.TIMEOUT:
                message = 'Tempo scaduto, riprova';
                break;
            default:
                message = 'Errore GPS';
        }
        
        const error = new Error(message);
        error.showHelp = true;
        return error;
    }
    
    /**
     * Calculate distance between two points in meters (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth radius in meters
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRad(deg) {
        return deg * (Math.PI / 180);
    }
}
