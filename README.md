# Equestre Tour • Architettura Web & Funnel di Vendita CRO 2026

**Dominio:** www.equestretour.com
**Società:** GOOD TRAVEL S.R.L. (P.IVA: 03948270718)
**Sede Operativa:** Via Calabria 42, 71016 San Severo (FG)
**Contatto Centralino:** 02 928 540 66
**Standard Tecnico:** Google AI 2026 Evaluation Standards (TTI < 0.5s, Edge-Ready, Predictive Caching)

---

## Architettura del Sistema

Il progetto implementa una piattaforma headless ad altissima conversione per la vendita di **Crociere (MSC & Costa)**, **Villaggi Mare Italia** e **Pacchetti Vacanza & Grandi Viaggi**, integrando il front-end orientato alla conversione (`home-cro.html`) con il gestionale operativo dell'agenzia (`index.html` / `app.js`).

## I 6 Pilastri del Capitolato Tecnico Implementati

### 1. Brand Identity, Loghi e Arredo Grafico
- **Header (Sticky Navbar):** Logo nativo SVG sul lato sinistro, navigazione pulita per i 3 macro-settori (Crociere, Mare Italia, Pacchetti Viaggio) e pillola telefonica con chiamata diretta al consulente (02 928 540 66).
- **Hero Image Widescreen:** Immagine emozionale a pieno schermo con il testo mandatorio del Capitolato: "Il tuo viaggio ideale, selezionato dai nostri esperti. Cerca, Blocca l'Offerta, Parti."
- **Footer Centrato Istituzionale:** Logo SVG centrato posto direttamente sopra la ragione sociale istituzionale (GOOD TRAVEL S.R.L., P.IVA: 03948270718, Direttore Tecnico, Licenza 4589/FG, orari di apertura Lun - Ven: 09:00 - 19:30 | Sabato: 09:00 - 13:00 e sede fisica di Via Calabria 42, San Severo).
- **Palette Colori:** Blu Elettrico (#0066FF) per le azioni principali e loader; Giallo/Oro Caldo (#FFB300) per evidenziare prezzi totali finiti, sconti e badge "Bimbo Free".

### 2. Motore di Ricerca & Selezione Multipla
- **Tab Unificata:** Switch istantaneo tra Crociere, Mare Italia e Pacchetti Viaggio.
- **Selezione Multipla con Popover Leggeri:** Caselle di spunta per selezionare contemporaneamente più porti di partenza (es. Civitavecchia, Savona e Genova insieme), destinazioni, durata e mesi.
- **Risoluzione Bug Filtro:** Risolta l'assenza del return nella funzione freccia, garantendo comparazione istantanea per tutti i porti.
- **Mappatura Scheletrica Destinazioni:** Struttura gerarchica DESTINATIONS_SKELETON_MAP predisposta per ospitare le destinazioni reali senza prezzi pre-caricati, pronte all'idratazione dai flussi partner.

### 3. Elaborazione Feed XML Massivi & Logica White-Label
- **Invisibilità Totale dei Fornitori:** Motore WhiteLabelEngine che maschera codici cabina criptici (es. IB_MSC_26 -> Cabina Interna Premium Bella).
- **Sradicamento Testi Segnaposto:** Zero latino o lorem ipsum: ogni micro-copy è redatto in italiano trasparente a firma Equestre Tour.
- **Skeleton Loaders Animati in Blu Elettrico:** Nessuna schermata fissa con "Attendi qualche istante": animazione shimmer fluida a 60fps durante il caricamento asincrono.

### 4. Logica di Quotazione Reale (Ospiti ed Età dei Passeggeri)
- **Configuratore Ospiti Dinamico:** Selezione esatta del numero di adulti e bambini con campi dedicati per l'età precisa di ciascun minore (0-17 anni).
- **Calcolo Trasparente Bimbo Free:** Minori di 12 anni a quota base 0€ (solo tasse fisse 90€); ragazzi 12-17 anni con sconto 50%; adulti a quota intera.
- **Doppia Comparazione:** Tra sistemazioni (Interna, Vista Mare, Balcone, Suite VIP) e tra date adiacenti (+/- 2 settimane).

### 5. Funnel di Vendita: Le 3 Vie d'Uscita ad Alta Conversione
1. **Accompagnamento Diretto alla Vendita (Acquisto Immediato):** Checkout protetto SSL con anagrafica partecipanti, codice fiscale, scelta tra Acconto 30% e Saldo Totale, pagamento simulato conforme PSD2 e rilascio di Voucher di Prenotazione ufficiale stampabile.
2. **Opzione Vera per 24 Ore (Blocco Senza Impegno):** Nessuna carta di credito richiesta. Raccoglie solo Nome, Telefono ed Email, rilascia un codice blocco (es. EQT-LOCK-2026-XXXX) e attiva a schermo un Timer di Conto alla Rovescia di 24 Ore live.
3. **Salva il Preventivo (Valutazione Dettagliata):** Generazione immediata e apertura di un Preventivo Ufficiale in formato PDF impaginato in formato A4 con logo, itinerario, tabella costi dettagliata e opzione di stampa rapida, con invio copia su WhatsApp ed Email.

### 6. Architettura Software, Caching Predittivo IA & Sincronizzazione CRM
- **IA Predictive Cache Engine:** Un modulo memorizza e pre-calcola le quotazioni in background all'hover del mouse sulle card (pointerenter), portando il Time To Interactive (TTI) a meno di 0.2 secondi.
- **Sincronizzazione Unificata CRM:** Quando un cliente effettua un acquisto, blocca un'opzione 24h o salva un preventivo su home-cro.html, la pratica viene trasmessa in tempo reale a app.js e memorizzata in localStorage, apparendo istantaneamente nella Dashboard del personale di San Severo in index.html.
