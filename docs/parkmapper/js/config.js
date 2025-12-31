/**
 * Configuration Module
 * 
 * Contains authorized users and app settings.
 * Edit this file to add/remove authorized email addresses.
 */

export const CONFIG = {
    // App Info
    appName: 'ParkMapper',
    appVersion: '2.0.0',
    companyName: 'GESTOPARK SRL',
    
    // Authorized email addresses
    // Add or remove emails as needed
    authorizedEmails: [
        // Aggiungi qui le email autorizzate
        'admin@gestopark.it',
        'operatore@gestopark.it',
        'tecnico@gestopark.it',
        // Puoi anche usare pattern con wildcard
        // Esempio: tutte le email @gestopark.it
    ],
    
    // Allow all emails from these domains
    // Leave empty to require exact email match
    authorizedDomains: [
        'gestopark.it',
        // Aggiungi altri domini se necessario
    ],
    
    // City suggestions (comuni serviti)
    citySuggestions: [
        'Savona',
        'Genova',
        'Imperia',
        'La Spezia',
        'Albenga',
        'Finale Ligure',
        'Loano',
        'Varazze',
        'Rapallo',
        'Sanremo',
        'Ventimiglia',
        'Chiavari',
        'Sestri Levante',
        'Spotorno',
        'Noli',
        'Pietra Ligure',
        'Bordighera',
        'Diano Marina',
        'Arenzano',
        'Cogoleto'
    ],
    
    // GPS Settings
    gps: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    },
    
    // Map Settings
    map: {
        defaultCenter: [44.31, 8.48], // Savona
        defaultZoom: 13,
        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap'
    },
    
    // Export Settings
    export: {
        // Coordinate format: 'decimal' or 'integer'
        // 'integer' removes decimal point (443091 instead of 44.3091)
        coordinateFormat: 'integer',
        
        // Date format
        dateFormat: 'DD/MM/YYYY HH.mm.ss'
    }
};

/**
 * Check if an email is authorized
 * @param {string} email - Email to check
 * @returns {boolean}
 */
export function isAuthorized(email) {
    if (!email) return false;
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check exact email match
    const exactMatch = CONFIG.authorizedEmails.some(
        authorizedEmail => authorizedEmail.toLowerCase() === normalizedEmail
    );
    if (exactMatch) return true;
    
    // Check domain match
    const emailDomain = normalizedEmail.split('@')[1];
    if (emailDomain) {
        const domainMatch = CONFIG.authorizedDomains.some(
            domain => domain.toLowerCase() === emailDomain
        );
        if (domainMatch) return true;
    }
    
    return false;
}
