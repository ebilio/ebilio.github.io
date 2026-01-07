/**
 * Map Data Service Module for InfoPark
 * Loads parcometri data from Excel files in /mappe/ folder
 */

import { CONFIG } from '../config.js';

export class MapDataService {
    constructor() {
        this.index = [];      // List of available city files
        this.cache = {};      // Cached city data
    }
    
    /**
     * Load index of available city files
     */
    async loadIndex() {
        try {
            const response = await fetch(`${CONFIG.mapsFolder}/index.json`);
            if (response.ok) {
                this.index = await response.json();
                console.log(`📂 Loaded ${this.index.length} city files from index`);
            }
        } catch (error) {
            console.warn('Could not load map index:', error);
            this.index = [];
        }
    }
    
    /**
     * Get list of available city names from index
     */
    getCityNames() {
        return this.index.map(file => this.extractCityFromFilename(file));
    }
    
    /**
     * Load data for a specific city
     */
    async loadCity(cityName) {
        // Check cache first
        const cacheKey = cityName.toLowerCase();
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        // Find matching file in index
        const matchingFile = this.index.find(file => {
            const fileCityName = file.replace(/\.xlsx?$/i, '').toLowerCase();
            return fileCityName.includes(cityName.toLowerCase()) || 
                   cityName.toLowerCase().includes(fileCityName);
        });
        
        if (!matchingFile) {
            console.log(`No data file found for city: ${cityName}`);
            return null;
        }
        
        // Load the file
        const data = await this.loadFile(matchingFile);
        if (data) {
            this.cache[cacheKey] = data;
        }
        return data;
    }
    
    /**
     * Load all available cities
     */
    async loadAllCities() {
        const allPoints = [];
        
        for (const file of this.index) {
            try {
                const data = await this.loadFile(file);
                if (data && data.points) {
                    allPoints.push(...data.points);
                }
            } catch (error) {
                console.warn(`Error loading ${file}:`, error);
            }
        }
        
        return allPoints;
    }
    
    /**
     * Load and parse an Excel file
     */
    async loadFile(filename) {
        try {
            const response = await fetch(`${CONFIG.mapsFolder}/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            
            return this.parseData(rawData, filename);
            
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return null;
        }
    }
    
    /**
     * Parse Excel data into points array
     */
    parseData(rawData, filename) {
        if (rawData.length < 2) {
            return null;
        }
        
        // Detect format
        const firstCell = String(rawData[0][0] || '').toLowerCase();
        const isHeader = firstCell.includes('parcometro') || 
                        firstCell.includes('numero') ||
                        firstCell.includes('nome');
        
        let city = '';
        let dataStartRow = 0;
        
        if (isHeader) {
            city = this.extractCityFromFilename(filename);
            dataStartRow = 1;
        } else {
            city = String(rawData[0][0] || '').trim();
            dataStartRow = 2;
        }
        
        const points = [];
        
        for (let i = dataStartRow; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row[0] === null || row[0] === undefined || row[0] === '') continue;
            
            const name = row[0];
            const address = row[1] || '';
            
            // Parse coordinates
            let lat = null;
            let lon = null;
            
            const col2 = String(row[2] || '').replace(/\n/g, ',').trim();
            const col3 = String(row[3] || '').replace(/\n/g, ',').trim();
            
            const coords2 = this.parseCoordinates(col2);
            
            if (coords2.lat !== null && coords2.lon !== null) {
                lat = coords2.lat;
                lon = coords2.lon;
            } else if (coords2.lat !== null) {
                lat = coords2.lat;
                const coords3 = this.parseCoordinates(col3);
                lon = coords3.lat || coords3.lon;
            }
            
            if (lat === null || lon === null) continue;
            
            // Validate ranges
            if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
                if (Math.abs(lat) > 180) lat = lat / 10000;
                if (Math.abs(lon) > 180) lon = lon / 10000;
            }
            
            points.push({
                id: `${filename}_${i}`,
                name: String(name),
                address: String(address),
                lat: parseFloat(lat.toFixed(8)),
                lon: parseFloat(lon.toFixed(8)),
                city: city
            });
        }
        
        console.log(`📍 Parsed ${points.length} points from ${filename}`);
        return { city, points };
    }
    
    parseCoordinates(str) {
        if (!str) return { lat: null, lon: null };
        
        const cleaned = str.replace(/\n/g, ',').replace(/\s+/g, ' ').trim();
        const parts = cleaned.split(/[,;\s]+/).filter(p => p.length > 0);
        
        if (parts.length >= 2) {
            const lat = this.parseNumber(parts[0]);
            const lon = this.parseNumber(parts[1]);
            return { lat, lon };
        } else if (parts.length === 1) {
            const num = this.parseNumber(parts[0]);
            return { lat: num, lon: null };
        }
        
        return { lat: null, lon: null };
    }
    
    parseNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return value;
        const str = String(value).replace(',', '.').trim();
        const num = parseFloat(str);
        return isNaN(num) ? null : num;
    }
    
    extractCityFromFilename(filename) {
        const name = filename.replace(/\.xlsx?$/i, '');
        const parts = name.split(/[_\-\s]+/);
        const excludeWords = ['coordinate', 'parcometri', 'parcheggi', 'dati', 'export'];
        
        for (const part of parts) {
            if (part.length > 2 && !excludeWords.includes(part.toLowerCase())) {
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            }
        }
        return parts[0] || 'Import';
    }
}
