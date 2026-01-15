# 🅿️ InfoPark - GESTOPARK

**L'app che da voce al parcometro**

InfoPark è l'applicazione web pubblica di GESTOPARK SRL che fornisce agli utenti tutte le informazioni di cui hanno bisogno: tariffe, posizioni dei parcometri e assistenza per segnalare malfunzionamenti.

## Funzionalità

### 💶 Tariffe
Consulta le tariffe della sosta nella tua città:
- Zone tariffarie con icone (🚗 Auto, 🚐 Camper, 🚌 Bus, ♿ Disabili)
- Costi orari e giornalieri
- Orari di applicazione
- Note e agevolazioni

**Se le tariffe non sono disponibili:** viene mostrato il messaggio "Visualizzabili a breve. Per le tariffe complete fare riferimento alla segnaletica verticale."

### 🗺️ Trova Parcometro
Il parcometro non funziona? Trova quello più vicino!
- **Disclaimer GPS**: al primo accesso viene mostrato un avviso sulla precisione delle coordinate GPS
- Lista completa di tutti i parcometri ordinati per distanza
- Mappa interattiva con la tua posizione
- Pulsante **🔄 Aggiorna** per aggiornare la posizione GPS
- Pulsante **📍 Vai a me** per centrare la mappa sulla tua posizione
- Navigazione verso qualsiasi parcometro con Google Maps

**Se il servizio non è disponibile:** viene mostrato il messaggio "Il servizio non è attualmente disponibile, verrà attivato presto."

### ⚠️ Segnala Malfunzionamento
Comunica un problema:
- Form precompilato con città e coordinate GPS
- Invio email tramite client di posta
- Destinatario: segnalazioni@gestopark.it

### 🔒 Privacy
Consulta l'informativa del tuo Comune se disponibile:
- Link diretto all'informativa privacy

## Cookie Policy

Al primo accesso, dopo 2 secondi, viene mostrato un banner cookie che scende dall'alto:

> "Noi e terze parti selezionate utilizziamo cookie o tecnologie simili per finalità tecniche. Il rifiuto del consenso può rendere non disponibili le relative funzioni. Usa il pulsante "Accetta" per acconsentire. Chiudi questa informativa per continuare senza accettare."

- **Accetta**: salva la preferenza e chiude il banner
- **✕**: chiude il banner senza accettare

La scelta viene memorizzata e il banner non ricompare nelle visite successive.

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
│   ├── Albissola_Marina.xlsx
│   └── Imperia.xlsx
├── tariffe/
│   ├── index.json          ← Elenco file tariffe
│   ├── Vicenza.txt
│   └── Albissola_Marina.txt
└── icons/
    ├── icon.svg
    └── logo-gestopark.webp
```

## Configurazione Mappe

### File `mappe/index.json`
```json
[
    "Vicenza.xlsx",
    "Albissola_Marina.xlsx",
    "Imperia.xlsx"
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
- Per città con nomi composti usare underscore: `Albissola_Marina.xlsx`

## Configurazione Tariffe

### File `tariffe/index.json`
```json
[
    "Vicenza.txt",
    "Albissola_Marina.txt"
]
```

### Formato file tariffe (.txt)
I file contengono HTML semplice con emoji per le icone:

```html
<h3>🚗 AUTOVETTURE</h3>
<p>Tariffa oraria: € 1,50</p>
<ul>
    <li>Prima ora: € 1,50</li>
    <li>Ore successive: € 1,50/ora</li>
</ul>

<h3>🚐 CAMPER</h3>
<p>Tariffa oraria: € 2,00</p>

<h3>🚌 BUS TURISTICI</h3>
<p>Tariffa oraria: € 5,00</p>

<h3>♿ DISABILI</h3>
<p>Sosta gratuita con esposizione contrassegno</p>

<h3>⏰ ORARI DI APPLICAZIONE</h3>
<p>Dal lunedì al sabato: 8:00 - 20:00</p>
```

**Tag supportati:** `<h3>`, `<p>`, `<ul>`, `<li>`

**Emoji utili per le tariffe:**
- 🚗 Auto
- 🚐 Camper/Van
- 🚌 Bus
- 🏍️ Moto
- 🛵 Scooter
- ♿ Disabili
- ⏰ Orario
- 💶 Euro
- 🅿️ Parcheggio
- 📅 Calendario
- 🌙 Notte
- ☀️ Giorno

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
   ├── Banner Cookie (dopo 2 secondi)
   └── Attiva Posizione GPS

2. Menu Principale
   ├── 💶 Tariffe → Visualizza tariffe città
   ├── 🗺️ Trova Parcometro → Disclaimer GPS → Mappa + Lista
   ├── ⚠️ Segnala Malfunzionamento → Form email
   └── 🔒 Privacy → Link esterno

3. Se GPS non rileva la città:
   └── Selezione manuale città dall'elenco disponibile
```

## Messaggi di Errore

| Situazione | Messaggio |
|------------|-----------|
| Tariffe non disponibili | "Visualizzabili a breve. Per le tariffe complete fare riferimento alla segnaletica verticale." |
| Mappa non disponibile | "Il servizio non è attualmente disponibile, verrà attivato presto." |

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
   - Crea file `NomeCitta.xlsx` (usa underscore per nomi composti: `Nome_Citta.xlsx`)
   - Copialo in `/mappe/`
   - Aggiungi `"NomeCitta.xlsx"` a `mappe/index.json`

2. **Tariffe:**
   - Crea file `NomeCitta.txt` con le tariffe in HTML
   - Copialo in `/tariffe/`
   - Aggiungi `"NomeCitta.txt"` a `tariffe/index.json`

## LocalStorage

L'app salva le seguenti preferenze nel browser:

| Chiave | Descrizione |
|--------|-------------|
| `cookieChoice` | Scelta cookie: "accepted" o "declined" |
| `gpsDisclaimerAccepted` | Disclaimer GPS accettato: "true" |

**Per resettare le preferenze (debug):**
```javascript
localStorage.clear();
location.reload();
```

## Note Tecniche

- L'app è completamente **client-side** (no backend)
- I dati rimangono sui vostri server
- La posizione GPS è usata solo localmente nel browser
- Compatibile con installazione PWA (Progressive Web App)
- Ottimizzata per dispositivi mobile (iPhone, Android)
- Supporto safe-area per dispositivi con notch

## Changelog

### v1.2.0
- Cookie banner con animazione slide-down
- Disclaimer GPS prima dell'accesso alla mappa
- Messaggi di errore personalizzati per tariffe e mappe non disponibili
- Sottotitoli aggiornati per le sezioni
- Footer con Privacy Policy in tutte le pagine
- Ottimizzazioni scroll mobile

### v1.1.0
- Aggiunta sezione Tariffe
- Nuova lista parcometri ordinata per distanza
- Pulsante refresh posizione GPS
- Sezione Privacy con link esterno
- Nuovo layout menu con sfondo blu
- Supporto nomi città composti (es. Albissola Marina)

### v1.0.0
- Rilascio iniziale
- Trova Parcometro con mappa
- Segnala Malfunzionamento

---

**© 2026 GESTOPARK SRL** - InfoPark
