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
    
    /**
     * Convert filename to display name (underscores to spaces)
     */
    fileToDisplayName(filename) {
        return filename
            .replace(/\.txt$/i, '')
            .replace(/_/g, ' ');
    }
    
    /**
     * Convert display name to filename format (spaces to underscores)
     */
    displayNameToFile(name) {
        return name.replace(/\s+/g, '_');
    }
    
    async loadIndex() {
        try {
            const response = await fetch(`${CONFIG.tariffeFolder}/index.json`);
            if (response.ok) {
                this.index = await response.json();
                
                // Build city -> file mapping using display names as keys
                this.index.forEach(file => {
                    const displayName = this.fileToDisplayName(file);
                    this.cityFileMap[displayName.toLowerCase()] = file;
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
            .map(file => this.fileToDisplayName(file))
            .sort((a, b) => a.localeCompare(b, 'it'));
    }
    
    async loadCity(cityName) {
        if (!cityName) return null;
        
        const cacheKey = cityName.toLowerCase();
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        // First try exact match from our mapping
        let matchingFile = this.cityFileMap[cacheKey];
        
        // If no exact match, try with underscore version
        if (!matchingFile) {
            const underscoreKey = this.displayNameToFile(cityName).toLowerCase();
            matchingFile = this.cityFileMap[underscoreKey] || 
                           this.index.find(f => f.toLowerCase() === underscoreKey + '.txt');
        }
        
        // If still no match, try partial matching
        if (!matchingFile) {
            matchingFile = this.index.find(file => {
                const fileCityName = this.fileToDisplayName(file).toLowerCase();
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
            const cityDisplayName = this.fileToDisplayName(matchingFile);
            
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
