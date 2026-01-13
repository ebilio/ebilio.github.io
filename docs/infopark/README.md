# 🅿️ InfoPark - GESTOPARK

**L'app che da voce al parcometro**

InfoPark è l'applicazione pubblica di GESTOPARK SRL che fornisce agli utenti tutte le informazioni di cui hanno bisogno: tariffe, posizioni dei parcometri e assistenza per segnalare malfunzionamenti.

## Funzionalità

### 💶 Tariffe
Consulta le tariffe della sosta nella tua città:
- Zone tariffarie
- Costi orari e giornalieri
- Orari di applicazione
- Note e agevolazioni

### 🗺️ Trova Parcometro
Il parcometro non funziona? Trova quello più vicino!
- Lista completa di tutti i parcometri ordinati per distanza
- Mappa interattiva con la tua posizione
- Navigazione verso qualsiasi parcometro con Google Maps
- Aggiornamento posizione in tempo reale (pulsante 🔄)

### ⚠️ Segnala Malfunzionamento
Comunicaci un problema:
- Form precompilato con città e coordinate GPS
- Invio email tramite client di posta
- Destinatario: segnalazioni@gestopark.it

### 🔒 Privacy
Link diretto all'informativa privacy su privacy.gestopark.it

## Installazione

1. Carica i file su un server web con **HTTPS** (obbligatorio per GPS)
2. Aggiungi i file Excel delle città nella cartella `/mappe/`
3. Aggiungi i file delle tariffe nella cartella `/tariffe/`
4. Aggiorna i file `index.json` in entrambe le cartelle

## Struttura Progetto

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
│       ├── mapdata.js
│       └── tariffe.js
├── mappe/
│   ├── index.json          ← Elenco file mappe
│   ├── Vicenza.xlsx
│   └── Savona.xlsx
├── tariffe/
│   ├── index.json          ← Elenco file tariffe
│   ├── Vicenza.txt
│   └── Savona.txt
└── icons/
    ├── icon.svg
    └── logo-gestopark.webp
```

## Configurazione Mappe

### File `mappe/index.json`
```json
[
    "Vicenza.xlsx",
    "Savona.xlsx",
    "Genova.xlsx"
]
```

### Formato file Excel (.xlsx)
| VICENZA (nome città) |           |            |             |          |
|----------------------|-----------|------------|-------------|----------|
| Numero/Nome          | Indirizzo | Latitudine | Longitudine | data/ora |
| 1                    | Via Roma  | 45.530002  | 11.507923   | ...      |

**Note:**
- Riga 1: Nome città
- Riga 2: Intestazioni colonne
- Riga 3+: Dati parcometri
- Coordinate in formato decimale (es: 45.530002)

## Configurazione Tariffe

### File `tariffe/index.json`
```json
[
    "Vicenza.txt",
    "Savona.txt",
    "Genova.txt"
]
```

### Formato file tariffe (.txt)
I file contengono HTML semplice:

```html
<h3>ZONA A - Centro Storico</h3>
<p>Tariffa oraria: € 1,50</p>
<ul>
    <li>Prima ora: € 1,50</li>
    <li>Ore successive: € 1,50/ora</li>
</ul>

<h3>ORARI DI APPLICAZIONE</h3>
<p>Dal lunedì al sabato: 8:00 - 20:00</p>
```

**Tag supportati:** `<h3>`, `<p>`, `<ul>`, `<li>`

## Configurazione App

Modifica `js/config.js`:

```javascript
export const CONFIG = {
    // Email per segnalazioni
    reportEmail: 'segnalazioni@gestopark.it',
    
    // Impostazioni GPS
    gps: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    },
    
    // Impostazioni mappa
    map: {
        defaultZoom: 17,
        maxRadius: 200
    },
    
    // Cartelle dati
    mapsFolder: 'mappe',
    tariffeFolder: 'tariffe'
};
```

## Flusso Utente

```
1. Schermata Benvenuto
   └── Attiva Posizione GPS
   
2. Menu Principale
   ├── 💶 Tariffe → Visualizza tariffe città
   ├── 🗺️ Trova Parcometro → Mappa + Lista ordinata
   ├── ⚠️ Segnala Malfunzionamento → Form email
   └── 🔒 Privacy → Link esterno

3. Se GPS non rileva la città:
   └── Selezione manuale città dall'elenco disponibile
```

## Requisiti Tecnici

- **HTTPS obbligatorio** (richiesto per geolocalizzazione)
- Browser moderno (Chrome, Firefox, Safari, Edge)
- Connessione internet per mappe OpenStreetMap

## Branding

L'app utilizza lo stile GESTOPARK:
- **Font:** Titillium Web
- **Colore primario:** #4C84BC
- **Colore testo:** #353535
- **Sfondo:** #FFFFFF

## Aggiungere una Nuova Città

1. **Mappa parcometri:**
   - Crea file `NomeCitta.xlsx` con le coordinate
   - Copialo in `/mappe/`
   - Aggiungi `"NomeCitta.xlsx"` a `mappe/index.json`

2. **Tariffe:**
   - Crea file `NomeCitta.txt` con le tariffe in HTML
   - Copialo in `/tariffe/`
   - Aggiungi `"NomeCitta.txt"` a `tariffe/index.json`

## Note Tecniche

- L'app è completamente **client-side** (no backend)
- I dati rimangono sui vostri server
- La posizione GPS è usata solo localmente nel browser
- Compatibile con installazione PWA (Progressive Web App)

## Changelog

### v1.1.0
- Aggiunta sezione Tariffe
- Nuova lista parcometri ordinata per distanza
- Pulsante refresh posizione GPS
- Sezione Privacy con link esterno
- Nuovo layout menu con sfondo blu

### v1.0.0
- Rilascio iniziale
- Trova Parcometro con mappa
- Segnala Malfunzionamento

---

**© 2026 GESTOPARK SRL** - InfoPark
