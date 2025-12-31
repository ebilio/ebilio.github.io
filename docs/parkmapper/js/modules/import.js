/**
 * Import Service Module
 * 
 * Handles importing data from Excel (XLSX) and CSV files.
 * Parses the exact format used by ParkMapper.
 */

export class ImportService {
    constructor() {}
    
    /**
     * Import data from file
     * @param {File} file - File object
     * @returns {Promise<{city: string, points: Array}>}
     */
    async fromFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (extension === 'csv') {
            return this.fromCsv(file);
        } else if (['xlsx', 'xls'].includes(extension)) {
            return this.fromExcel(file);
        } else {
            throw new Error(`Formato non supportato: .${extension}`);
        }
    }
    
    /**
     * Import from Excel file
     */
    async fromExcel(file) {
        const data = await this.readFile(file, 'binary');
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Get raw data as array of arrays
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        if (rawData.length < 2) {
            throw new Error('Il file è vuoto o non valido');
        }
        
        return this.parseData(rawData);
    }
    
    /**
     * Import from CSV file
     */
    async fromCsv(file) {
        const text = await this.readFile(file, 'text');
        const delimiter = text.indexOf(';') > -1 ? ';' : ',';
        
        const workbook = XLSX.read(text, { type: 'string', FS: delimiter });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        if (rawData.length < 2) {
            throw new Error('Il file è vuoto o non valido');
        }
        
        return this.parseData(rawData);
    }
    
    /**
     * Parse raw data into structured format
     * Expected format:
     * Row 1: City name (merged or first cell)
     * Row 2: Headers
     * Row 3+: Data
     */
    parseData(rawData) {
        // Row 1: City name
        const city = String(rawData[0][0] || '').trim();
        
        if (!city) {
            throw new Error('Nome città non trovato nella prima riga');
        }
        
        // Row 2: Headers (skip)
        // Row 3+: Data
        const points = [];
        
        for (let i = 2; i < rawData.length; i++) {
            const row = rawData[i];
            
            // Skip empty rows
            if (!row || !row[0]) continue;
            
            const name = row[0];
            const address = row[1] || '';
            const lat = this.parseNumber(row[2]);
            const lon = this.parseNumber(row[3]);
            const dateTime = row[4] || '';
            
            // Validate coordinates
            if (lat === null || lon === null) {
                console.warn(`Riga ${i + 1}: coordinate non valide, saltata`);
                continue;
            }
            
            // Determine if coordinates are integer format (443091) or decimal (44.3091)
            let latDecimal, lonDecimal;
            if (Math.abs(lat) > 180) {
                // Integer format
                latDecimal = lat / 10000;
                lonDecimal = lon / 10000;
            } else {
                // Decimal format
                latDecimal = lat;
                lonDecimal = lon;
            }
            
            points.push({
                id: Date.now().toString() + i,
                name: String(name),
                address: String(address),
                lat: Math.round(latDecimal * 10000),
                lon: Math.round(lonDecimal * 10000),
                latDecimal,
                lonDecimal,
                dateTime: String(dateTime)
            });
        }
        
        if (points.length === 0) {
            throw new Error('Nessun punto valido trovato nel file');
        }
        
        console.log(`📥 Imported ${points.length} points from ${city}`);
        
        return { city, points };
    }
    
    /**
     * Parse a number from various formats
     */
    parseNumber(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        // If already a number
        if (typeof value === 'number') {
            return value;
        }
        
        // Try to parse string
        const str = String(value).replace(',', '.').trim();
        const num = parseFloat(str);
        
        return isNaN(num) ? null : num;
    }
    
    /**
     * Read file content
     */
    readFile(file, type = 'text') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Errore nella lettura del file'));
            
            if (type === 'binary') {
                reader.readAsBinaryString(file);
            } else {
                reader.readAsText(file);
            }
        });
    }
}
