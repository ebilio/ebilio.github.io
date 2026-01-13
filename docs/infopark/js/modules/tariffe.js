/**
 * Tariffe Service Module for InfoPark
 * Loads tariffe data from text files in /tariffe/ folder
 */

import { CONFIG } from '../config.js';

export class TariffeService {
    constructor() {
        this.index = [];
        this.cache = {};
        this.cityFileMap = {};
    }
    
    async loadIndex() {
        try {
            const response = await fetch(`${CONFIG.tariffeFolder}/index.json`);
            if (response.ok) {
                this.index = await response.json();
                
                this.index.forEach(file => {
                    const cityName = file.replace(/\.txt$/i, '');
                    this.cityFileMap[cityName.toLowerCase()] = file;
                });
                
                console.log(`📋 Loaded ${this.index.length} tariffe files from index`);
            }
        } catch (error) {
            console.warn('Could not load tariffe index:', error);
            this.index = [];
        }
    }
    
    getCityNames() {
        return this.index
            .map(file => file.replace(/\.txt$/i, ''))
            .sort((a, b) => a.localeCompare(b, 'it'));
    }
    
    async loadCity(cityName) {
        if (!cityName) return null;
        
        const cacheKey = cityName.toLowerCase();
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        // Find matching file
        let matchingFile = this.cityFileMap[cacheKey];
        
        if (!matchingFile) {
            // Try partial match
            matchingFile = this.index.find(file => {
                const fileCityName = file.replace(/\.txt$/i, '').toLowerCase();
                return fileCityName.includes(cacheKey) || cacheKey.includes(fileCityName);
            });
        }
        
        if (!matchingFile) {
            console.log(`No tariffe file found for city: ${cityName}`);
            return null;
        }
        
        try {
            const response = await fetch(`${CONFIG.tariffeFolder}/${matchingFile}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const text = await response.text();
            const cityDisplayName = matchingFile.replace(/\.txt$/i, '');
            
            this.cache[cacheKey] = {
                city: cityDisplayName,
                content: text
            };
            
            console.log(`📋 Loaded tariffe for ${cityDisplayName}`);
            return this.cache[cacheKey];
            
        } catch (error) {
            console.error(`Error loading tariffe for ${cityName}:`, error);
            return null;
        }
    }
}
