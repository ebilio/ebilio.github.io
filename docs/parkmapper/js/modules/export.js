/**
 * Export Service Module
 * 
 * Generates Excel files in the exact format required:
 * - City name as title (merged cells)
 * - Headers: Numero Parcometro/Nome Parcheggio, Indirizzo, Latitudine, Longitudine, data/ora
 * - Coordinates as integers (443091 instead of 44.3091)
 */

export class ExportService {
    constructor() {
        // Column configuration
        this.columns = [
            { key: 'name', header: 'Numero Parcometro /\nNome Parcheggio', width: 25 },
            { key: 'address', header: 'Indirizzo', width: 30 },
            { key: 'lat', header: 'Latitudine', width: 12 },
            { key: 'lon', header: 'Longitudine', width: 12 },
            { key: 'dateTime', header: 'data/ora', width: 20 }
        ];
    }
    
    /**
     * Export to Excel with the exact format
     * @param {string} city - City name
     * @param {Array} points - Array of point objects
     */
    toExcel(city, points) {
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Prepare data array
        const data = [];
        
        // Row 1: City name (will be merged)
        data.push([city.toUpperCase(), '', '', '', '']);
        
        // Row 2: Headers
        data.push(this.columns.map(col => col.header));
        
        // Data rows
        points.forEach(point => {
            data.push([
                point.name,
                point.address || '',
                point.lat,  // Already integer format
                point.lon,  // Already integer format
                point.dateTime
            ]);
        });
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Merge city name cells (A1:E1)
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
        ];
        
        // Set column widths
        ws['!cols'] = this.columns.map(col => ({ wch: col.width }));
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Foglio1');
        
        // Generate filename: City_YYYYMMDD.xlsx
        const dateStr = this.getDateString();
        const filename = `${city}_${dateStr}.xlsx`;
        
        // Download
        XLSX.writeFile(wb, filename);
        
        console.log(`📊 Exported ${points.length} points to ${filename}`);
        
        return filename;
    }
    
    /**
     * Export to CSV
     * @param {string} city - City name
     * @param {Array} points - Array of point objects
     */
    toCsv(city, points) {
        // Prepare rows
        const rows = [];
        
        // Header
        rows.push(city.toUpperCase());
        rows.push(this.columns.map(col => col.header.replace('\n', ' ')).join(';'));
        
        // Data
        points.forEach(point => {
            rows.push([
                point.name,
                point.address || '',
                point.lat,
                point.lon,
                point.dateTime
            ].join(';'));
        });
        
        // Join with newlines
        const csv = '\uFEFF' + rows.join('\n');  // BOM for UTF-8
        
        // Download
        const dateStr = this.getDateString();
        const filename = `${city}_${dateStr}.csv`;
        
        this.downloadFile(csv, filename, 'text/csv;charset=utf-8');
        
        return filename;
    }
    
    /**
     * Share data (if Web Share API available)
     * @param {string} city - City name
     * @param {Array} points - Array of point objects
     */
    async share(city, points) {
        // Generate Excel blob
        const wb = XLSX.utils.book_new();
        
        const data = [];
        data.push([city.toUpperCase(), '', '', '', '']);
        data.push(this.columns.map(col => col.header));
        points.forEach(point => {
            data.push([
                point.name,
                point.address || '',
                point.lat,
                point.lon,
                point.dateTime
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
        ws['!cols'] = this.columns.map(col => ({ wch: col.width }));
        XLSX.utils.book_append_sheet(wb, ws, 'Foglio1');
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const dateStr = this.getDateString();
        const filename = `${city}_${dateStr}.xlsx`;
        const file = new File([blob], filename, { type: blob.type });
        
        // Try Web Share API
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: `Parcometri ${city}`,
                text: `${points.length} parcometri registrati`,
                files: [file]
            });
        } else {
            // Fallback to download
            XLSX.writeFile(wb, filename);
        }
    }
    
    /**
     * Get date string for filename (YYYYMMDD)
     */
    getDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }
    
    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
