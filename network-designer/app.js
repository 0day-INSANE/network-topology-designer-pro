// Network Topology Designer Pro - VERSIONE CON SUPPORTO TESTO MULTI-LINEA
// ========================================================================
// MODIFICA PRINCIPALE: Il testo ora supporta più righe con un modal textarea
// Invece del vecchio prompt(), ora si apre un modal dove puoi scrivere su più righe
// ========================================================================

class NetworkDesignerPro {
    constructor() {
        this.bgCanvas = document.getElementById('bgCanvas');
        this.mainCanvas = document.getElementById('mainCanvas');
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.ctx = this.mainCanvas.getContext('2d');
        this.iconLibrary = document.getElementById('iconLibrary');
        
        this.backgroundImage = null;
        this.bgScale = { width: 100, height: 100, opacity: 100 };
        
        this.currentTool = 'select';
        this.loadedIcons = [];
        
        this.myLibrary = [];
        this.loadMyLibrary();
        
        this.objects = [];
        this.selectedObject = null;
        this.hoveredObject = null;
        
        this.isDrawing = false;
        this.isDragging = false;
        this.dragStart = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // NOVITÀ: Stato del modal di testo
        this.textModalPosition = null;
        
        this.drawSettings = {
            color: '#4fc3f7',
            thickness: 3,
            neon: false,
            dashed: false
        };
        
        this.textSettings = {
            font: 'Arial',
            size: 24,
            color: '#ffffff',
            bold: false,
            italic: false
        };
        
        this.exportSettings = {
            width: 1920,
            height: 1080
        };
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.render();
    }

    setupCanvas() {
        const container = this.bgCanvas.parentElement;
        this.bgCanvas.width = container.clientWidth;
        this.bgCanvas.height = container.clientHeight;
        this.mainCanvas.width = container.clientWidth;
        this.mainCanvas.height = container.clientHeight;
        this.redrawBackground();
    }

    setupEventListeners() {
        document.getElementById('bgUpload').addEventListener('change', (e) => this.loadBackground(e));
        document.getElementById('iconUpload').addEventListener('change', (e) => this.loadIcons(e));
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setTool(e.currentTarget.dataset.tool));
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('projectUpload').click());
        document.getElementById('projectUpload').addEventListener('change', (e) => this.handleProjectUpload(e));
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCustomSize());
        
        document.getElementById('saveToLibraryBtn').addEventListener('click', () => this.saveToMyLibrary());
        document.getElementById('clearLibraryBtn').addEventListener('click', () => this.clearMyLibrary());
        
        // NOVITÀ: Event listeners per il modal di testo
        document.getElementById('closeTextModal').addEventListener('click', () => this.closeTextModal());
        document.getElementById('cancelTextBtn').addEventListener('click', () => this.closeTextModal());
        document.getElementById('confirmTextBtn').addEventListener('click', () => this.confirmText());
        
        this.setupBackgroundControls();
        this.setupDrawingControls();
        this.setupTextControls();
        this.setupExportControls();
        this.setupSearchControls();
        
        this.mainCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.mainCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.mainCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.mainCanvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        document.getElementById('instructionsToggle').addEventListener('click', () => this.toggleInstructions());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        window.addEventListener('resize', () => this.setupCanvas());
    }

    // ========================================================================
    // NOVITÀ: Metodi per gestire il modal di testo multi-linea
    // ========================================================================
    
    openTextModal(x, y) {
        this.textModalPosition = { x, y };
        const modal = document.getElementById('textEditorModal');
        const textarea = document.getElementById('textEditorArea');
        
        modal.style.display = 'flex';
        textarea.value = '';
        setTimeout(() => textarea.focus(), 100);
        
        console.log('📝 Modal testo aperto alla posizione:', x, y);
    }

    closeTextModal() {
        const modal = document.getElementById('textEditorModal');
        modal.style.display = 'none';
        this.textModalPosition = null;
    }

    confirmText() {
        const textarea = document.getElementById('textEditorArea');
        const text = textarea.value.trim();
        
        if (!text) {
            alert('⚠️ Inserisci del testo prima di confermare!');
            return;
        }
        
        if (!this.textModalPosition) {
            this.closeTextModal();
            return;
        }
        
        // NOVITÀ: Dividiamo il testo in righe
        const lines = text.split('\n');
        
        // Creiamo l'oggetto testo con supporto multi-linea
        const textObj = {
            id: Date.now(),
            type: 'text',
            text: text,  // Testo completo
            lines: lines,  // Array di righe per il rendering
            x: this.textModalPosition.x,
            y: this.textModalPosition.y,
            settings: { ...this.textSettings }
        };
        
        this.objects.push(textObj);
        this.closeTextModal();
        this.render();
        this.saveToLocalStorage();
        
        console.log('✅ Testo multi-linea aggiunto:', lines.length, 'righe');
    }

    // ========================================================================
    // MODIFICA: drawText ora supporta multiple righe
    // ========================================================================
    
    drawText(obj) {
        this.ctx.save();
        this.ctx.font = `${obj.settings.bold ? 'bold' : ''} ${obj.settings.italic ? 'italic' : ''} ${obj.settings.size}px ${obj.settings.font}`;
        this.ctx.fillStyle = obj.settings.color;
        
        // NOVITÀ: Se ci sono più righe, le disegniamo una per una
        if (obj.lines && obj.lines.length > 0) {
            const lineHeight = obj.settings.size * 1.4; // Spaziatura tra righe
            obj.lines.forEach((line, index) => {
                this.ctx.fillText(line, obj.x, obj.y + (index * lineHeight));
            });
        } else {
            // Fallback per vecchi testi single-line
            this.ctx.fillText(obj.text, obj.x, obj.y);
        }
        
        this.ctx.restore();
    }

    // ========================================================================
    // MODIFICA: getTextBounds calcola i bounds per testo multi-linea
    // ========================================================================
    
    getTextBounds(obj) {
        this.ctx.save();
        this.ctx.font = `${obj.settings.bold ? 'bold' : ''} ${obj.settings.italic ? 'italic' : ''} ${obj.settings.size}px ${obj.settings.font}`;
        
        let maxWidth = 0;
        let totalHeight = 0;
        
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
        } else {
            const metrics = this.ctx.measureText(obj.text);
            maxWidth = metrics.width;
            totalHeight = obj.settings.size;
        }
        
        this.ctx.restore();
        
        return {
            x: obj.x - 5,
            y: obj.y - obj.settings.size - 5,
            width: maxWidth + 10,
            height: totalHeight + 10
        };
    }

    // ========================================================================
    // Resto del codice (uguale all'originale, continua...)
    // ========================================================================

    setupSearchControls() {
        const searchInput = document.getElementById('iconSearch');
        const searchBtn = document.getElementById('searchBtn');
        const directUrlInput = document.getElementById('directUrl');
        const addUrlBtn = document.getElementById('addUrlBtn');
        
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) this.searchOnlineIcons(query);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) this.searchOnlineIcons(query);
            }
        });
        
        addUrlBtn.addEventListener('click', () => {
            const url = directUrlInput.value.trim();
            if (url) {
                this.addImageFromUrl(url);
                directUrlInput.value = '';
            }
        });
        
        directUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const url = directUrlInput.value.trim();
                if (url) {
                    this.addImageFromUrl(url);
                    directUrlInput.value = '';
                }
            }
        });
    }

    addImageFromUrl(url) {
        const statusEl = document.getElementById('searchStatus');
        statusEl.className = 'search-status loading';
        statusEl.textContent = '📥 Caricamento immagine da URL...';
        
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
        ];
        
        let proxyUrl = url;
        if (url.includes('google') || url.includes('bing') || !url.startsWith('data:')) {
            proxyUrl = corsProxies[0] + encodeURIComponent(url);
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const finalImg = new Image();
            finalImg.onload = () => {
                const obj = {
                    id: Date.now(),
                    type: 'icon',
                    name: 'URL_' + Date.now(),
                    image: finalImg,
                    x: 50,
                    y: 50,
                    width: 100,
                    height: 100
                };
                this.objects.push(obj);
                this.render();
                this.saveToLocalStorage();
                
                statusEl.className = 'search-status success';
                statusEl.textContent = '✅ Immagine aggiunta!';
                setTimeout(() => { statusEl.textContent = ''; }, 3000);
            };
            finalImg.src = canvas.toDataURL();
        };
        
        img.onerror = () => {
            if (proxyUrl === url) {
                proxyUrl = corsProxies[0] + encodeURIComponent(url);
                img.src = proxyUrl;
            } else if (proxyUrl.includes(corsProxies[0])) {
                proxyUrl = corsProxies[1] + encodeURIComponent(url);
                img.src = proxyUrl;
            } else {
                statusEl.className = 'search-status error';
                statusEl.textContent = '❌ Impossibile caricare. Prova con URL diretto.';
            }
        };
        
        img.src = proxyUrl;
    }

    async searchOnlineIcons(query) {
        const statusEl = document.getElementById('searchStatus');
        statusEl.className = 'search-status loading';
        statusEl.textContent = `🔍 Ricerca "${query}"...`;
        
        const onlineItems = this.iconLibrary.querySelectorAll('.online-result, .search-separator');
        onlineItems.forEach(item => item.remove());
        
        let totalResults = 0;
        
        try {
            await this.searchWikimedia(query).then(count => totalResults += count);
            await this.searchFlickr(query).then(count => totalResults += count);
            await this.searchUnsplashSource(query).then(count => totalResults += count);
            
            if (totalResults > 0) {
                statusEl.className = 'search-status success';
                statusEl.textContent = `✅ Trovate ${totalResults} immagini. Per Google Images usa il campo URL! 👇`;
            } else {
                statusEl.className = 'search-status error';
                statusEl.textContent = '❌ Nessun risultato. Usa il campo URL per Google Images! 👇';
            }
        } catch (error) {
            console.error('Search error:', error);
            statusEl.className = 'search-status error';
            statusEl.textContent = '❌ Errore. Usa il campo URL per Google Images! 👇';
        }
    }

    async searchWikimedia(query) {
        try {
            const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=300&origin=*`;
            
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            if (data.query && data.query.pages) {
                const pages = Object.values(data.query.pages);
                const images = pages
                    .filter(page => page.imageinfo && page.imageinfo[0])
                    .map(page => ({
                        thumb: page.imageinfo[0].thumburl || page.imageinfo[0].url,
                        full: page.imageinfo[0].url,
                        title: page.title.replace('File:', '').split('.')[0],
                        source: 'Wikimedia'
                    }));
                
                if (images.length > 0) {
                    this.addSearchSection('📚 Wikimedia Commons', images, query);
                    return images.length;
                }
            }
        } catch (error) {
            console.error('Wikimedia search error:', error);
        }
        return 0;
    }

    async searchFlickr(query) {
        try {
            const searchUrl = `https://api.flickr.com/services/feeds/photos_public.gne?format=json&tags=${encodeURIComponent(query)}&tagmode=all&nojsoncallback=1`;
            
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const images = data.items.slice(0, 30).map((item, index) => ({
                    thumb: item.media.m,
                    full: item.media.m.replace('_m.jpg', '_b.jpg'),
                    title: item.title || `${query}_${index}`,
                    source: 'Flickr'
                }));
                
                this.addSearchSection('📸 Flickr Public', images, query);
                return images.length;
            }
        } catch (error) {
            console.error('Flickr search error:', error);
        }
        return 0;
    }

    async searchUnsplashSource(query) {
        try {
            const images = [];
            for (let i = 0; i < 30; i++) {
                const timestamp = Date.now() + i * 1000;
                images.push({
                    thumb: `https://source.unsplash.com/300x300/?${encodeURIComponent(query)}&sig=${timestamp}`,
                    full: `https://source.unsplash.com/800x800/?${encodeURIComponent(query)}&sig=${timestamp}`,
                    title: `${query}_unsplash_${i + 1}`,
                    source: 'Unsplash'
                });
            }
            
            this.addSearchSection('🌄 Unsplash', images, query);
            return images.length;
        } catch (error) {
            console.error('Unsplash search error:', error);
        }
        return 0;
    }

    addSearchSection(sectionTitle, images, query) {
        const separator = document.createElement('div');
        separator.className = 'placeholder search-separator';
        separator.style.borderTop = '2px solid #4fc3f7';
        separator.style.paddingTop = '10px';
        separator.style.marginTop = '15px';
        separator.style.marginBottom = '10px';
        separator.innerHTML = `<strong>${sectionTitle}: "${query}"</strong>`;
        this.iconLibrary.appendChild(separator);
        
        images.forEach((image) => {
            const iconItem = document.createElement('div');
            iconItem.className = 'icon-item online-result';
            iconItem.innerHTML = `
                <img src="${image.thumb}" alt="${image.title}" crossorigin="anonymous" loading="lazy">
                <span>${image.title.substring(0, 15)}...</span>
            `;
            
            iconItem.addEventListener('click', () => {
                this.addOnlineIconToCanvas(image.full, image.title);
            });
            
            this.iconLibrary.appendChild(iconItem);
        });
    }

    addOnlineIconToCanvas(imageUrl, name) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const obj = {
                id: Date.now(),
                type: 'icon',
                name: name,
                image: img,
                x: 50,
                y: 50,
                width: 100,
                height: 100
            };
            this.objects.push(obj);
            this.render();
            this.saveToLocalStorage();
        };
        img.onerror = () => {
            alert('Errore nel caricamento dell\'immagine.');
        };
        img.src = imageUrl;
    }

    setupBackgroundControls() {
        const widthSlider = document.getElementById('bgWidth');
        const heightSlider = document.getElementById('bgHeight');
        const opacitySlider = document.getElementById('bgOpacity');
        
        widthSlider.addEventListener('input', (e) => {
            this.bgScale.width = parseInt(e.target.value);
            document.getElementById('bgWidthValue').textContent = e.target.value;
            this.redrawBackground();
        });
        
        heightSlider.addEventListener('input', (e) => {
            this.bgScale.height = parseInt(e.target.value);
            document.getElementById('bgHeightValue').textContent = e.target.value;
            this.redrawBackground();
        });
        
        opacitySlider.addEventListener('input', (e) => {
            this.bgScale.opacity = parseInt(e.target.value);
            document.getElementById('bgOpacityValue').textContent = e.target.value;
            this.redrawBackground();
        });
        
        document.getElementById('resetBgBtn').addEventListener('click', () => {
            widthSlider.value = 100;
            heightSlider.value = 100;
            opacitySlider.value = 100;
            this.bgScale = { width: 100, height: 100, opacity: 100 };
            document.getElementById('bgWidthValue').textContent = '100';
            document.getElementById('bgHeightValue').textContent = '100';
            document.getElementById('bgOpacityValue').textContent = '100';
            this.redrawBackground();
        });
    }

    setupDrawingControls() {
        const colorInput = document.getElementById('drawColor');
        const thicknessSlider = document.getElementById('drawThickness');
        const neonCheck = document.getElementById('neonEffect');
        const dashedCheck = document.getElementById('dashedLine');
        
        colorInput.addEventListener('input', (e) => {
            this.drawSettings.color = e.target.value;
        });
        
        thicknessSlider.addEventListener('input', (e) => {
            this.drawSettings.thickness = parseInt(e.target.value);
            document.getElementById('thicknessValue').textContent = e.target.value;
        });
        
        neonCheck.addEventListener('change', (e) => {
            this.drawSettings.neon = e.target.checked;
        });
        
        dashedCheck.addEventListener('change', (e) => {
            this.drawSettings.dashed = e.target.checked;
        });
        
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                colorInput.value = color;
                this.drawSettings.color = color;
            });
        });
    }

    setupTextControls() {
        const fontSelect = document.getElementById('fontFamily');
        const sizeSlider = document.getElementById('fontSize');
        const colorInput = document.getElementById('textColor');
        const boldCheck = document.getElementById('textBold');
        const italicCheck = document.getElementById('textItalic');
        
        fontSelect.addEventListener('change', (e) => {
            this.textSettings.font = e.target.value;
        });
        
        sizeSlider.addEventListener('input', (e) => {
            this.textSettings.size = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = e.target.value;
        });
        
        colorInput.addEventListener('input', (e) => {
            this.textSettings.color = e.target.value;
        });
        
        boldCheck.addEventListener('change', (e) => {
            this.textSettings.bold = e.target.checked;
        });
        
        italicCheck.addEventListener('change', (e) => {
            this.textSettings.italic = e.target.checked;
        });
    }

    setupCropControls() {
        const autoCropBtn = document.getElementById('autoCropBtn');
        const manualCropBtn = document.getElementById('manualCropBtn');
        const cropMarginSlider = document.getElementById('cropMargin');
        
        const newAutoCropBtn = autoCropBtn.cloneNode(true);
        const newManualCropBtn = manualCropBtn.cloneNode(true);
        autoCropBtn.parentNode.replaceChild(newAutoCropBtn, autoCropBtn);
        manualCropBtn.parentNode.replaceChild(newManualCropBtn, manualCropBtn);
        
        cropMarginSlider.addEventListener('input', (e) => {
            document.getElementById('cropMarginValue').textContent = e.target.value;
        });
        
        newAutoCropBtn.addEventListener('click', () => {
            if (!this.selectedObject || this.selectedObject.type !== 'icon') {
                alert('⚠️ Seleziona prima un\'immagine da ritagliare!');
                return;
            }
            this.autoCropImage(this.selectedObject);
        });
        
        newManualCropBtn.addEventListener('click', () => {
            if (!this.selectedObject || this.selectedObject.type !== 'icon') {
                alert('⚠️ Seleziona prima un\'immagine da ritagliare!');
                return;
            }
            this.manualCropImage(this.selectedObject);
        });
    }

    autoCropImage(obj) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = obj.image.width;
        tempCanvas.height = obj.image.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(obj.image, 0, 0);
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        const margin = parseInt(document.getElementById('cropMargin').value);
        
        let minX = tempCanvas.width;
        let minY = tempCanvas.height;
        let maxX = 0;
        let maxY = 0;
        
        const whiteThreshold = 240;
        
        for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
                const i = (y * tempCanvas.width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                
                if (a > 10 && (r < whiteThreshold || g < whiteThreshold || b < whiteThreshold)) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        
        minX = Math.max(0, minX - margin);
        minY = Math.max(0, minY - margin);
        maxX = Math.min(tempCanvas.width, maxX + margin);
        maxY = Math.min(tempCanvas.height, maxY + margin);
        
        const cropWidth = maxX - minX;
        const cropHeight = maxY - minY;
        
        if (cropWidth <= 0 || cropHeight <= 0) {
            alert('❌ Non è stato possibile rilevare contenuto da ritagliare');
            return;
        }
        
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const croppedCtx = croppedCanvas.getContext('2d');
        
        croppedCtx.drawImage(
            obj.image,
            minX, minY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        const croppedImg = new Image();
        croppedImg.onload = () => {
            obj.image = croppedImg;
            obj.width = Math.min(obj.width, cropWidth);
            obj.height = Math.min(obj.height, cropHeight);
            this.render();
            this.saveToLocalStorage();
            alert('✅ Bordi bianchi rimossi!');
        };
        croppedImg.src = croppedCanvas.toDataURL();
    }

    manualCropImage(obj) {
        const cropPercent = prompt('Ritaglia dal bordo (%):\nEs: 10 = rimuovi 10% da ogni lato', '10');
        if (!cropPercent) return;
        
        const percent = parseFloat(cropPercent);
        if (isNaN(percent) || percent < 0 || percent >= 50) {
            alert('❌ Valore non valido (usa 0-49)');
            return;
        }
        
        const cropAmount = percent / 100;
        
        const tempCanvas = document.createElement('canvas');
        const sourceWidth = obj.image.width;
        const sourceHeight = obj.image.height;
        
        const cropX = sourceWidth * cropAmount;
        const cropY = sourceHeight * cropAmount;
        const cropWidth = sourceWidth * (1 - 2 * cropAmount);
        const cropHeight = sourceHeight * (1 - 2 * cropAmount);
        
        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(
            obj.image,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        const croppedImg = new Image();
        croppedImg.onload = () => {
            obj.image = croppedImg;
            obj.width = Math.min(obj.width, cropWidth);
            obj.height = Math.min(obj.height, cropHeight);
            this.render();
            this.saveToLocalStorage();
            alert('✅ Immagine ritagliata!');
        };
        croppedImg.src = tempCanvas.toDataURL();
    }

    setupExportControls() {
        const widthSlider = document.getElementById('exportWidth');
        const heightSlider = document.getElementById('exportHeight');
        
        widthSlider.addEventListener('input', (e) => {
            this.exportSettings.width = parseInt(e.target.value);
            document.getElementById('exportWidthValue').textContent = e.target.value;
        });
        
        heightSlider.addEventListener('input', (e) => {
            this.exportSettings.height = parseInt(e.target.value);
            document.getElementById('exportHeightValue').textContent = e.target.value;
        });
        
        document.getElementById('preset720').addEventListener('click', () => {
            this.exportSettings.width = 1280;
            this.exportSettings.height = 720;
            widthSlider.value = 1280;
            heightSlider.value = 720;
            document.getElementById('exportWidthValue').textContent = '1280';
            document.getElementById('exportHeightValue').textContent = '720';
        });
        
        document.getElementById('preset1080').addEventListener('click', () => {
            this.exportSettings.width = 1920;
            this.exportSettings.height = 1080;
            widthSlider.value = 1920;
            heightSlider.value = 1080;
            document.getElementById('exportWidthValue').textContent = '1920';
            document.getElementById('exportHeightValue').textContent = '1080';
        });
        
        document.getElementById('preset4k').addEventListener('click', () => {
            this.exportSettings.width = 3840;
            this.exportSettings.height = 2160;
            widthSlider.value = 3840;
            heightSlider.value = 2160;
            document.getElementById('exportWidthValue').textContent = '3840';
            document.getElementById('exportHeightValue').textContent = '2160';
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        const toolNames = {
            'move': '✋ Sposta',
            'select': '🔲 Seleziona',
            'delete': '🗑️ Cancella',
            'crop': '✂️ Ritaglia',
            'line': '📏 Linea',
            'arrow': '➡️ Freccia',
            'curve': '〰️ Curva',
            'circle': '⭕ Cerchio',
            'rect': '⬜ Rettangolo',
            'text': '✏️ Testo'
        };
        document.getElementById('toolIndicator').textContent = toolNames[tool];
        
        document.getElementById('drawingControls').style.display = 'none';
        document.getElementById('textControls').style.display = 'none';
        document.getElementById('cropControls').style.display = 'none';
        
        this.mainCanvas.classList.remove('cursor-crosshair', 'cursor-text', 'cursor-move');
        
        if (tool === 'text') {
            document.getElementById('textControls').style.display = 'block';
            this.mainCanvas.classList.add('cursor-text');
        } else if (tool === 'crop') {
            document.getElementById('cropControls').style.display = 'block';
            this.setupCropControls();
        } else if (tool === 'select' || tool === 'move') {
            this.mainCanvas.classList.add('cursor-move');
        } else if (tool !== 'delete') {
            document.getElementById('drawingControls').style.display = 'block';
            this.mainCanvas.classList.add('cursor-crosshair');
        }
        
        this.render();
    }

    loadBackground(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                document.getElementById('bgControls').style.display = 'block';
                this.redrawBackground();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadIcons(event) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const iconData = {
                    name: file.name.split('.')[0],
                    src: e.target.result
                };
                
                this.loadedIcons.push(iconData);
                this.addIconToLibrary(iconData);
            };
            reader.readAsDataURL(file);
        });
    }

    addIconToLibrary(iconData) {
        const placeholder = this.iconLibrary.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        const iconItem = document.createElement('div');
        iconItem.className = 'icon-item';
        iconItem.innerHTML = `
            <img src="${iconData.src}" alt="${iconData.name}">
            <span>${iconData.name}</span>
        `;
        
        iconItem.addEventListener('click', () => this.addIconToCanvas(iconData));
        this.iconLibrary.appendChild(iconItem);
    }

    addIconToCanvas(iconData) {
        const img = new Image();
        img.src = iconData.src;
        img.onload = () => {
            const obj = {
                id: Date.now(),
                type: 'icon',
                name: iconData.name,
                image: img,
                x: 50,
                y: 50,
                width: 100,
                height: 100
            };
            this.objects.push(obj);
            this.render();
            this.saveToLocalStorage();
        };
    }

    handleMouseDown(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.currentTool === 'delete') {
            const obj = this.getObjectAt(x, y);
            if (obj) {
                if (confirm(`Eliminare ${obj.name || obj.type}?`)) {
                    this.objects = this.objects.filter(o => o.id !== obj.id);
                    this.selectedObject = null;
                    this.render();
                    this.saveToLocalStorage();
                }
            }
            return;
        }
        
        if (this.currentTool === 'move') {
            const obj = this.getObjectAt(x, y);
            if (obj) {
                this.selectedObject = obj;
                this.isDragging = true;
                
                if (obj.type === 'icon' || obj.type === 'text') {
                    this.dragOffset = { 
                        x: x - obj.x, 
                        y: y - obj.y 
                    };
                } else {
                    this.dragStart = { x: x, y: y };
                    this.dragOffset = { 
                        x1: obj.x1,
                        y1: obj.y1, 
                        x2: obj.x2,
                        y2: obj.y2
                    };
                }
                this.render();
            } else {
                this.selectedObject = null;
                this.render();
            }
            return;
        }
        
        if (this.currentTool === 'select') {
            const obj = this.getObjectAt(x, y);
            if (obj) {
                this.selectedObject = obj;
                this.showObjectProperties(obj);
                this.render();
            } else {
                this.selectedObject = null;
                this.hideObjectProperties();
                this.render();
            }
            return;
        }
        
        // MODIFICA: Al posto del prompt, apriamo il modal
        if (this.currentTool === 'text') {
            this.openTextModal(x, y);
            return;
        }
        
        this.isDrawing = true;
        this.dragStart = { x, y };
    }

    handleMouseMove(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mainCanvas.style.cursor = 'default';
        
        if (this.currentTool === 'select' && !this.isDragging) {
            if (this.selectedObject) {
                const obj = this.getObjectAt(x, y);
                if (obj && obj.id === this.selectedObject.id) {
                    this.mainCanvas.style.cursor = 'pointer';
                }
            } else {
                const obj = this.getObjectAt(x, y);
                if (obj) {
                    this.mainCanvas.style.cursor = 'pointer';
                }
            }
        }
        
        if (this.currentTool === 'move' && !this.isDragging) {
            const obj = this.getObjectAt(x, y);
            if (obj) {
                this.mainCanvas.style.cursor = 'move';
            }
        }
        
        if (this.currentTool === 'delete' && !this.isDragging) {
            const obj = this.getObjectAt(x, y);
            if (obj) {
                this.mainCanvas.style.cursor = 'not-allowed';
            }
        }
        
        if (['line', 'arrow', 'curve', 'circle', 'rect'].includes(this.currentTool)) {
            this.mainCanvas.style.cursor = 'crosshair';
        }
        
        if (this.currentTool === 'text') {
            this.mainCanvas.style.cursor = 'text';
        }
        
        if (this.isDragging) {
            this.mainCanvas.style.cursor = 'grabbing';
        }
        
        if ((this.currentTool === 'select' || this.currentTool === 'delete') && !this.isDragging) {
            const hoveredObj = this.getObjectAt(x, y);
            if (hoveredObj !== this.hoveredObject) {
                this.hoveredObject = hoveredObj;
                this.render();
            }
        }
        
        if (this.isDragging && this.selectedObject) {
            const obj = this.selectedObject;
            
            if (obj.type === 'icon' || obj.type === 'text') {
                obj.x = x - this.dragOffset.x;
                obj.y = y - this.dragOffset.y;
            } else {
                if (this.dragStart) {
                    const dx = x - this.dragStart.x;
                    const dy = y - this.dragStart.y;
                    
                    obj.x1 = this.dragOffset.x1 + dx;
                    obj.y1 = this.dragOffset.y1 + dy;
                    obj.x2 = this.dragOffset.x2 + dx;
                    obj.y2 = this.dragOffset.y2 + dy;
                }
            }
            
            this.render();
            return;
        }
        
        if (this.isDrawing && this.dragStart) {
            this.render();
            this.drawPreview(this.dragStart.x, this.dragStart.y, x, y);
        }
    }

    handleMouseUp(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDrawing && this.dragStart) {
            const obj = {
                id: Date.now(),
                type: this.currentTool,
                x1: this.dragStart.x,
                y1: this.dragStart.y,
                x2: x,
                y2: y,
                settings: { ...this.drawSettings }
            };
            this.objects.push(obj);
        }
        
        this.isDrawing = false;
        this.isDragging = false;
        this.dragStart = null;
        
        this.render();
        this.saveToLocalStorage();
    }

    handleContextMenu(e) {
        e.preventDefault();
        if (this.currentTool !== 'select' && this.currentTool !== 'move') return;
        
        const rect = this.mainCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const obj = this.getObjectAt(x, y);
        if (obj) {
            if (confirm(`Eliminare ${obj.name || obj.type}?`)) {
                this.objects = this.objects.filter(o => o.id !== obj.id);
                this.selectedObject = null;
                this.render();
                this.saveToLocalStorage();
            }
        }
    }

    handleKeyPress(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            if (this.selectedObject) {
                this.cloneObject(this.selectedObject);
            }
            return;
        }
        
        if (e.key === 'Delete' && this.selectedObject) {
            this.objects = this.objects.filter(o => o.id !== this.selectedObject.id);
            this.selectedObject = null;
            this.render();
            this.saveToLocalStorage();
        } else if (e.key === 'Escape') {
            this.selectedObject = null;
            this.render();
        }
    }

    getObjectAt(x, y) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            if (obj.type === 'icon') {
                if (x >= obj.x && x <= obj.x + obj.width &&
                    y >= obj.y && y <= obj.y + obj.height) {
                    return obj;
                }
            } else if (obj.type === 'text') {
                const bounds = this.getTextBounds(obj);
                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    return obj;
                }
            } else if (obj.type === 'rect') {
                const minX = Math.min(obj.x1, obj.x2);
                const maxX = Math.max(obj.x1, obj.x2);
                const minY = Math.min(obj.y1, obj.y2);
                const maxY = Math.max(obj.y1, obj.y2);
                
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    return obj;
                }
            } else if (obj.type === 'circle') {
                const radius = Math.sqrt((obj.x2 - obj.x1) ** 2 + (obj.y2 - obj.y1) ** 2);
                const dist = Math.sqrt((x - obj.x1) ** 2 + (y - obj.y1) ** 2);
                
                if (dist <= radius + 15) {
                    return obj;
                }
            } else {
                const dist = this.distanceToDrawing(x, y, obj);
                if (dist < Math.max((obj.settings.thickness || 5) + 15, 20)) {
                    return obj;
                }
            }
        }
        return null;
    }

    distanceToDrawing(x, y, obj) {
        if (obj.type === 'circle') {
            const radius = Math.sqrt((obj.x2 - obj.x1) ** 2 + (obj.y2 - obj.y1) ** 2);
            const dist = Math.sqrt((x - obj.x1) ** 2 + (y - obj.y1) ** 2);
            return Math.abs(dist - radius);
        }
        
        if (obj.type === 'rect') {
            const minX = Math.min(obj.x1, obj.x2);
            const maxX = Math.max(obj.x1, obj.x2);
            const minY = Math.min(obj.y1, obj.y2);
            const maxY = Math.max(obj.y1, obj.y2);
            
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                const distToEdge = Math.min(
                    x - minX, maxX - x, y - minY, maxY - y
                );
                return distToEdge;
            }
            return Infinity;
        }
        
        const dx = obj.x2 - obj.x1;
        const dy = obj.y2 - obj.y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return Math.sqrt((x - obj.x1) ** 2 + (y - obj.y1) ** 2);
        
        const t = Math.max(0, Math.min(1, ((x - obj.x1) * dx + (y - obj.y1) * dy) / (length * length)));
        const projX = obj.x1 + t * dx;
        const projY = obj.y1 + t * dy;
        
        return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
    }

    render() {
        this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        
        this.objects.forEach(obj => {
            if (obj.type === 'icon') {
                this.ctx.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
            } else if (obj.type === 'text') {
                this.drawText(obj);
            } else {
                this.drawShape(obj);
            }
        });
        
        if (this.currentTool === 'select' || this.currentTool === 'move' || this.currentTool === 'delete') {
            this.objects.forEach(obj => {
                const isSelected = this.selectedObject && this.selectedObject.id === obj.id;
                
                if (!isSelected) {
                    this.drawObjectOutline(obj, this.currentTool === 'delete');
                }
            });
        }
        
        if (this.selectedObject) {
            this.drawSelection(this.selectedObject);
        }
    }

    drawObjectOutline(obj, isDeleteMode) {
        this.ctx.save();
        this.ctx.strokeStyle = isDeleteMode ? 'rgba(255, 82, 82, 0.5)' : 'rgba(79, 195, 247, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        if (obj.type === 'icon' || obj.type === 'text') {
            const bounds = this.getObjectBounds(obj);
            this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        } else if (obj.type === 'circle') {
            const radius = Math.sqrt((obj.x2 - obj.x1) ** 2 + (obj.y2 - obj.y1) ** 2);
            this.ctx.beginPath();
            this.ctx.arc(obj.x1, obj.y1, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
        } else if (obj.type === 'rect') {
            this.ctx.strokeRect(obj.x1, obj.y1, obj.x2 - obj.x1, obj.y2 - obj.y1);
        } else {
            this.ctx.lineWidth = Math.max(obj.settings.thickness || 3, 5) + 6;
            this.ctx.globalAlpha = 0.3;
            
            this.ctx.beginPath();
            if (obj.type === 'line' || obj.type === 'arrow') {
                this.ctx.moveTo(obj.x1, obj.y1);
                this.ctx.lineTo(obj.x2, obj.y2);
            } else if (obj.type === 'curve') {
                const cp = {
                    x: (obj.x1 + obj.x2) / 2,
                    y: obj.y1 - Math.abs(obj.x2 - obj.x1) / 3
                };
                this.ctx.moveTo(obj.x1, obj.y1);
                this.ctx.quadraticCurveTo(cp.x, cp.y, obj.x2, obj.y2);
            }
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    drawShape(obj) {
        this.ctx.save();
        this.ctx.strokeStyle = obj.settings.color;
        this.ctx.lineWidth = obj.settings.thickness;
        
        if (obj.settings.neon) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = obj.settings.color;
        }
        
        if (obj.settings.dashed) {
            this.ctx.setLineDash([10, 10]);
        }
        
        this.ctx.beginPath();
        
        if (obj.type === 'line') {
            this.ctx.moveTo(obj.x1, obj.y1);
            this.ctx.lineTo(obj.x2, obj.y2);
        } else if (obj.type === 'arrow') {
            this.ctx.moveTo(obj.x1, obj.y1);
            this.ctx.lineTo(obj.x2, obj.y2);
            const angle = Math.atan2(obj.y2 - obj.y1, obj.x2 - obj.x1);
            const headlen = 15 + obj.settings.thickness;
            this.ctx.moveTo(obj.x2, obj.y2);
            this.ctx.lineTo(obj.x2 - headlen * Math.cos(angle - Math.PI / 6), obj.y2 - headlen * Math.sin(angle - Math.PI / 6));
            this.ctx.moveTo(obj.x2, obj.y2);
            this.ctx.lineTo(obj.x2 - headlen * Math.cos(angle + Math.PI / 6), obj.y2 - headlen * Math.sin(angle + Math.PI / 6));
        } else if (obj.type === 'curve') {
            const cp = {
                x: (obj.x1 + obj.x2) / 2,
                y: obj.y1 - Math.abs(obj.x2 - obj.x1) / 3
            };
            this.ctx.moveTo(obj.x1, obj.y1);
            this.ctx.quadraticCurveTo(cp.x, cp.y, obj.x2, obj.y2);
        } else if (obj.type === 'circle') {
            const radius = Math.sqrt((obj.x2 - obj.x1) ** 2 + (obj.y2 - obj.y1) ** 2);
            this.ctx.arc(obj.x1, obj.y1, radius, 0, 2 * Math.PI);
        } else if (obj.type === 'rect') {
            this.ctx.rect(obj.x1, obj.y1, obj.x2 - obj.x1, obj.y2 - obj.y1);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawPreview(x1, y1, x2, y2) {
        this.ctx.save();
        this.ctx.strokeStyle = this.drawSettings.color;
        this.ctx.lineWidth = this.drawSettings.thickness;
        
        if (this.drawSettings.neon) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = this.drawSettings.color;
        }
        
        if (this.drawSettings.dashed) {
            this.ctx.setLineDash([10, 10]);
        }
        
        this.ctx.beginPath();
        
        if (this.currentTool === 'line') {
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
        } else if (this.currentTool === 'arrow') {
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headlen = 15 + this.drawSettings.thickness;
            this.ctx.moveTo(x2, y2);
            this.ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
            this.ctx.moveTo(x2, y2);
            this.ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        } else if (this.currentTool === 'curve') {
            const cp = { x: (x1 + x2) / 2, y: y1 - Math.abs(x2 - x1) / 3 };
            this.ctx.moveTo(x1, y1);
            this.ctx.quadraticCurveTo(cp.x, cp.y, x2, y2);
        } else if (this.currentTool === 'circle') {
            const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            this.ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        } else if (this.currentTool === 'rect') {
            this.ctx.rect(x1, y1, x2 - x1, y2 - y1);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawSelection(obj) {
        this.ctx.save();
        
        if (this.currentTool === 'delete') {
            this.ctx.strokeStyle = '#ff5252';
        } else {
            this.ctx.strokeStyle = '#ff9800';
        }
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 4]);
        
        if (obj.type === 'icon' || obj.type === 'text') {
            const bounds = this.getObjectBounds(obj);
            this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        } else if (obj.type === 'circle') {
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            const radius = Math.sqrt((obj.x2 - obj.x1) ** 2 + (obj.y2 - obj.y1) ** 2);
            this.ctx.arc(obj.x1, obj.y1, radius, 0, 2 * Math.PI);
            this.ctx.stroke();
        } else if (obj.type === 'rect') {
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(obj.x1, obj.y1, obj.x2 - obj.x1, obj.y2 - obj.y1);
        } else {
            this.ctx.lineWidth = Math.max(obj.settings.thickness || 3, 5) + 8;
            this.ctx.globalAlpha = 0.5;
            
            this.ctx.beginPath();
            if (obj.type === 'line' || obj.type === 'arrow') {
                this.ctx.moveTo(obj.x1, obj.y1);
                this.ctx.lineTo(obj.x2, obj.y2);
            } else if (obj.type === 'curve') {
                const cp = {
                    x: (obj.x1 + obj.x2) / 2,
                    y: obj.y1 - Math.abs(obj.x2 - obj.x1) / 3
                };
                this.ctx.moveTo(obj.x1, obj.y1);
                this.ctx.quadraticCurveTo(cp.x, cp.y, obj.x2, obj.y2);
            }
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    getObjectBounds(obj) {
        if (obj.type === 'icon') {
            return {
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height
            };
        } else if (obj.type === 'text') {
            return this.getTextBounds(obj);
        } else {
            const minX = Math.min(obj.x1, obj.x2);
            const maxX = Math.max(obj.x1, obj.x2);
            const minY = Math.min(obj.y1, obj.y2);
            const maxY = Math.max(obj.y1, obj.y2);
            const padding = 20;
            return {
                x: minX - padding,
                y: minY - padding,
                width: maxX - minX + padding * 2,
                height: maxY - minY + padding * 2
            };
        }
    }

    redrawBackground() {
        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        
        if (this.backgroundImage) {
            const scaleW = this.bgScale.width / 100;
            const scaleH = this.bgScale.height / 100;
            const width = this.backgroundImage.width * scaleW;
            const height = this.backgroundImage.height * scaleH;
            const x = (this.bgCanvas.width - width) / 2;
            const y = (this.bgCanvas.height - height) / 2;
            
            this.bgCtx.globalAlpha = this.bgScale.opacity / 100;
            this.bgCtx.drawImage(this.backgroundImage, x, y, width, height);
            this.bgCtx.globalAlpha = 1;
        }
    }

    toggleInstructions() {
        const header = document.getElementById('instructionsToggle');
        const content = document.getElementById('instructionsContent');
        header.classList.toggle('collapsed');
        content.classList.toggle('hidden');
    }

    showObjectProperties(obj) {
        const panel = document.getElementById('objectProperties');
        const content = document.getElementById('objectPropertiesContent');
        const cloneBtn = document.getElementById('cloneObjectBtn');
        
        panel.style.display = 'block';
        
        const newCloneBtn = cloneBtn.cloneNode(true);
        cloneBtn.parentNode.replaceChild(newCloneBtn, cloneBtn);
        
        document.getElementById('cloneObjectBtn').addEventListener('click', () => {
            this.cloneObject(obj);
        });
        
        if (obj.type === 'icon') {
            content.innerHTML = `
                <div class="control-row">
                    <label><strong>Nome:</strong> ${obj.name}</label>
                </div>
                <div class="control-row">
                    <label>Larghezza: <span id="objWidthValue">${obj.width}</span>px</label>
                    <input type="number" id="objWidth" min="10" max="1000" value="${obj.width}">
                </div>
                <div class="control-row">
                    <label>Altezza: <span id="objHeightValue">${obj.height}</span>px</label>
                    <input type="number" id="objHeight" min="10" max="1000" value="${obj.height}">
                </div>
                <div class="control-row">
                    <label>Scala: <span id="objScaleValue">100</span>%</label>
                    <input type="range" id="objScale" min="10" max="500" value="100">
                </div>
                <button id="applyObjProps" class="btn btn-small">✓ Applica</button>
            `;
            
            const widthInput = document.getElementById('objWidth');
            const heightInput = document.getElementById('objHeight');
            const scaleInput = document.getElementById('objScale');
            const applyBtn = document.getElementById('applyObjProps');
            
            const originalWidth = obj.width;
            const originalHeight = obj.height;
            
            widthInput.addEventListener('input', (e) => {
                document.getElementById('objWidthValue').textContent = e.target.value;
            });
            
            heightInput.addEventListener('input', (e) => {
                document.getElementById('objHeightValue').textContent = e.target.value;
            });
            
            scaleInput.addEventListener('input', (e) => {
                const scale = parseInt(e.target.value) / 100;
                const newWidth = Math.round(originalWidth * scale);
                const newHeight = Math.round(originalHeight * scale);
                widthInput.value = newWidth;
                heightInput.value = newHeight;
                document.getElementById('objWidthValue').textContent = newWidth;
                document.getElementById('objHeightValue').textContent = newHeight;
                document.getElementById('objScaleValue').textContent = e.target.value;
            });
            
            applyBtn.addEventListener('click', () => {
                obj.width = parseInt(widthInput.value);
                obj.height = parseInt(heightInput.value);
                this.render();
                this.saveToLocalStorage();
            });
            
        } else if (obj.type === 'text') {
            content.innerHTML = `
                <div class="control-row">
                    <label><strong>Testo:</strong> ${obj.text.substring(0, 30)}${obj.text.length > 30 ? '...' : ''}</label>
                </div>
                <div class="control-row">
                    <label><strong>Righe:</strong> ${obj.lines ? obj.lines.length : 1}</label>
                </div>
                <div class="control-row">
                    <label>Dimensione Font: <span id="objFontSizeValue">${obj.settings.size}</span>px</label>
                    <input type="number" id="objFontSize" min="10" max="200" value="${obj.settings.size}">
                </div>
                <div class="control-row">
                    <label>Scala: <span id="objScaleValue">100</span>%</label>
                    <input type="range" id="objScale" min="10" max="500" value="100">
                </div>
                <button id="applyObjProps" class="btn btn-small">✓ Applica</button>
            `;
            
            const fontSizeInput = document.getElementById('objFontSize');
            const scaleInput = document.getElementById('objScale');
            const applyBtn = document.getElementById('applyObjProps');
            
            const originalSize = obj.settings.size;
            
            fontSizeInput.addEventListener('input', (e) => {
                document.getElementById('objFontSizeValue').textContent = e.target.value;
            });
            
            scaleInput.addEventListener('input', (e) => {
                const scale = parseInt(e.target.value) / 100;
                const newSize = Math.round(originalSize * scale);
                fontSizeInput.value = newSize;
                document.getElementById('objFontSizeValue').textContent = newSize;
                document.getElementById('objScaleValue').textContent = e.target.value;
            });
            
            applyBtn.addEventListener('click', () => {
                obj.settings.size = parseInt(fontSizeInput.value);
                this.render();
                this.saveToLocalStorage();
            });
        } else {
            content.innerHTML = `
                <div class="control-row">
                    <label><strong>Tipo:</strong> ${obj.type}</label>
                </div>
                <div class="control-row">
                    <label><strong>Colore:</strong></label>
                    <input type="color" id="objColor" value="${obj.settings.color}">
                </div>
                <div class="control-row">
                    <label>Spessore: <span id="objThicknessValue">${obj.settings.thickness}</span>px</label>
                    <input type="range" id="objThickness" min="1" max="30" value="${obj.settings.thickness}">
                </div>
                <button id="applyObjProps" class="btn btn-small">✓ Applica</button>
            `;
            
            const colorInput = document.getElementById('objColor');
            const thicknessInput = document.getElementById('objThickness');
            const applyBtn = document.getElementById('applyObjProps');
            
            thicknessInput.addEventListener('input', (e) => {
                document.getElementById('objThicknessValue').textContent = e.target.value;
            });
            
            applyBtn.addEventListener('click', () => {
                obj.settings.color = colorInput.value;
                obj.settings.thickness = parseInt(thicknessInput.value);
                this.render();
                this.saveToLocalStorage();
            });
        }
    }

    cloneObject(obj) {
        const clonedObj = JSON.parse(JSON.stringify(obj));
        clonedObj.id = Date.now();
        
        if (obj.type === 'icon' || obj.type === 'text') {
            clonedObj.x = obj.x + 30;
            clonedObj.y = obj.y + 30;
        } else {
            clonedObj.x1 = obj.x1 + 30;
            clonedObj.y1 = obj.y1 + 30;
            clonedObj.x2 = obj.x2 + 30;
            clonedObj.y2 = obj.y2 + 30;
        }
        
        if (obj.type === 'icon') {
            const img = new Image();
            img.onload = () => {
                clonedObj.image = img;
                this.objects.push(clonedObj);
                this.selectedObject = clonedObj;
                this.render();
                this.saveToLocalStorage();
            };
            img.src = obj.image.src;
        } else {
            this.objects.push(clonedObj);
            this.selectedObject = clonedObj;
            this.render();
            this.saveToLocalStorage();
        }
        
        alert('✅ Oggetto clonato!');
    }

    hideObjectProperties() {
        const panel = document.getElementById('objectProperties');
        panel.style.display = 'none';
    }

    clearCanvas() {
        if (!confirm('Eliminare tutto il contenuto del canvas?')) return;
        this.objects = [];
        this.selectedObject = null;
        this.backgroundImage = null;
        this.bgScale = { width: 100, height: 100, opacity: 100 };
        document.getElementById('bgControls').style.display = 'none';
        this.redrawBackground();
        this.render();
        this.saveToLocalStorage();
    }

    saveProject() {
        this.saveToLocalStorage();
        
        const data = {
            version: '1.0',
            background: this.backgroundImage ? this.bgCanvas.toDataURL() : null,
            bgScale: this.bgScale,
            icons: this.loadedIcons,
            objects: this.objects.map(obj => {
                if (obj.type === 'icon') {
                    return {
                        id: obj.id,
                        type: obj.type,
                        name: obj.name,
                        src: obj.image.src,
                        x: obj.x,
                        y: obj.y,
                        width: obj.width,
                        height: obj.height
                    };
                }
                return obj;
            })
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `network-topology-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        alert('✅ Progetto salvato e scaricato!');
    }

    loadProject() {
        document.getElementById('projectUpload').click();
    }

    handleProjectUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                this.objects = [];
                this.selectedObject = null;
                
                if (data.background) {
                    const img = new Image();
                    img.onload = () => {
                        this.backgroundImage = img;
                        this.bgScale = data.bgScale || { width: 100, height: 100, opacity: 100 };
                        
                        document.getElementById('bgWidth').value = this.bgScale.width;
                        document.getElementById('bgHeight').value = this.bgScale.height;
                        document.getElementById('bgOpacity').value = this.bgScale.opacity;
                        document.getElementById('bgWidthValue').textContent = this.bgScale.width;
                        document.getElementById('bgHeightValue').textContent = this.bgScale.height;
                        document.getElementById('bgOpacityValue').textContent = this.bgScale.opacity;
                        
                        document.getElementById('bgControls').style.display = 'block';
                        this.redrawBackground();
                    };
                    img.src = data.background;
                }
                
                if (data.icons) {
                    this.loadedIcons = [];
                    this.iconLibrary.innerHTML = '';
                    
                    data.icons.forEach(icon => {
                        this.loadedIcons.push(icon);
                        this.addIconToLibrary(icon);
                    });
                }
                
                if (data.objects) {
                    data.objects.forEach(objData => {
                        if (objData.type === 'icon') {
                            const img = new Image();
                            img.onload = () => {
                                this.objects.push({
                                    id: objData.id,
                                    type: objData.type,
                                    name: objData.name,
                                    image: img,
                                    x: objData.x,
                                    y: objData.y,
                                    width: objData.width,
                                    height: objData.height
                                });
                                this.render();
                            };
                            img.src = objData.src;
                        } else {
                            this.objects.push(objData);
                        }
                    });
                    
                    setTimeout(() => this.render(), 200);
                }
                
                this.saveToLocalStorage();
                alert('✅ Progetto caricato con successo!');
                
            } catch (error) {
                console.error('Error loading project:', error);
                alert('❌ Errore nel caricamento del progetto');
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }

    saveToLocalStorage() {
        const data = {
            version: '1.0',
            background: this.backgroundImage ? this.bgCanvas.toDataURL() : null,
            bgScale: this.bgScale,
            icons: this.loadedIcons,
            objects: this.objects.map(obj => {
                if (obj.type === 'icon') {
                    return {
                        id: obj.id,
                        type: obj.type,
                        name: obj.name,
                        src: obj.image.src,
                        x: obj.x,
                        y: obj.y,
                        width: obj.width,
                        height: obj.height
                    };
                }
                return obj;
            })
        };
        localStorage.setItem('networkDesignerPro', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('networkDesignerPro');
        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            
            if (data.background) {
                const img = new Image();
                img.onload = () => {
                    this.backgroundImage = img;
                    this.bgScale = data.bgScale || { width: 100, height: 100, opacity: 100 };
                    
                    document.getElementById('bgWidth').value = this.bgScale.width;
                    document.getElementById('bgHeight').value = this.bgScale.height;
                    document.getElementById('bgOpacity').value = this.bgScale.opacity;
                    document.getElementById('bgWidthValue').textContent = this.bgScale.width;
                    document.getElementById('bgHeightValue').textContent = this.bgScale.height;
                    document.getElementById('bgOpacityValue').textContent = this.bgScale.opacity;
                    
                    document.getElementById('bgControls').style.display = 'block';
                    this.redrawBackground();
                };
                img.src = data.background;
            }
            
            if (data.icons) {
                data.icons.forEach(icon => {
                    this.loadedIcons.push(icon);
                    this.addIconToLibrary(icon);
                });
            }
            
            if (data.objects) {
                data.objects.forEach(objData => {
                    if (objData.type === 'icon') {
                        const img = new Image();
                        img.onload = () => {
                            this.objects.push({
                                id: objData.id,
                                type: objData.type,
                                name: objData.name,
                                image: img,
                                x: objData.x,
                                y: objData.y,
                                width: objData.width,
                                height: objData.height
                            });
                            this.render();
                        };
                        img.src = objData.src;
                    } else {
                        this.objects.push(objData);
                    }
                });
                setTimeout(() => this.render(), 100);
            }
        } catch (error) {
            console.error('Load error:', error);
        }
    }

    saveToMyLibrary() {
        if (!this.selectedObject || this.selectedObject.type !== 'icon') {
            alert('⚠️ Seleziona prima un\'icona da salvare nella libreria!');
            return;
        }
        
        const name = prompt('Nome per questa icona:', this.selectedObject.name || 'Icon');
        if (!name) return;
        
        const exists = this.myLibrary.find(item => item.name === name);
        if (exists) {
            if (!confirm(`Un'icona con nome "${name}" esiste già. Sostituire?`)) {
                return;
            }
            this.myLibrary = this.myLibrary.filter(item => item.name !== name);
        }
        
        const libraryItem = {
            name: name,
            src: this.selectedObject.image.src,
            width: this.selectedObject.width,
            height: this.selectedObject.height,
            savedAt: Date.now()
        };
        
        this.myLibrary.push(libraryItem);
        this.saveMyLibraryToStorage();
        this.renderMyLibrary();
        
        alert(`✅ "${name}" salvata nella tua libreria personale!`);
    }

    loadMyLibrary() {
        const saved = localStorage.getItem('myIconLibrary');
        if (saved) {
            try {
                this.myLibrary = JSON.parse(saved);
                this.renderMyLibrary();
            } catch (error) {
                console.error('Error loading library:', error);
                this.myLibrary = [];
            }
        }
    }

    saveMyLibraryToStorage() {
        localStorage.setItem('myIconLibrary', JSON.stringify(this.myLibrary));
    }

    renderMyLibrary() {
        const grid = document.getElementById('myLibraryGrid');
        
        if (!grid) {
            console.error('myLibraryGrid not found');
            return;
        }
        
        if (this.myLibrary.length === 0) {
            grid.innerHTML = '<p class="placeholder-small">Nessuna icona salvata. Seleziona un\'icona dal canvas e clicca "⭐ Salva Selezionata"</p>';
            return;
        }
        
        grid.innerHTML = '';
        
        this.myLibrary.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'my-library-item';
            div.setAttribute('data-index', index);
            div.innerHTML = `
                <div class="delete-icon">×</div>
                <img src="${item.src}" alt="${item.name}">
                <span>${item.name}</span>
            `;
            
            div.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-icon')) {
                    this.addFromMyLibrary(item);
                }
            });
            
            const deleteBtn = div.querySelector('.delete-icon');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(div.getAttribute('data-index'));
                if (confirm(`Rimuovere "${item.name}" dalla libreria?`)) {
                    this.myLibrary.splice(idx, 1);
                    this.saveMyLibraryToStorage();
                    this.renderMyLibrary();
                }
            });
            
            grid.appendChild(div);
        });
    }

    addFromMyLibrary(item) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const obj = {
                id: Date.now(),
                type: 'icon',
                name: item.name,
                image: img,
                x: 50,
                y: 50,
                width: item.width || 100,
                height: item.height || 100
            };
            this.objects.push(obj);
            this.render();
            this.saveToLocalStorage();
        };
        img.src = item.src;
    }

    clearMyLibrary() {
        if (this.myLibrary.length === 0) {
            alert('ℹ️ La libreria è già vuota!');
            return;
        }
        
        const count = this.myLibrary.length;
        if (!confirm(`⚠️ Vuoi davvero eliminare TUTTE le ${count} icone dalla tua libreria personale?\n\nQuesta azione non può essere annullata!`)) {
            return;
        }
        
        this.myLibrary = [];
        this.saveMyLibraryToStorage();
        this.renderMyLibrary();
        alert(`🗑️ Libreria svuotata! ${count} icone eliminate.`);
    }

    exportCustomSize() {
        const width = this.exportSettings.width;
        const height = this.exportSettings.height;
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');
        
        const scaleX = width / this.bgCanvas.width;
        const scaleY = height / this.bgCanvas.height;
        ctx.scale(scaleX, scaleY);
        
        if (this.backgroundImage) {
            const scaleW = this.bgScale.width / 100;
            const scaleH = this.bgScale.height / 100;
            const bgWidth = this.backgroundImage.width * scaleW;
            const bgHeight = this.backgroundImage.height * scaleH;
            const x = (this.bgCanvas.width - bgWidth) / 2;
            const y = (this.bgCanvas.height - bgHeight) / 2;
            ctx.globalAlpha = this.bgScale.opacity / 100;
            ctx.drawImage(this.backgroundImage, x, y, bgWidth, bgHeight);
            ctx.globalAlpha = 1;
        }
        
        this.objects.forEach(obj => {
            if (obj.type === 'icon') {
                ctx.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
            } else if (obj.type === 'text') {
                ctx.save();
                ctx.font = `${obj.settings.bold ? 'bold' : ''} ${obj.settings.italic ? 'italic' : ''} ${obj.settings.size}px ${obj.settings.font}`;
                ctx.fillStyle = obj.settings.color;
                
                // MODIFICA: Esporta anche il testo multi-linea
                if (obj.lines && obj.lines.length > 0) {
                    const lineHeight = obj.settings.size * 1.4;
                    obj.lines.forEach((line, index) => {
                        ctx.fillText(line, obj.x, obj.y + (index * lineHeight));
                    });
                } else {
                    ctx.fillText(obj.text, obj.x, obj.y);
                }
                
                ctx.restore();
            } else {
                ctx.save();
                ctx.strokeStyle = obj.settings.color;
                ctx.lineWidth = obj.settings.thickness;
                
                if (obj.settings.neon) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = obj.settings.color;
                }
                
                if (obj.settings.dashed) {
                    ctx.setLineDash([10, 10]);
                }
                
                ctx.beginPath();
                
                if (obj.type === 'line') {
                    ctx.moveTo(obj.x1, obj.y1);
                    ctx.lineTo(obj.x2, obj.y2);
                } else if (obj.type === 'arrow') {
                    ctx.moveTo(obj.x1, obj.y1);
                    ctx.lineTo(obj.x2, obj.y2);
                    const angle = Math.atan2(obj.y2 - obj.y1, obj.x2 - obj.x1);
                    const headlen = 15 + obj.settings.thickness;
                    ctx.moveTo(obj.x2, obj.y2);
                    ctx.lineTo(obj.x2 - headlen * Math.cos(angle - Math.PI / 6), obj.y2 - headlen * Math.sin(angle - Math.PI / 6));
                    ctx.moveTo(obj.x2, obj.y2);
                    ctx.lineTo(obj.x2 - headlen * Math.cos(angle + Math.PI / 6), obj.y2 - headlen * Math.sin(angle + Math.PI / 6));
                } else if (obj.type === 'curve') {
                    const cp = { x: (obj.x1 + obj.x2) / 2, y: obj.y1 - Math.abs(obj.x2 - obj.x1) / 3 };
                    ctx.moveTo(obj.x1, obj.y1);
                    ctx.quadraticCurveTo(cp.x, cp.y, obj.x2, obj.y2);
                } else if (obj.type === 'circle') {
                    const radius = Math.sqrt((obj.x2 - obj.x1) ** 2 + (obj.y2 - obj.y1) ** 2);
                    ctx.arc(obj.x1, obj.y1, radius, 0, 2 * Math.PI);
                } else if (obj.type === 'rect') {
                    ctx.rect(obj.x1, obj.y1, obj.x2 - obj.x1, obj.y2 - obj.y1);
                }
                
                ctx.stroke();
                ctx.restore();
            }
        });
        
        const link = document.createElement('a');
        link.download = `network-topology-${width}x${height}-${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
        
        alert(`✅ Immagine esportata: ${width}x${height}px`);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new NetworkDesignerPro();
    console.log('✅ Network Topology Designer Pro caricato con supporto TESTO MULTI-LINEA!');
});
