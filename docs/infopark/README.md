# 🅿️ InfoPark - GESTOPARK

App pubblica per trovare parcometri e segnalare malfunzionamenti.

## Funzionalità

### 🗺️ Trova Parcometro
- Rileva la posizione GPS dell'utente
- Mostra i parcometri nel raggio di 200 metri
- Indica il parcometro più vicino con distanza
- Navigazione verso il parcometro con Google Maps

### ⚠️ Segnala Malfunzionamento
- Form precompilato con città e coordinate GPS
- Invio email tramite client di posta dell'utente
- Destinatario: segnalazioni@gestopark.it

## Installazione

1. Carica i file su un server web con **HTTPS**
2. Aggiungi i file Excel delle città nella cartella `/mappe/`
3. Aggiorna il file `/mappe/index.json` con l'elenco dei file

## Configurazione mappe

### Struttura cartella `/mappe/`

```
mappe/
├── index.json          # Elenco dei file disponibili
├── Vicenza.xlsx
├── Savona.xlsx
├── Genova.xlsx
└── ...
```

### File `index.json`

```json
[
    "Vicenza.xlsx",
    "Savona.xlsx",
    "Genova.xlsx"
]
```

**Importante:** Ogni volta che aggiungi o rimuovi un file Excel, aggiorna `index.json`!

### Formato file Excel

I file Excel devono avere questo formato:

| VICENZA (nome città)  |           |            |             |          |
|-----------------------|-----------|------------|-------------|----------|
| Numero/Nome           | Indirizzo | Latitudine | Longitudine | data/ora |
| 1                     | Via Roma  | 45.530002  | 11.507923   | ...      |

## Configurazione

Modifica `js/config.js` per cambiare:

```javascript
export const CONFIG = {
    // Email per segnalazioni
    reportEmail: 'segnalazioni@gestopark.it',
    
    // Raggio massimo per mostrare parcometri (metri)
    map: {
        maxRadius: 200
    }
};
```

## Requisiti tecnici

- **HTTPS obbligatorio** per la geolocalizzazione
- Browser moderno (Chrome, Firefox, Safari, Edge)
- Connessione internet per le mappe

## Struttura progetto

```
infopark/
├── index.html
├── manifest.json
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   └── modules/
│       ├── geo.js
│       └── mapdata.js
├── mappe/
│   ├── index.json      # ← Aggiorna questo!
│   └── *.xlsx          # ← Aggiungi qui i file
└── icons/
    └── icon.svg
```

## Note

- L'app è completamente client-side (no backend necessario)
- I dati dei parcometri rimangono sui vostri server
- La posizione dell'utente viene usata solo localmente

---

**GESTOPARK SRL** - InfoPark v1.0
