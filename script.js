// ========================================
// VARIABLES GLOBALES
// ========================================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let currentStep = 1; 

let loadedImage = null;
let fieldBounds = null;
let isDrawingField = false;
let fieldStartPos = null;

let obstacles = [];
let shooters = [];
let previewLines = []; 
let lockedLines = [];  
let arrows = [];       

// Variables de mode
let isStrategyMode = false; 
let currentStrategyPlayer = 1; 
let currentStrategyTool = 'place'; 

let isDrawingArrow = false;
let arrowStartPos = null;
let arrowCurrentPos = null;

let selectedObstacleType = 'snake';
let selectedObstacleHeight = 'low';
let obstacleSize = 25;
let currentRotation = 0;

let shooterStance = 'standing';
let shooterTeam = 'left'; 

const SHOOTER_COLORS = ['rgba(255,0,0,0.3)', 'rgba(0,0,255,0.3)', 'rgba(255,165,0,0.3)', 'rgba(148,0,211,0.3)', 'rgba(0,255,255,0.3)', 'rgba(255,20,147,0.3)', 'rgba(0,255,0,0.3)', 'rgba(255,255,0,0.3)'];
const OBSTACLE_CONFIG = {
    snake:  { height: 'low',    color: 'rgba(101, 67, 33, 0.7)',  shape: 'rect',     w: 4,   h: 0.8 },
    dorito: { height: 'high', color: 'rgba(139, 69, 19, 0.7)',  shape: 'triangle', w: 2,   h: 2   },
    can:    { height: 'medium', color: 'rgba(160, 82, 45, 0.7)',  shape: 'circle',   w: 1.5, h: 1.5 },
    brick:  { height: 'medium', color: 'rgba(178, 34, 34, 0.7)',  shape: 'rect',     w: 2,   h: 1   },
    temple: { height: 'high',   color: 'rgba(120, 60, 30, 0.7)',  shape: 'rect',     w: 3,   h: 1.5   },
    goat:   { height: 'low',    color: 'rgba(245, 222, 179, 0.7)',shape: 'rect',     w: 1.5, h: 1.5 },
    totem:  { height: 'high',   color: 'rgba(105, 105, 105, 0.7)',shape: 'circle',   w: 1,   h: 1   },
    x:      { height: 'medium', color: 'rgba(139, 69, 19, 0.7)',  shape: 'polygon', w: 2, h: 2, vertices: [{x: -1, y: -1}, {x: -0.4, y: -1}, {x: 0, y: -0.3}, {x: 0.4, y: -1}, {x: 1, y: -1}, {x: 0.3, y: 0}, {x: 1, y: 1}, {x: 0.4, y: 1}, {x: 0, y: 0.3}, {x: -0.4, y: 1}, {x: -1, y: 1}, {x: -0.3, y: 0}] }
};

// ========================================
// CONTROLEURS
// ========================================
window.setAppMode = function(mode) {
    document.getElementById('btn-mode-calc').classList.remove('active');
    document.getElementById('btn-mode-strat').classList.remove('active');
    document.getElementById('btn-mode-' + mode).classList.add('active');
    isStrategyMode = (mode === 'strat');
};

window.setTool = function(tool) {
    currentStrategyTool = tool;
    document.getElementById('btn-tool-place').classList.remove('active');
    document.getElementById('btn-tool-select').classList.remove('active');
    document.getElementById('btn-tool-arrow').classList.remove('active');
    document.getElementById('btn-tool-' + tool).classList.add('active');
};

window.nextStrategyPlayer = function() {
    previewLines = []; 
    if (currentStrategyPlayer < 5) {
        currentStrategyPlayer++;
        document.getElementById('currentPlayerNum').textContent = currentStrategyPlayer;
        document.getElementById('btnNextPlayerNum').textContent = currentStrategyPlayer;
        setTool('place'); 
        updateUI(); drawCanvas();
    } else {
        goToStep(4); 
    }
};

window.goToStep = function(step) {
    if ((step === 1 || step === 2) && currentStep >= 3) {
        shooters = []; previewLines = []; lockedLines = []; arrows = [];
        currentStrategyPlayer = 1; 
        document.getElementById('currentPlayerNum').textContent = "1"; 
        document.getElementById('btnNextPlayerNum').textContent = "1";
        updateUI();
        drawCanvas();
    }

    currentStep = step;
    
    for(let i=1; i<=4; i++) {
        document.getElementById('indicator-step'+i).classList.remove('active');
        document.getElementById('panel-step'+i).style.display = 'none';
    }
    document.getElementById('indicator-step'+step).classList.add('active');
    document.getElementById('panel-step'+step).style.display = 'block';

    if (step === 1 || step === 4) canvas.style.cursor = 'default';
    if (step === 2 || step === 3) canvas.style.cursor = 'crosshair';

    if (step === 3) {
        if (isStrategyMode) {
            document.getElementById('step3-title').innerHTML = '👥 3. Planification Joueur par Joueur';
            document.getElementById('step3-desc').textContent = 'Construis le playbook. Pose le joueur, valide ses lignes, dessine sa relance.';
            document.getElementById('strategy-tools-step3').style.display = 'block';
            document.getElementById('actions-calc').style.display = 'none';
            document.getElementById('actions-strat').style.display = 'flex';
        } else {
            document.getElementById('step3-title').innerHTML = '👥 3. Déploiement Global';
            document.getElementById('step3-desc').textContent = 'Place tes 5 joueurs. L\'analyse est en direct.';
            document.getElementById('strategy-tools-step3').style.display = 'none';
            document.getElementById('actions-calc').style.display = 'flex';
            document.getElementById('actions-strat').style.display = 'none';
        }
    }

    if (step === 4) {
        document.getElementById('recap-calc').style.display = isStrategyMode ? 'none' : 'block';
        document.getElementById('recap-strat').style.display = isStrategyMode ? 'block' : 'none';
    }
};

// ========================================
// NOUVEAU : FONCTION EXPORT IMAGE
// ========================================
window.exportPlan = function() {
    const link = document.createElement('a');
    link.download = 'Plan_Los_Calamares.png'; 
    link.href = canvas.toDataURL('image/png');
    link.click();
};

window.toggleShooter = function(id) {
    const shooter = shooters.find(s => s.id === id);
    if (shooter) {
        shooter.active = !shooter.active;
        calculateSightlines();
        updateUI();
        drawCanvas();
    }
};

// ========================================
// NOUVEAU : FONCTION SAUVEGARDE / CHARGEMENT LAYOUT
// ========================================
window.exportLayout = function() {
    if (!loadedImage) {
        alert("Aucun terrain à exporter !");
        return;
    }
    const layoutData = {
        imageSrc: loadedImage.src,
        fieldBounds: fieldBounds,
        obstacles: obstacles
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layoutData));
    const link = document.createElement('a');
    link.download = 'Paintball_Layout.json';
    link.href = dataStr;
    link.click();
};

window.saveLayoutLocal = function() {
    if (!loadedImage) {
        alert("Aucun terrain à sauvegarder !");
        return;
    }
    const layoutData = {
        imageSrc: loadedImage.src,
        fieldBounds: fieldBounds,
        obstacles: obstacles
    };
    try {
        localStorage.setItem('Paintball_SavedLayout', JSON.stringify(layoutData));
        alert("Layout sauvegardé avec succès dans votre navigateur !");
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert("L'image est trop volumineuse pour être sauvegardée dans le navigateur. Téléchargement d'un fichier de sauvegarde...");
            window.exportLayout();
        } else {
            alert("Erreur lors de la sauvegarde locale.");
        }
    }
};

window.loadLayoutLocal = function() {
    const saved = localStorage.getItem('Paintball_SavedLayout');
    if (saved) {
        try {
            const layoutData = JSON.parse(saved);
            window.loadLayoutData(layoutData);
        } catch (e) {
            alert("Erreur lors du chargement du layout sauvegardé.");
        }
    } else {
        alert("Aucun layout sauvegardé trouvé dans le navigateur.");
    }
};

window.loadLayoutData = function(layoutData) {
    if (layoutData.imageSrc) {
        const img = new Image();
        img.onload = () => {
            loadedImage = img;
            fieldBounds = layoutData.fieldBounds || null;
            obstacles = layoutData.obstacles || [];
            
            shooters = []; previewLines = []; lockedLines = []; arrows = [];
            currentStrategyPlayer = 1; 
            document.getElementById('currentPlayerNum').textContent = "1"; 
            document.getElementById('btnNextPlayerNum').textContent = "1";
            
            document.getElementById('detectionStatus').textContent = '✅ Layout chargé avec succès !';
            
            goToStep(2);
            updateUI();
            drawCanvas();
        };
        img.src = layoutData.imageSrc;
    }
};

// ========================================
// GESTIONNAIRES D'ÉVÉNEMENTS UI
// ========================================

document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => { loadedImage = img; fieldBounds = null; document.getElementById('detectionStatus').textContent = '✅ Layout chargé.'; drawCanvas(); };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('importLayoutInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const layoutData = JSON.parse(event.target.result);
            window.loadLayoutData(layoutData);
        } catch (err) {
            alert("Erreur lors de l'importation du layout. Le fichier est invalide.");
        }
        e.target.value = ''; // Permet de réimporter le même fichier
    };
    reader.readAsText(file);
});

document.getElementById('drawFieldBtn').addEventListener('click', () => {
    isDrawingField = true; fieldStartPos = null;
    document.getElementById('detectionStatus').textContent = 'Tracez le rectangle sur le layout...';
});

document.querySelectorAll('.obstacle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.obstacle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedObstacleType = btn.dataset.type; selectedObstacleHeight = btn.dataset.height;
    });
});

document.querySelectorAll('.stance-btn').forEach(btn => {
    if (btn.id.startsWith('btn-mode') || btn.id.startsWith('btn-tool')) return; 
    btn.addEventListener('click', () => {
        btn.parentElement.querySelectorAll('.stance-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.stance) shooterStance = btn.dataset.stance;
        if (btn.dataset.team) shooterTeam = btn.dataset.team;
    });
});

document.getElementById('sizeSlider').addEventListener('input', (e) => { 
    obstacleSize = parseInt(e.target.value); 
    document.getElementById('sizeValue').textContent = `Taille: ${obstacleSize} | Angle: ${currentRotation}°`; 
});

canvas.addEventListener('wheel', (e) => {
    if (currentStep !== 2) return; 
    e.preventDefault();
    if (e.shiftKey) { 
        currentRotation = (currentRotation + (e.deltaY > 0 ? 15 : -15)) % 360; 
        if (currentRotation < 0) currentRotation += 360; 
    } else { 
        obstacleSize = Math.max(15, Math.min(50, obstacleSize + (e.deltaY > 0 ? -2 : 2))); 
        document.getElementById('sizeSlider').value = obstacleSize; 
    }
    document.getElementById('sizeValue').textContent = `Taille: ${obstacleSize} | Angle: ${currentRotation}°`;
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if(confirm("Tout effacer et recommencer à zéro ?")) {
        obstacles = []; shooters = []; previewLines = []; lockedLines = []; arrows = []; fieldBounds = null; loadedImage = null;
        currentStrategyPlayer = 1; document.getElementById('currentPlayerNum').textContent = "1"; document.getElementById('btnNextPlayerNum').textContent = "1";
        document.getElementById('imageInput').value = ''; document.getElementById('detectionStatus').textContent = 'En attente d\'image...';
        goToStep(1); updateUI(); drawCanvas();
    }
});

function updateUI() {
    document.getElementById('lineCount').textContent = previewLines.length + lockedLines.length;

    const list = document.getElementById('shooterList');
    list.innerHTML = '';
    
    const uniqueShooters = isStrategyMode ? shooters.filter((s, i, a) => a.findIndex(t => t.playerNum === s.playerNum) === i) : shooters;

    const iconEye = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const iconEyeOff = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    uniqueShooters.forEach((s) => {
        const div = document.createElement('div'); div.className = 'shooter-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; opacity:${s.active ? 1 : 0.4}">
                <span style="color:${s.color.replace('0.3', '1')}; font-weight:bold;">●</span>
                <span>Joueur ${s.playerNum}</span>
            </div>
            <button onclick="toggleShooter(${s.id})" style="background:none; border:none; cursor:pointer; color: ${s.active ? '#94a3b8' : '#475569'}; display:flex; align-items:center; justify-content:center; padding:4px; transition:0.2s;" title="Afficher/Masquer" onmouseover="this.style.color='#38bdf8'" onmouseout="this.style.color='${s.active ? '#94a3b8' : '#475569'}'">
                ${s.active ? iconEye : iconEyeOff}
            </button>
        `;
        list.appendChild(div);
    });
}

// ========================================
// INTERACTION SOURIS (RADAR / PLACEMENT)
// ========================================
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

canvas.addEventListener('mousedown', (e) => {
    if (!loadedImage) return;
    const pos = getMousePos(e);

    if (isDrawingField && currentStep === 1) { fieldStartPos = pos; return; }

    if (currentStep === 2) {
        if (e.ctrlKey || e.metaKey) {
            const obsIndex = obstacles.findIndex(o => Math.hypot(o.x - pos.x, o.y - pos.y) < o.size + 10);
            if (obsIndex !== -1) obstacles.splice(obsIndex, 1);
        } else {
            obstacles.push({ x: pos.x, y: pos.y, type: selectedObstacleType, height: selectedObstacleHeight, size: obstacleSize, rotation: currentRotation });
        }
    }

    if (currentStep === 3) {
        if (!isStrategyMode) {
            if (e.ctrlKey || e.metaKey) {
                const shooterIndex = shooters.findIndex(s => Math.hypot(s.x - pos.x, s.y - pos.y) < 15);
                if (shooterIndex !== -1) shooters.splice(shooterIndex, 1);
            } else {
                if (shooters.length < 5) {
                    let newPlayerNum = 1;
                    while (shooters.some(s => s.playerNum === newPlayerNum)) {
                        newPlayerNum++;
                    }
                    shooters.push({ id: Date.now(), x: pos.x, y: pos.y, stance: shooterStance, team: shooterTeam, color: SHOOTER_COLORS[(newPlayerNum - 1) % SHOOTER_COLORS.length], active: true, playerNum: newPlayerNum });
                } else { alert("Tu ne peux placer que 5 joueurs max !"); }
            }
            calculateSightlines(); 
        } 
        else {
            if (e.ctrlKey) {
                const arrowIndex = arrows.findIndex(a => pointToLineDistance(pos.x, pos.y, a.x1, a.y1, a.x2, a.y2) < 10);
                if (arrowIndex !== -1) { arrows.splice(arrowIndex, 1); updateUI(); drawCanvas(); return; }

                const lineIndex = lockedLines.findIndex(l => pointToLineDistance(pos.x, pos.y, l.x1, l.y1, l.x2, l.y2) < 8);
                if (lineIndex !== -1) { lockedLines.splice(lineIndex, 1); updateUI(); drawCanvas(); return; }

                const shooterIndex = shooters.findIndex(s => Math.hypot(s.x - pos.x, s.y - pos.y) < 15);
                if (shooterIndex !== -1) shooters.splice(shooterIndex, 1);
                calculateSightlines();
            } else {
                if (currentStrategyTool === 'place') {
                    shooters.push({ id: Date.now(), x: pos.x, y: pos.y, stance: shooterStance, team: shooterTeam, color: SHOOTER_COLORS[(currentStrategyPlayer-1) % SHOOTER_COLORS.length], active: true, playerNum: currentStrategyPlayer });
                    calculateSightlines();
                } 
                else if (currentStrategyTool === 'select') {
                    let clickedPreviewIndex = -1; let minDistance = 8;
                    for (let i = previewLines.length - 1; i >= 0; i--) {
                        const dist = pointToLineDistance(pos.x, pos.y, previewLines[i].x1, previewLines[i].y1, previewLines[i].x2, previewLines[i].y2);
                        if (dist < minDistance) { minDistance = dist; clickedPreviewIndex = i; }
                    }
                    if (clickedPreviewIndex !== -1) { 
                        lockedLines.push(previewLines.splice(clickedPreviewIndex, 1)[0]); 
                    }
                } 
                else if (currentStrategyTool === 'arrow') {
                    isDrawingArrow = true; arrowStartPos = pos; arrowCurrentPos = pos; return;
                }
            }
        }
    }

    updateUI(); drawCanvas();
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawingField && fieldStartPos && currentStep === 1) {
        drawCanvas(); const pos = getMousePos(e);
        ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.strokeRect(fieldStartPos.x, fieldStartPos.y, pos.x - fieldStartPos.x, pos.y - fieldStartPos.y); ctx.setLineDash([]);
    }
    if (isDrawingArrow && arrowStartPos && currentStep === 3) { arrowCurrentPos = getMousePos(e); drawCanvas(); }
});

canvas.addEventListener('mouseup', (e) => {
    if (isDrawingField && fieldStartPos && currentStep === 1) {
        const pos = getMousePos(e); const w = Math.abs(pos.x - fieldStartPos.x); const h = Math.abs(pos.y - fieldStartPos.y);
        if (w > 20 && h > 20) { fieldBounds = { x: Math.min(fieldStartPos.x, pos.x), y: Math.min(fieldStartPos.y, pos.y), w: w, h: h }; document.getElementById('detectionStatus').textContent = '✅ Limites définies !'; }
        isDrawingField = false; fieldStartPos = null; updateUI(); drawCanvas();
    }
    if (isDrawingArrow && arrowStartPos && arrowCurrentPos && currentStep === 3) {
        if (Math.hypot(arrowCurrentPos.x - arrowStartPos.x, arrowCurrentPos.y - arrowStartPos.y) > 10) { 
            const playerColor = SHOOTER_COLORS[(currentStrategyPlayer-1) % SHOOTER_COLORS.length].replace('0.3', '1');
            arrows.push({ x1: arrowStartPos.x, y1: arrowStartPos.y, x2: arrowCurrentPos.x, y2: arrowCurrentPos.y, color: playerColor }); 
        }
        isDrawingArrow = false; arrowStartPos = null; arrowCurrentPos = null; drawCanvas();
    }
});

// ========================================
// MOTEUR DE RENDU
// ========================================
function drawCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (loadedImage) ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

    if (fieldBounds) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)'; ctx.lineWidth = 3; ctx.strokeRect(fieldBounds.x, fieldBounds.y, fieldBounds.w, fieldBounds.h);
        const centerX = fieldBounds.x + fieldBounds.w / 2;
        ctx.beginPath(); ctx.moveTo(centerX, fieldBounds.y); ctx.lineTo(centerX, fieldBounds.y + fieldBounds.h);
        ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(239, 83, 80, 0.6)'; ctx.stroke(); ctx.setLineDash([]); 
    }

    ctx.globalAlpha = 1.0; 
    lockedLines.forEach(line => {
        ctx.beginPath(); ctx.moveTo(line.x1, line.y1); ctx.lineTo(line.x2, line.y2);
        if (line.isBlind) { 
            ctx.setLineDash([5, 5]); ctx.strokeStyle = line.color.replace('0.3', '0.9'); ctx.lineWidth = 2.5; 
        } else { 
            ctx.setLineDash([]); ctx.strokeStyle = line.color.replace('0.3', '1'); ctx.lineWidth = 2; 
        }
        ctx.stroke(); ctx.setLineDash([]); 
    });

    ctx.globalAlpha = isStrategyMode ? 0.3 : 1.0; 
    previewLines.forEach(line => {
        ctx.beginPath(); ctx.moveTo(line.x1, line.y1); ctx.lineTo(line.x2, line.y2);
        if (line.isBlind) { 
            ctx.setLineDash([5, 5]); ctx.strokeStyle = isStrategyMode ? line.color.replace('0.3', '0.7') : line.color.replace('0.3', '0.9'); ctx.lineWidth = 2; 
        } else { 
            ctx.setLineDash([]); ctx.strokeStyle = isStrategyMode ? line.color : line.color.replace('0.3', '1'); ctx.lineWidth = 1.5; 
        }
        ctx.stroke(); ctx.setLineDash([]); 
    });

    ctx.globalAlpha = 1.0;
    obstacles.forEach(obs => {
        const config = OBSTACLE_CONFIG[obs.type]; if (!config) return;
        const w = obs.size * config.w; const h = obs.size * config.h;
        ctx.save(); ctx.translate(obs.x, obs.y); ctx.rotate(obs.rotation * Math.PI / 180);
        ctx.fillStyle = config.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath();
        if (config.shape === 'rect') { ctx.rect(-w/2, -h/2, w, h); } 
        else if (config.shape === 'circle') { ctx.arc(0, 0, w/2, 0, Math.PI * 2); } 
        else if (config.shape === 'triangle') { ctx.moveTo(0, -h/2); ctx.lineTo(w/2, h/2); ctx.lineTo(-w/2, h/2); ctx.closePath(); } 
        else if (config.shape === 'polygon') { ctx.moveTo(config.vertices[0].x * w/2, config.vertices[0].y * h/2); for (let i=1; i<config.vertices.length; i++) ctx.lineTo(config.vertices[i].x * w/2, config.vertices[i].y * h/2); ctx.closePath(); }
        ctx.fill(); ctx.stroke(); ctx.restore();
    });

    shooters.forEach((s) => {
        ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = s.active ? s.color.replace('0.3', '1') : s.color; ctx.fill();
        ctx.strokeStyle = s.team === 'left' ? '#000' : '#FFF'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = s.team === 'left' ? '#FFF' : '#000'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.playerNum, s.x, s.y);
    });

    arrows.forEach(a => drawArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.color));
    
    if (isDrawingArrow && arrowStartPos && arrowCurrentPos) {
        const liveColor = SHOOTER_COLORS[(currentStrategyPlayer-1) % SHOOTER_COLORS.length].replace('0.3', '1');
        drawArrow(ctx, arrowStartPos.x, arrowStartPos.y, arrowCurrentPos.x, arrowCurrentPos.y, liveColor);
    }
}

// ========================================
// MOTEUR BALISTIQUE & CALCULS MATHS
// ========================================
function calculateSightlines() {
    previewLines = []; 
    const minX = fieldBounds ? fieldBounds.x : 0; const maxX = fieldBounds ? fieldBounds.x + fieldBounds.w : canvas.width;
    const minY = fieldBounds ? fieldBounds.y : 0; const maxY = fieldBounds ? fieldBounds.y + fieldBounds.h : canvas.height;
    const centerX = fieldBounds ? fieldBounds.x + fieldBounds.w / 2 : canvas.width / 2;

    // NOUVEAU : Trouver la toute dernière position posée pour le joueur actuel
    let latestShooterId = null;
    if (isStrategyMode) {
        const playerShooters = shooters.filter(s => s.playerNum === currentStrategyPlayer);
        if (playerShooters.length > 0) {
            latestShooterId = playerShooters[playerShooters.length - 1].id;
        }
    }

    shooters.forEach(shooter => {
        // En mode stratégie, on ne calcule les brouillons QUE pour la DERNIÈRE position du joueur actuel !
        if (isStrategyMode && shooter.id !== latestShooterId) return;

        if (!shooter.active) return; // NOUVEAU: on ignore les joueurs cachés

        for (let angle = 0; angle < 360; angle += 1) {
            const rad = angle * Math.PI / 180; const step = 4;
            let currentX = shooter.x; let currentY = shooter.y;
            let tenduHit = false; let blindHit = (shooter.stance === 'prone'); 
            let tenduEnd = null; let blindEnd = null;
            
            while (currentX >= minX && currentX <= maxX && currentY >= minY && currentY <= maxY) {
                currentX += Math.cos(rad) * step; currentY += Math.sin(rad) * step;
                const distFromShooter = Math.hypot(currentX - shooter.x, currentY - shooter.y);
                let collidedObstacle = null;
                
                for (let obs of obstacles) {
                    const config = OBSTACLE_CONFIG[obs.type]; let collision = false;
                    const w = obs.size * config.w; const h = obs.size * config.h;
                    if (config.shape === 'circle') { collision = (Math.hypot(currentX - obs.x, currentY - obs.y) <= w/2); } 
                    else {
                        const dx = currentX - obs.x; const dy = currentY - obs.y; const angleRad = -obs.rotation * Math.PI / 180;
                        const localX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad); const localY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
                        if (config.shape === 'rect') { collision = (Math.abs(localX) <= w/2 && Math.abs(localY) <= h/2); } 
                        else if (config.shape === 'triangle') { if (localY >= -h/2 && localY <= h/2) collision = Math.abs(localX) <= ((w/2) * ((localY + h/2) / h)); } 
                        else if (config.shape === 'polygon') {
                            const normX = localX / (w/2); const normY = localY / (h/2); let inside = false;
                            for (let i = 0, j = config.vertices.length - 1; i < config.vertices.length; j = i++) {
                                if (((config.vertices[i].y > normY) !== (config.vertices[j].y > normY)) && (normX < (config.vertices[j].x - config.vertices[i].x) * (normY - config.vertices[i].y) / (config.vertices[j].y - config.vertices[i].y) + config.vertices[i].x)) inside = !inside;
                            }
                            collision = inside;
                        }
                    }
                    if (collision) { collidedObstacle = obs; break; }
                }
                
                if (collidedObstacle) {
                    const obs = collidedObstacle;
                    if (!tenduHit) {
                        let blocksTendu = false;
                        if (shooter.stance === 'standing') blocksTendu = (obs.height === 'high');
                        else if (shooter.stance === 'kneeling') blocksTendu = (obs.height === 'medium' || obs.height === 'high');
                        else if (shooter.stance === 'prone') blocksTendu = true;
                        if (blocksTendu) { tenduHit = true; tenduEnd = {x: currentX, y: currentY}; }
                    }
                    if (!blindHit) {
                        let blocksBlind = false;
                        if (distFromShooter < 50 || obs.type === 'totem' || distFromShooter > 250) blocksBlind = true; 
                        if (blocksBlind) { blindHit = true; blindEnd = {x: currentX, y: currentY}; }
                    }
                }
                if (tenduHit && blindHit) break; 
            }
            
            if (!tenduHit) tenduEnd = {x: currentX, y: currentY};
            if (!blindHit && shooter.stance !== 'prone') blindEnd = {x: currentX, y: currentY};
            
            let tenduUseful = true;
            if (shooter.team === 'left' && tenduEnd.x < centerX) tenduUseful = false;
            if (shooter.team === 'right' && tenduEnd.x > centerX) tenduUseful = false;
            if (tenduUseful) previewLines.push({ x1: shooter.x, y1: shooter.y, x2: tenduEnd.x, y2: tenduEnd.y, shooterId: shooter.id, color: shooter.color, isBlind: false });
            
            if (blindEnd) {
                let blindUseful = true;
                if (shooter.team === 'left' && blindEnd.x < centerX) blindUseful = false;
                if (shooter.team === 'right' && blindEnd.x > centerX) blindUseful = false;
                const distTendu = Math.hypot(tenduEnd.x - shooter.x, tenduEnd.y - shooter.y); const distBlind = Math.hypot(blindEnd.x - shooter.x, blindEnd.y - shooter.y);
                if (blindUseful && distBlind > distTendu + 15) previewLines.push({ x1: tenduEnd.x, y1: tenduEnd.y, x2: blindEnd.x, y2: blindEnd.y, shooterId: shooter.id, color: shooter.color, isBlind: true });
            }
        }
    });
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1; const B = py - y1; const C = x2 - x1; const D = y2 - y1;
    const dot = A * C + B * D; const lenSq = C * C + D * D; let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; } else if (param > 1) { xx = x2; yy = y2; } else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx; const dy = py - yy; return Math.sqrt(dx * dx + dy * dy);
}

function drawArrow(ctx, fromx, fromy, tox, toy, color) {
    const headlen = 12; const dx = tox - fromx; const dy = toy - fromy; const angle = Math.atan2(dy, dx);
    ctx.beginPath(); ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy); ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.stroke();
}

// ========================================
// TUTORIAL LOGIC
// ========================================
const tutorialSteps = [
    {
        title: "🦑 Bienvenue sur Paintball Analyser !",
        text: "Cet outil te permet de préparer tes layouts et stratégies. Il y a deux modes : <br><br><b>🧮 Live (Rapide)</b> : Pour analyser des lignes de tir globales en direct.<br><b>🗺️ Stratégie Pro</b> : Pour construire un playbook joueur par joueur."
    },
    {
        title: "⚙️ 1. Paramètres",
        text: "Commence par choisir ton mode, puis charge une image du terrain (le layout).<br><br>Ensuite, clique sur <b>Tracer les limites</b> et dessine un rectangle avec ta souris englobant l'aire de jeu sur l'image."
    },
    {
        title: "🚧 2. Modules",
        text: "Sélectionne un obstacle et clique sur le terrain pour le poser.<br><br><b>Astuces :</b><br>• Utilise la <b>molette</b> de la souris pour changer la taille<br>• <b>Shift + Molette</b> pour pivoter l'obstacle<br>• <b>Ctrl + Clic</b> pour supprimer un obstacle."
    },
    {
        title: "👥 3. Déploiement",
        text: "Place tes joueurs (maximum 5). Leurs lignes de tir s'afficheront automatiquement selon leur posture (debout, genou, couché).<br><br>En mode <b>Stratégie Pro</b>, tu peux valider une ligne intéressante en cliquant dessus, ou dessiner des parcours de course avec l'outil ↗️ Course."
    },
    {
        title: "✅ 4. Plan de Jeu",
        text: "Une fois ton plan terminé, tu peux exporter le résultat en image pour le partager avec ton équipe.<br><br>Prêt à élaborer les meilleures tactiques ? 🔫"
    }
];

let currentTutStep = 0;

function updateTutorial() {
    document.getElementById('tut-title').innerHTML = tutorialSteps[currentTutStep].title;
    document.getElementById('tut-body').innerHTML = `<p>${tutorialSteps[currentTutStep].text}</p>`;
    
    document.getElementById('tut-prev').style.display = currentTutStep === 0 ? 'none' : 'block';
    
    if (currentTutStep === tutorialSteps.length - 1) {
        document.getElementById('tut-next').textContent = "Commencer !";
        document.getElementById('tut-next').classList.remove('btn-primary');
        document.getElementById('tut-next').classList.add('btn-success');
    } else {
        document.getElementById('tut-next').textContent = "Suivant";
        document.getElementById('tut-next').classList.add('btn-primary');
        document.getElementById('tut-next').classList.remove('btn-success');
    }
    
    const dots = document.querySelectorAll('.tut-progress .dot');
    dots.forEach((dot, index) => {
        dot.className = index === currentTutStep ? 'dot active' : 'dot';
    });
}

document.getElementById('tutorialBtn').addEventListener('click', () => {
    currentTutStep = 0;
    updateTutorial();
    document.getElementById('tutorialModal').style.display = 'flex';
});

document.getElementById('tut-next').addEventListener('click', () => {
    if (currentTutStep < tutorialSteps.length - 1) {
        currentTutStep++;
        updateTutorial();
    } else {
        document.getElementById('tutorialModal').style.display = 'none';
    }
});

document.getElementById('tut-prev').addEventListener('click', () => {
    if (currentTutStep > 0) {
        currentTutStep--;
        updateTutorial();
    }
});

document.getElementById('tut-close').addEventListener('click', () => {
    document.getElementById('tutorialModal').style.display = 'none';
});

// Show tutorial automatically on first load
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('tutorialSeen_Paintball')) {
        currentTutStep = 0;
        updateTutorial();
        document.getElementById('tutorialModal').style.display = 'flex';
        localStorage.setItem('tutorialSeen_Paintball', 'true');
    }
});