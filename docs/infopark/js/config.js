/**
 * InfoPark Configuration
 */

export const CONFIG = {
    // App Info
    appName: 'InfoPark',
    appVersion: '1.0.0',
    companyName: 'GESTOPARK SRL',
    
    // Email for reports
    reportEmail: 'segnalazioni@gestopark.it',
    
    // GPS Settings
    gps: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    },
    
    // Map Settings
    map: {
        defaultZoom: 17,          // Zoom iniziale (più alto = più vicino)
        maxRadius: 200,           // Raggio massimo in metri per mostrare parcometri
        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap'
    },
    
    // Nominatim reverse geocoding (free)
    nominatimUrl: 'https://nominatim.openstreetmap.org/reverse',
    
    // Path to maps folder
    mapsFolder: 'mappe'
};
