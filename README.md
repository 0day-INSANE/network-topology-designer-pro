# Network Topology Designer Pro - Versione con Testo Multi-Linea

## 🎉 NOVITÀ: Supporto Testo Multi-Linea!

Questa versione aggiunge il supporto completo per **testo su più righe** con un'interfaccia modale professionale.

---

## 📝 Cosa è Cambiato

### PRIMA (Versione Originale):
- Il testo usava un semplice `prompt()` che permetteva solo UNA RIGA
- Non era possibile andare a capo
- Limitazione per etichette e descrizioni complesse

### ADESSO (Nuova Versione):
✅ **Modal con Textarea** - Interfaccia elegante per scrivere testo  
✅ **Multi-linea** - Premi `Invio` per andare a capo  
✅ **Anteprima in Tempo Reale** - Vedi esattamente come apparirà  
✅ **Spaziatura Automatica** - Le righe sono distanziate correttamente  
✅ **Export Completo** - Il testo multi-linea viene esportato correttamente in PNG  

---

## 🔧 Modifiche Tecniche Dettagliate

### 1. **HTML (index.html)**
**AGGIUNTO:** Modal per l'editor di testo (righe 253-277)

```html
<!-- Text Editor Modal -->
<div id="textEditorModal" class="text-modal" style="display: none;">
    <div class="text-modal-content">
        <div class="text-modal-header">
            <h3>✏️ Editor Testo Multi-Linea</h3>
            <button class="text-modal-close" id="closeTextModal">×</button>
        </div>
        <div class="text-modal-body">
            <textarea id="textEditorArea" placeholder="..."></textarea>
            <div class="text-modal-info">
                💡 Suggerimento: Premi Invio per andare a capo...
            </div>
        </div>
        <div class="text-modal-footer">
            <button class="btn btn-danger" id="cancelTextBtn">❌ Annulla</button>
            <button class="btn btn-success" id="confirmTextBtn">✅ Aggiungi Testo</button>
        </div>
    </div>
</div>
```

### 2. **CSS (style.css)**
**AGGIUNTO:** Stili completi per il modal (righe 534-658)

- `.text-modal` - Overlay a schermo intero con sfondo sfocato
- `.text-modal-content` - Box del modal con animazioni
- `.text-modal-header` - Intestazione con pulsante di chiusura
- `.text-modal-body textarea` - Area di testo con focus e animazioni
- `.text-modal-footer` - Pulsanti di azione

**Caratteristiche degli stili:**
- Animazioni smooth (slideUp, fadeIn)
- Backdrop blur per sfondo
- Focus states con glow ciano
- Responsive e accessibile

### 3. **JavaScript (app.js)**
**MODIFICATO:** Gestione completa del testo multi-linea

#### Nuove Proprietà:
```javascript
this.textModalPosition = null; // Memorizza posizione del click
```

#### Nuovi Metodi:
```javascript
openTextModal(x, y) {
    // Apre il modal alla posizione specificata
}

closeTextModal() {
    // Chiude il modal
}

confirmText() {
    // Crea oggetto testo con array di righe
    const lines = text.split('\n');
    const textObj = {
        text: text,      // Testo completo
        lines: lines,    // Array di righe
        ...
    };
}
```

#### Metodo Modificato - drawText():
```javascript
drawText(obj) {
    // PRIMA: una sola riga
    // this.ctx.fillText(obj.text, obj.x, obj.y);
    
    // ADESSO: supporto multi-linea
    if (obj.lines && obj.lines.length > 0) {
        const lineHeight = obj.settings.size * 1.4;
        obj.lines.forEach((line, index) => {
            this.ctx.fillText(line, obj.x, obj.y + (index * lineHeight));
        });
    }
}
```

#### Metodo Modificato - getTextBounds():
```javascript
getTextBounds(obj) {
    // Calcola bounds per testo multi-linea
    if (obj.lines && obj.lines.length > 0) {
        const lineHeight = obj.settings.size * 1.4;
        totalHeight = obj.lines.length * lineHeight;
        
        // Trova la riga più lunga
        obj.lines.forEach(line => {
            const metrics = this.ctx.measureText(line);
            if (metrics.width > maxWidth) {
                maxWidth = metrics.width;
            }
        });
    }
}
```

#### Metodo Modificato - handleMouseDown():
```javascript
// PRIMA: prompt singola riga
if (this.currentTool === 'text') {
    const text = prompt('Inserisci il testo:');
    ...
}

// ADESSO: modal multi-linea
if (this.currentTool === 'text') {
    this.openTextModal(x, y);
    return;
}
```

#### Event Listeners Aggiunti:
```javascript
document.getElementById('closeTextModal').addEventListener('click', () => this.closeTextModal());
document.getElementById('cancelTextBtn').addEventListener('click', () => this.closeTextModal());
document.getElementById('confirmTextBtn').addEventListener('click', () => this.confirmText());
```

---

## 🚀 Come Usare

1. **Apri l'applicazione** - Carica `index.html` nel browser
2. **Seleziona lo strumento Testo** - Click su "✏️ Testo" nella barra laterale
3. **Click sul canvas** - Scegli dove posizionare il testo
4. **Scrivi nel modal** - Si apre automaticamente un editor
5. **Vai a capo** - Premi `Invio` per creare nuove righe
6. **Conferma** - Click su "✅ Aggiungi Testo"

### Esempio di Utilizzo:

```
Router Principale
IP: 192.168.1.1
Status: Online
Gateway: 192.168.1.254
```

Ogni riga sarà renderizzata separatamente con la spaziatura corretta!

---

## 📊 Struttura Dati del Testo

### Oggetto Testo nel Sistema:

```javascript
{
    id: 1699876543210,
    type: 'text',
    text: 'Router Principale\nIP: 192.168.1.1\nStatus: Online',  // Testo completo
    lines: [                                                        // Array di righe
        'Router Principale',
        'IP: 192.168.1.1',
        'Status: Online'
    ],
    x: 150,
    y: 200,
    settings: {
        font: 'Arial',
        size: 24,
        color: '#ffffff',
        bold: false,
        italic: false
    }
}
```

---

## ✨ Caratteristiche del Modal

- **Dimensione Responsive** - Si adatta a schermi diversi
- **Textarea Ridimensionabile** - Puoi trascinare per ingrandire
- **Placeholder Informativo** - Suggerimenti d'uso visibili
- **Animazioni Smooth** - Apertura e chiusura fluide
- **Keyboard Shortcuts** - `Esc` per chiudere
- **Focus Automatico** - Cursore già nella textarea
- **Styling Coerente** - Segue il tema dell'app (dark mode ciano)

---

## 🎨 Compatibilità

✅ **Export PNG** - Il testo multi-linea viene esportato correttamente  
✅ **Salvataggio Progetto** - Tutto viene salvato nel JSON  
✅ **LocalStorage** - Persistenza automatica  
✅ **Clonazione** - Puoi duplicare testo multi-linea  
✅ **Spostamento** - Funziona perfettamente con lo strumento Sposta  
✅ **Selezione** - Bounds corretti per selezione  
✅ **Proprietà** - Pannello mostra numero di righe  

---

## 📦 File Inclusi

1. **index.html** (15 KB) - HTML con modal integrato
2. **style.css** (15 KB) - CSS con stili del modal
3. **app.js** (78 KB) - JavaScript con logica multi-linea completa

---

## 🔄 Retro-compatibilità

Il codice è **100% retro-compatibile**:
- I vecchi progetti con testo single-line funzionano ancora
- I nuovi testi usano il sistema multi-linea
- Fallback automatico per oggetti senza array `lines`

---

## 🐛 Note Tecniche

### Line Height
```javascript
const lineHeight = obj.settings.size * 1.4; // 140% della dimensione font
```

Il line height è impostato al 140% della dimensione del font per una spaziatura ottimale.

### Text Bounds Calculation
Il calcolo dei bounds considera:
- La riga più lunga (larghezza)
- Il numero totale di righe (altezza)
- Padding di 5px attorno

### Rendering Order
1. Background
2. Icone
3. Forme (linee, cerchi, ecc.)
4. Testo (renderizzato per ultimo per essere sempre visibile)

---

## 🎯 Casi d'Uso

### Network Diagrams
```
Core Switch
Model: Cisco 9300
Ports: 48x 1Gb + 4x 10Gb
Management IP: 10.0.0.1
```

### Server Labels
```
Web Server 01
OS: Ubuntu 22.04
CPU: 8 cores
RAM: 32GB
Storage: 500GB SSD
```

### Connection Info
```
Site-to-Site VPN
Protocol: IPSec
Bandwidth: 100 Mbps
Latency: < 20ms
```

---

## ✅ Checklist delle Modifiche

- [x] Modal HTML aggiunto
- [x] Stili CSS completi
- [x] Gestione apertura/chiusura modal
- [x] Split del testo in righe
- [x] Rendering multi-linea
- [x] Calcolo bounds corretto
- [x] Export PNG funzionante
- [x] Salvataggio/caricamento progetto
- [x] Compatibilità con tutti gli strumenti
- [x] Event listeners completi
- [x] Animazioni e transizioni
- [x] Responsive design
- [x] Keyboard navigation

---

## 🎉 Conclusione

Ora puoi creare diagrammi di rete professionali con etichette dettagliate su più righe!

**Buon lavoro! 🚀**

---

*Creato da Claudio - Network Security Specialist*
*Data: 11 Novembre 2025*
