# 🅿️ ParkMapper v2 - GESTOPARK

App PWA per la registrazione di parcometri e parcheggi con GPS.

## Caratteristiche principali

- ✅ **Autenticazione email** - Solo utenti autorizzati
- 📍 **GPS integrato** - Rileva posizione con un click
- 📊 **Export Excel** - Formato identico al template aziendale
- 🔄 **Flusso a sessioni** - Wizard step-by-step
- 📱 **PWA installabile** - Funziona come app nativa
- 💾 **Salvataggio automatico** - Non perdi mai i dati

## Formato Excel generato

Il file Excel segue esattamente il formato richiesto:

```
| CITTÀ (riga merged)                                    |
|--------------------------------------------------------|
| Numero Parcometro/Nome Parcheggio | Indirizzo | Lat | Lon | data/ora |
| 1                                 | Via Roma  | 443091 | 84772 | 31/12/2025 10.15.30 |
```

## Flusso di utilizzo

1. **Login** → Inserisci email aziendale
2. **Città** → Seleziona la città di lavoro
3. **Parcometro** → Inserisci numero/nome e indirizzo
4. **Posizione** → Rileva coordinate GPS
5. **Salva** → Conferma e scegli se aggiungere altro
6. **Download** → Scarica il file Excel

## Configurazione utenti autorizzati

Modifica il file `js/config.js`:

```javascript
export const CONFIG = {
    // Email autorizzate specifiche
    authorizedEmails: [
        'mario.rossi@gestopark.it',
        'luca.bianchi@gestopark.it'
    ],
    
    // Autorizza tutti gli utenti di un dominio
    authorizedDomains: [
        'gestopark.it'
    ]
};
```

### Opzioni di autorizzazione:

1. **Email specifica**: Aggiungi l'indirizzo completo a `authorizedEmails`
2. **Intero dominio**: Aggiungi il dominio a `authorizedDomains`

## Struttura progetto

```
parkmapper-v2/
├── index.html              # Interfaccia principale
├── manifest.json           # PWA manifest
├── css/
│   └── styles.css          # Stili
├── js/
│   ├── app.js              # Logica principale
│   ├── config.js           # ⚙️ CONFIGURAZIONE UTENTI
│   └── modules/
│       ├── storage.js      # Persistenza dati
│       ├── geo.js          # GPS
│       └── export.js       # Generazione Excel
└── icons/
    └── icon.svg            # Icona app
```

## Installazione

### 1. Hosting (raccomandato)

Carica i file su un server web con HTTPS:
- Netlify (gratis): trascina la cartella
- Vercel (gratis): collega a GitHub
- Server aziendale

**⚠️ HTTPS è obbligatorio per il GPS**

### 2. Test locale

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

Poi apri `http://localhost:8000`

### 3. Installazione come app

1. Apri l'app su smartphone (Chrome/Safari)
2. Menù → "Aggiungi a schermata Home"
3. L'app apparirà come icona

## Personalizzazioni

### Aggiungere città suggerite

In `js/config.js`:

```javascript
citySuggestions: [
    'Savona',
    'Genova',
    // Aggiungi qui...
]
```

### Cambiare formato coordinate

In `js/config.js`:

```javascript
export: {
    // 'integer': 443091 (default, come il tuo file)
    // 'decimal': 44.3091
    coordinateFormat: 'integer'
}
```

### Cambiare colori

In `css/styles.css` modifica le CSS variables:

```css
:root {
    --color-primary: #2563eb;
    --color-success: #22c55e;
}
```

## Note tecniche

- I dati della sessione sono salvati in `localStorage`
- La sessione persiste anche chiudendo il browser
- Il logout cancella i dati non esportati (con conferma)
- Le coordinate sono salvate sia come interi che decimali (per navigazione)

## Supporto

Per problemi o richieste di modifica, contattare l'amministratore IT.

---

**GESTOPARK SRL** - ParkMapper v2.0
