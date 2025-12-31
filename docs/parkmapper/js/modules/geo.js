/**
 * Geo Service Module
 * 
 * Handles GPS location operations with mobile-friendly error messages.
 */

import { CONFIG } from '../config.js';

// GeolocationPositionError codes
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
            const error = new Error('Il GPS richiede una connessione sicura (HTTPS). Contatta l\'amministratore.');
            error.showHelp = true;
            throw error;
        }
        
        if (!this.isAvailable()) {
            const error = new Error('Il tuo dispositivo non supporta la geolocalizzazione.');
            error.showHelp = true;
            throw error;
        }
        
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        timestamp: position.timestamp
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
        let showHelp = true; // Mostra sempre le istruzioni per qualsiasi errore
        
        console.log('GPS Error code:', geoError.code, 'message:', geoError.message);
        
        switch (geoError.code) {
            case GEO_ERROR.PERMISSION_DENIED:
                message = 'Accesso alla posizione negato. Abilita il GPS nelle impostazioni.';
                break;
            case GEO_ERROR.POSITION_UNAVAILABLE:
                message = 'Posizione non disponibile. Verifica che il GPS sia attivo.';
                break;
            case GEO_ERROR.TIMEOUT:
                message = 'Tempo scaduto. Verifica che il GPS sia attivo e riprova.';
                break;
            default:
                message = 'Impossibile rilevare la posizione. Verifica le impostazioni GPS.';
        }
        
        const customError = new Error(message);
        customError.showHelp = showHelp;
        customError.code = geoError.code;
        customError.originalMessage = geoError.message;
        
        return customError;
    }
}
