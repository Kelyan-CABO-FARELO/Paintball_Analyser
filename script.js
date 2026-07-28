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
let isBreakMode = false;
let isAiMode = false;
let currentStrategyPlayer = 1; 
let currentStrategyTool = 'place'; 

let breakMyRuns = [];
let breakOpponentRuns = [];
let breakLanes = [];
let currentBreakTool = 'myrun';
let isDrawingBreakRun = false;
let currentBreakRunPath = null;
let currentDrawingRunType = 'myrun';
let currentAiTool = 'none';

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
    can:    { height: 'high', color: 'rgba(160, 82, 45, 0.7)',  shape: 'circle',   w: 1.5, h: 1.5 },
    brick:  { height: 'medium', color: 'rgba(178, 34, 34, 0.7)',  shape: 'rect',     w: 2,   h: 1   },
    temple: { height: 'high',   color: 'rgba(120, 60, 30, 0.7)',  shape: 'rect',     w: 3,   h: 1.5   },
    goat:   { height: 'low',    color: 'rgba(245, 222, 179, 0.7)',shape: 'rect',     w: 1.5, h: 1.5 },
    totem:  { height: 'high',   color: 'rgba(105, 105, 105, 0.7)',shape: 'rect',   w: 1,   h: 1   },
    x:      { height: 'medium', color: 'rgba(139, 69, 19, 0.7)',  shape: 'polygon', w: 2, h: 2, vertices: [{x: -1, y: -1}, {x: -0.4, y: -1}, {x: 0, y: -0.3}, {x: 0.4, y: -1}, {x: 1, y: -1}, {x: 0.3, y: 0}, {x: 1, y: 1}, {x: 0.4, y: 1}, {x: 0, y: 0.3}, {x: -0.4, y: 1}, {x: -1, y: 1}, {x: -0.3, y: 0}] }
};

// ========================================
// CONTROLEURS
// ========================================
window.setAppMode = function(mode) {
    document.getElementById('btn-mode-calc').classList.remove('active');
    document.getElementById('btn-mode-strat').classList.remove('active');
    if (document.getElementById('btn-mode-break')) document.getElementById('btn-mode-break').classList.remove('active');
    if (document.getElementById('btn-mode-ai')) document.getElementById('btn-mode-ai').classList.remove('active');
    document.getElementById('btn-mode-' + mode).classList.add('active');
    isStrategyMode = (mode === 'strat');
    isBreakMode = (mode === 'break');
    isAiMode = (mode === 'ai');
};

window.setTool = function(tool) {
    currentStrategyTool = tool;
    document.getElementById('btn-tool-place').classList.remove('active');
    document.getElementById('btn-tool-select').classList.remove('active');
    document.getElementById('btn-tool-arrow').classList.remove('active');
    document.getElementById('btn-tool-' + tool).classList.add('active');
};

window.setBreakTool = function(tool) {
    currentBreakTool = tool;
    document.getElementById('btn-tool-break-myrun').classList.remove('active');
    document.getElementById('btn-tool-break-opprun').classList.remove('active');
    document.getElementById('btn-tool-break-' + tool).classList.add('active');
};

window.setAiTool = function(tool) {
    currentAiTool = tool;
    document.getElementById('btn-tool-ai-none').classList.remove('active');
    document.getElementById('btn-tool-ai-enemy').classList.remove('active');
    document.getElementById('btn-tool-ai-' + tool).classList.add('active');
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

window.selectStrategyPlayer = function(num) {
    if (!isStrategyMode) return;
    currentStrategyPlayer = num;
    document.getElementById('currentPlayerNum').textContent = currentStrategyPlayer;
    document.getElementById('btnNextPlayerNum').textContent = currentStrategyPlayer;
    setTool('place'); 
    calculateSightlines();
    updateUI(); 
    drawCanvas();
};

window.goToStep = function(step) {
    if ((step === 1 || step === 2) && currentStep >= 3) {
        shooters = []; previewLines = []; lockedLines = []; arrows = [];
        breakMyRuns = []; breakOpponentRuns = []; breakLanes = [];
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
        if (isBreakMode) {
            document.getElementById('step3-title').innerHTML = '🏃 3. Analyse Break';
            document.getElementById('step3-desc').textContent = 'Trace ta course et dessine les courses adverses.';
            document.getElementById('posture-selector').style.display = 'none';
            document.getElementById('strategy-tools-step3').style.display = 'none';
            document.getElementById('break-tools-step3').style.display = 'block';
            if(document.getElementById('ai-tools-step3')) document.getElementById('ai-tools-step3').style.display = 'none';
            document.getElementById('actions-calc').style.display = 'flex';
            document.getElementById('actions-strat').style.display = 'none';
            if(document.getElementById('actions-ai')) document.getElementById('actions-ai').style.display = 'none';
        } else if (isAiMode) {
            document.getElementById('step3-title').innerHTML = '🤖 3. IA Auto';
            document.getElementById('step3-desc').textContent = 'Génère une stratégie automatiquement.';
            document.getElementById('posture-selector').style.display = 'none';
            document.getElementById('strategy-tools-step3').style.display = 'none';
            document.getElementById('break-tools-step3').style.display = 'none';
            if(document.getElementById('ai-tools-step3')) document.getElementById('ai-tools-step3').style.display = 'block';
            document.getElementById('actions-calc').style.display = 'none';
            document.getElementById('actions-strat').style.display = 'none';
            if(document.getElementById('actions-ai')) document.getElementById('actions-ai').style.display = 'flex';
        } else if (isStrategyMode) {
            document.getElementById('step3-title').innerHTML = '👥 3. Planification Joueur par Joueur';
            document.getElementById('step3-desc').textContent = 'Construis le playbook. Pose le joueur, valide ses lignes, dessine sa relance.';
            document.getElementById('posture-selector').style.display = 'block';
            document.getElementById('strategy-tools-step3').style.display = 'block';
            document.getElementById('break-tools-step3').style.display = 'none';
            if(document.getElementById('ai-tools-step3')) document.getElementById('ai-tools-step3').style.display = 'none';
            document.getElementById('actions-calc').style.display = 'none';
            document.getElementById('actions-strat').style.display = 'flex';
            if(document.getElementById('actions-ai')) document.getElementById('actions-ai').style.display = 'none';
        } else {
            document.getElementById('step3-title').innerHTML = '👥 3. Déploiement Global';
            document.getElementById('step3-desc').textContent = 'Place tes 5 joueurs. L\'analyse est en direct.';
            document.getElementById('posture-selector').style.display = 'block';
            document.getElementById('strategy-tools-step3').style.display = 'none';
            document.getElementById('break-tools-step3').style.display = 'none';
            if(document.getElementById('ai-tools-step3')) document.getElementById('ai-tools-step3').style.display = 'none';
            document.getElementById('actions-calc').style.display = 'flex';
            document.getElementById('actions-strat').style.display = 'none';
            if(document.getElementById('actions-ai')) document.getElementById('actions-ai').style.display = 'none';
        }
    }

    if (step === 4) {
        document.getElementById('recap-calc').style.display = (!isStrategyMode && !isBreakMode && !isAiMode) ? 'block' : 'none';
        document.getElementById('recap-strat').style.display = isStrategyMode ? 'block' : 'none';
        document.getElementById('recap-break').style.display = isBreakMode ? 'block' : 'none';
        if(document.getElementById('recap-ai')) document.getElementById('recap-ai').style.display = isAiMode ? 'block' : 'none';
        if (isBreakMode) {
            document.getElementById('breakLineCount').textContent = breakLanes.length;
        }
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
    const targetShooter = shooters.find(s => s.id === id);
    if (!targetShooter) return;
    
    const newActiveState = !targetShooter.active;
    
    if (isStrategyMode) {
        shooters.forEach(s => {
            if (s.playerNum === targetShooter.playerNum) {
                s.active = newActiveState;
            }
        });
    } else {
        targetShooter.active = newActiveState;
    }
    
    calculateSightlines();
    updateUI();
    drawCanvas();
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
            breakMyRuns = []; breakOpponentRuns = []; breakLanes = [];
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
        breakMyRuns = []; breakOpponentRuns = []; breakLanes = [];
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
        const isSelected = isStrategyMode && s.playerNum === currentStrategyPlayer;
        const div = document.createElement('div'); 
        div.className = 'shooter-item';
        
        if (isSelected) {
            div.style.borderColor = '#38bdf8';
            div.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
        }
        
        if (isStrategyMode) {
            div.style.cursor = 'pointer';
            div.title = "Cliquer pour modifier ce joueur";
            div.onclick = (e) => {
                if (e.target.closest('button')) return;
                selectStrategyPlayer(s.playerNum);
            };
        }

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
        if (isBreakMode) {
            if (e.ctrlKey || e.metaKey) {
                let runIndex = -1; let minDist = 15; let isOppRun = false;
                for (let i = breakOpponentRuns.length - 1; i >= 0; i--) {
                    for (let p of breakOpponentRuns[i]) {
                        if (Math.hypot(p.x - pos.x, p.y - pos.y) < minDist) { minDist = Math.hypot(p.x - pos.x, p.y - pos.y); runIndex = i; isOppRun = true; }
                    }
                }
                for (let i = breakMyRuns.length - 1; i >= 0; i--) {
                    for (let p of breakMyRuns[i]) {
                        if (Math.hypot(p.x - pos.x, p.y - pos.y) < minDist) { minDist = Math.hypot(p.x - pos.x, p.y - pos.y); runIndex = i; isOppRun = false; }
                    }
                }

                if (runIndex !== -1) { 
                    if (isOppRun) breakOpponentRuns.splice(runIndex, 1);
                    else breakMyRuns.splice(runIndex, 1);
                    window.calculateBreakLanes(); updateUI(); drawCanvas(); return; 
                }
            } else {
                isDrawingBreakRun = true; 
                currentBreakRunPath = [{x: pos.x, y: pos.y}];
                currentDrawingRunType = currentBreakTool;
                return;
            }
        }
        else if (isAiMode) {
            if (currentAiTool === 'enemy') {
                if (e.ctrlKey || e.metaKey) {
                    const shooterIndex = shooters.findIndex(s => s.team === 'right' && Math.hypot(s.x - pos.x, s.y - pos.y) < 15);
                    if (shooterIndex !== -1) shooters.splice(shooterIndex, 1);
                } else {
                    let newPlayerNum = 1;
                    while (shooters.some(s => s.team === 'right' && s.playerNum === newPlayerNum)) {
                        newPlayerNum++;
                    }
                    shooters.push({ id: Date.now(), x: pos.x, y: pos.y, stance: shooterStance, team: 'right', color: '#ef4444', active: true, playerNum: newPlayerNum });
                }
                updateUI(); drawCanvas();
            }
        }
        else if (!isStrategyMode) {
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
            if (e.ctrlKey || e.metaKey) {
                let arrowIndex = -1; let minArrowDist = 10;
                for (let i = arrows.length - 1; i >= 0; i--) {
                    if (arrows[i].playerNum !== currentStrategyPlayer) continue;
                    const dist = pointToLineDistance(pos.x, pos.y, arrows[i].x1, arrows[i].y1, arrows[i].x2, arrows[i].y2);
                    if (dist < minArrowDist) { minArrowDist = dist; arrowIndex = i; }
                }
                if (arrowIndex !== -1) { arrows.splice(arrowIndex, 1); updateUI(); drawCanvas(); return; }

                let lineIndex = -1; let minLineDist = 8;
                for (let i = lockedLines.length - 1; i >= 0; i--) {
                    const s = shooters.find(sh => sh.id === lockedLines[i].shooterId);
                    if (s && s.playerNum !== currentStrategyPlayer) continue;
                    const dist = pointToLineDistance(pos.x, pos.y, lockedLines[i].x1, lockedLines[i].y1, lockedLines[i].x2, lockedLines[i].y2);
                    if (dist < minLineDist) { minLineDist = dist; lineIndex = i; }
                }
                if (lineIndex !== -1) { lockedLines.splice(lineIndex, 1); calculateSightlines(); updateUI(); drawCanvas(); return; }

                let shooterIndex = -1; let minShooterDist = 15;
                for (let i = shooters.length - 1; i >= 0; i--) {
                    if (shooters[i].playerNum !== currentStrategyPlayer) continue;
                    const dist = Math.hypot(shooters[i].x - pos.x, shooters[i].y - pos.y);
                    if (dist < minShooterDist) { minShooterDist = dist; shooterIndex = i; }
                }
                if (shooterIndex !== -1) shooters.splice(shooterIndex, 1);
                calculateSightlines();
            } else {
                if (currentStrategyTool === 'place') {
                    shooters.push({ id: Date.now(), x: pos.x, y: pos.y, stance: shooterStance, team: shooterTeam, color: SHOOTER_COLORS[(currentStrategyPlayer-1) % SHOOTER_COLORS.length], active: true, playerNum: currentStrategyPlayer });
                    calculateSightlines();
                } 
                else if (currentStrategyTool === 'select') {
                    let clickedLockedIndex = -1; let minLockedDistance = 8;
                    for (let i = lockedLines.length - 1; i >= 0; i--) {
                        const s = shooters.find(sh => sh.id === lockedLines[i].shooterId);
                        if (s && s.playerNum !== currentStrategyPlayer) continue;
                        
                        const dist = pointToLineDistance(pos.x, pos.y, lockedLines[i].x1, lockedLines[i].y1, lockedLines[i].x2, lockedLines[i].y2);
                        if (dist < minLockedDistance) { minLockedDistance = dist; clickedLockedIndex = i; }
                    }
                    if (clickedLockedIndex !== -1) {
                        lockedLines.splice(clickedLockedIndex, 1);
                        calculateSightlines();
                    } else {
                        let clickedPreviewIndex = -1; let minDistance = 8;
                        for (let i = previewLines.length - 1; i >= 0; i--) {
                            const dist = pointToLineDistance(pos.x, pos.y, previewLines[i].x1, previewLines[i].y1, previewLines[i].x2, previewLines[i].y2);
                            if (dist < minDistance) { minDistance = dist; clickedPreviewIndex = i; }
                        }
                        if (clickedPreviewIndex !== -1) { 
                            lockedLines.push(previewLines.splice(clickedPreviewIndex, 1)[0]); 
                        }
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
    if (isDrawingBreakRun && currentBreakRunPath && currentStep === 3) { 
        const lastP = currentBreakRunPath[currentBreakRunPath.length - 1];
        const newP = getMousePos(e);
        if (Math.hypot(newP.x - lastP.x, newP.y - lastP.y) > 5) {
            currentBreakRunPath.push(newP); 
            drawCanvas(); 
        }
    }
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
            arrows.push({ x1: arrowStartPos.x, y1: arrowStartPos.y, x2: arrowCurrentPos.x, y2: arrowCurrentPos.y, color: playerColor, playerNum: currentStrategyPlayer }); 
        }
        isDrawingArrow = false; arrowStartPos = null; arrowCurrentPos = null; drawCanvas();
    }
    if (isDrawingBreakRun && currentBreakRunPath && currentStep === 3) {
        if (currentBreakRunPath.length > 3) { 
            if (currentDrawingRunType === 'myrun') {
                breakMyRuns.push(currentBreakRunPath); 
            } else {
                breakOpponentRuns.push(currentBreakRunPath); 
            }
            window.calculateBreakLanes();
        }
        isDrawingBreakRun = false; currentBreakRunPath = null; drawCanvas();
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
        
        const baseY = fieldBounds.y + fieldBounds.h / 2 - 30;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.fillRect(fieldBounds.x - 10, baseY, 20, 60);
        ctx.strokeRect(fieldBounds.x - 10, baseY, 20, 60);
        
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText("BASE", fieldBounds.x, baseY - 5);
    }

    ctx.globalAlpha = 1.0; 
    lockedLines.forEach(line => {
        const s = shooters.find(sh => sh.id === line.shooterId);
        const isActive = s ? s.active : true;
        ctx.globalAlpha = isActive ? 1.0 : 0.3;
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

    arrows.forEach(a => {
        const isActive = isStrategyMode ? shooters.some(s => s.playerNum === a.playerNum && s.active) : true;
        ctx.globalAlpha = isActive ? 1.0 : 0.3;
        drawArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.color);
    });
    ctx.globalAlpha = 1.0;
    
    if (isDrawingArrow && arrowStartPos && arrowCurrentPos) {
        const liveColor = SHOOTER_COLORS[(currentStrategyPlayer-1) % SHOOTER_COLORS.length].replace('0.3', '1');
        drawArrow(ctx, arrowStartPos.x, arrowStartPos.y, arrowCurrentPos.x, arrowCurrentPos.y, liveColor);
    }

    if (isBreakMode) {
        ctx.globalAlpha = 1.0;
        
        function drawPath(ctx, path, color) {
            if (!path || path.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw arrowhead at the end
            const p1 = path[path.length - 2];
            const p2 = path[path.length - 1];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            ctx.beginPath();
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(p2.x - 10 * Math.cos(angle - Math.PI / 6), p2.y - 10 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(p2.x - 10 * Math.cos(angle + Math.PI / 6), p2.y - 10 * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        breakMyRuns.forEach(run => drawPath(ctx, run, '#3b82f6'));
        breakOpponentRuns.forEach(run => drawPath(ctx, run, '#ef4444'));
        
        if (isDrawingBreakRun && currentBreakRunPath) {
            const drawCol = currentDrawingRunType === 'myrun' ? '#3b82f6' : '#ef4444';
            drawPath(ctx, currentBreakRunPath, drawCol);
        }

        breakLanes.forEach(lane => {
            ctx.beginPath();
            lane.allPairs.forEach((pair, index) => {
                if (index % 3 === 0) { 
                    ctx.moveTo(pair.myPoint.x, pair.myPoint.y);
                    ctx.lineTo(pair.oppPoint.x, pair.oppPoint.y);
                }
            });
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)'; 
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(lane.myPoint.x, lane.myPoint.y);
            ctx.lineTo(lane.oppPoint.x, lane.oppPoint.y);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(lane.oppPoint.x, lane.oppPoint.y, 8, 0, Math.PI * 2);
            ctx.moveTo(lane.oppPoint.x - 12, lane.oppPoint.y); ctx.lineTo(lane.oppPoint.x + 12, lane.oppPoint.y);
            ctx.moveTo(lane.oppPoint.x, lane.oppPoint.y - 12); ctx.lineTo(lane.oppPoint.x, lane.oppPoint.y + 12);
            ctx.strokeStyle = '#ef4444'; 
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(lane.myPoint.x, lane.myPoint.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 12px Arial';
            ctx.fillText("TIR", lane.myPoint.x, lane.myPoint.y - 12);
            ctx.fillText("CIBLE", lane.oppPoint.x, lane.oppPoint.y - 12);
        });
    }
}

// ========================================
// MOTEUR BALISTIQUE & CALCULS MATHS
// ========================================

function getPathLength(path) {
    let len = 0;
    for (let i = 1; i < path.length; i++) {
        len += Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
    }
    return len;
}

function getPointOnPath(path, totalLen, t) {
    if (!path || path.length === 0) return {x:0, y:0};
    if (path.length === 1 || t <= 0) return path[0];
    if (t >= 1) return path[path.length - 1];
    
    let targetD = t * totalLen;
    let currD = 0;
    for (let i = 1; i < path.length; i++) {
        const d = Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
        if (currD + d >= targetD) {
            const localT = d === 0 ? 0 : (targetD - currD) / d;
            return {
                x: path[i-1].x + (path[i].x - path[i-1].x) * localT,
                y: path[i-1].y + (path[i].y - path[i-1].y) * localT
            };
        }
        currD += d;
    }
    return path[path.length - 1];
}

window.calculateBreakLanes = function() {
    breakLanes = []; 
    if (breakMyRuns.length === 0 || breakOpponentRuns.length === 0) return;

    breakMyRuns.forEach(myRun => {
        const myLen = getPathLength(myRun);
        const mySteps = Math.max(1, Math.floor(myLen / 5));

        breakOpponentRuns.forEach(oppRun => {
            const oppLen = getPathLength(oppRun);
            const oppSteps = Math.max(1, Math.floor(oppLen / 5));

            let validPairs = [];

            for (let i = 0; i <= mySteps; i++) {
                const mt = i / mySteps;
                const myPt = getPointOnPath(myRun, myLen, mt);
                const mx = myPt.x; const my = myPt.y;
                
                // On ne tire pas dans l'instant 0 de notre départ
                if (Math.hypot(mx - myRun[0].x, my - myRun[0].y) < 10) continue;

                for (let j = 0; j <= oppSteps; j++) {
                    const ot = j / oppSteps;
                    const oppPt = getPointOnPath(oppRun, oppLen, ot);
                    const ox = oppPt.x; const oy = oppPt.y;

                    // Périmètre de sécurité : trop tôt pour le toucher (ex: 30 pixels du départ)
                    if (Math.hypot(ox - oppRun[0].x, oy - oppRun[0].y) < 30) continue;

                    let hasCollision = false;
                    const rayDx = ox - mx;
                    const rayDy = oy - my;
                    const rayLen = Math.hypot(rayDx, rayDy);
                    const raySteps = Math.max(1, Math.ceil(rayLen / 4));
                    
                    for (let k = 1; k < raySteps; k++) {
                        const rt = k / raySteps;
                        const rx = mx + rayDx * rt;
                        const ry = my + rayDy * rt;
                        
                        for (let obs of obstacles) {
                            // En Break (course), les joueurs sont DEBOUT.
                            // Ils peuvent donc tirer par-dessus les obstacles BAS et MOYENS.
                            if (obs.height === 'low' || obs.height === 'medium') continue;

                            let collision = false;
                            const config = OBSTACLE_CONFIG[obs.type];
                            const w = obs.size * config.w; const h = obs.size * config.h;
                            
                            if (config.shape === 'circle') { 
                                collision = (Math.hypot(rx - obs.x, ry - obs.y) <= w/2); 
                            } else {
                                const odx = rx - obs.x; const ody = ry - obs.y; const angleRad = -obs.rotation * Math.PI / 180;
                                const localX = odx * Math.cos(angleRad) - ody * Math.sin(angleRad); const localY = odx * Math.sin(angleRad) + ody * Math.cos(angleRad);
                                if (config.shape === 'rect') { collision = (Math.abs(localX) <= w/2 && Math.abs(localY) <= h/2); } 
                                else if (config.shape === 'triangle') { if (localY >= -h/2 && localY <= h/2) collision = Math.abs(localX) <= ((w/2) * ((localY + h/2) / h)); } 
                                else if (config.shape === 'polygon') {
                                    const normX = localX / (w/2); const normY = localY / (h/2); let inside = false;
                                    for (let n = 0, l = config.vertices.length - 1; n < config.vertices.length; l = n++) {
                                        if (((config.vertices[n].y > normY) !== (config.vertices[l].y > normY)) && (normX < (config.vertices[l].x - config.vertices[n].x) * (normY - config.vertices[n].y) / (config.vertices[l].y - config.vertices[n].y) + config.vertices[n].x)) inside = !inside;
                                    }
                                    collision = inside;
                                }
                            }
                            if (collision) { hasCollision = true; break; }
                        }
                        if (hasCollision) break;
                    }
                    if (!hasCollision) {
                        validPairs.push({ myPoint: {x: mx, y: my}, oppPoint: {x: ox, y: oy} });
                    }
                }
            }

            if (validPairs.length > 0) {
                let clusters = [];
                for (let pair of validPairs) {
                    let foundCluster = null;
                    for (let c of clusters) {
                        // On vérifie le dernier élément ajouté au cluster pour des raisons de performance, 
                        // c'est généralement suffisant car les paires sont générées dans un ordre relativement séquentiel.
                        // Pour être parfaitement sûr de lier des zones continues, on peut vérifier tous les éléments,
                        // mais vu la taille de validPairs, vérifier juste quelques-uns suffit.
                        for (let cpair of c) {
                            const distMy = Math.hypot(pair.myPoint.x - cpair.myPoint.x, pair.myPoint.y - cpair.myPoint.y);
                            const distOpp = Math.hypot(pair.oppPoint.x - cpair.oppPoint.x, pair.oppPoint.y - cpair.oppPoint.y);
                            // Si la paire est proche d'un cluster existant (< 20px d'écart)
                            if (distMy < 20 && distOpp < 20) {
                                foundCluster = c; break;
                            }
                        }
                        if (foundCluster) break;
                    }
                    if (foundCluster) foundCluster.push(pair);
                    else clusters.push([pair]);
                }
                
                // Pour chaque fenêtre de tir (cluster) trouvée
                clusters.forEach(c => {
                    if (c.length > 2) { // On ignore les micro-trous d'1 pixel
                        const middle = c[Math.floor(c.length / 2)];
                        breakLanes.push({
                            myPoint: middle.myPoint,
                            oppPoint: middle.oppPoint,
                            firstPair: c[0],
                            lastPair: c[c.length - 1],
                            allPairs: c
                        });
                    }
                });
            }
        });
    });
    if (currentStep === 4) document.getElementById('breakLineCount').textContent = breakLanes.length;
};

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
        title: "Bienvenue sur Paintball Analyser !",
        text: "Cet outil complet te permet de simuler la balistique et de préparer tes tournois. L'application possède 3 modes distincts :<br><br>• <b>🧮 Live (Rapide)</b> : Simulation directe avec 5 joueurs qu'on déplace librement.<br>• <b>🗺️ Stratégie Pro</b> : Éditeur avancé étape par étape pour construire un playbook complet.<br>• <b>🏃 Assistant Break</b> : Analyse dynamique des tirs d'interception pendant les courses."
    },
    {
        title: "⚙️ 1. Le Terrain & Les Limites",
        text: "Deux options s'offrent à toi :<br><br>• <b>Continuer</b> : Clique sur <i>Charger le layout</i> (sauvegarde auto du dernier layout sauvegarder) ou <i>Importer un fichier</i> (.json) pour reprendre un terrain déjà construit.<br>• <b>Nouveau</b> : Charge une image. <b>TRÈS IMPORTANT</b> : Clique ensuite sur <i>Tracer les limites</i> et encadre l'aire de jeu pour définir l'échelle 3D."
    },
    {
        title: "🚧 2. Poser & Sauvegarder les Modules",
        text: "Clique sur un module (Snake, Dorito, X...) pour le poser.<br>• <b>Molette</b> : Ajuster la taille (détermine si on tire par-dessus).<br>• <b>Shift + Molette</b> : Faire pivoter.<br>• <b>Ctrl + Clic</b> : Supprimer.<br><br>💡 <b>Astuce</b> : Utilise <i>Sauvegarder / Exporter Layout</i> pour ne pas avoir à replacer les modules à chaque fois que tu ouvres l'appli !"
    },
    {
        title: "🧮 3a. Mode Live",
        text: "Place jusqu'à 5 joueurs et déplace-les à la souris. Le moteur 3D calcule instantanément qui voit qui ! Clique sur l'icône 👁️ dans la liste pour masquer temporairement un joueur de la carte.<br><br><b>La Posture (Debout, Genou, Couché) est essentielle</b> : Un joueur debout tirera par-dessus un obstacle 'Moyen' (comme le W ou le X), mais la vue d'un joueur allongé sera bloquée."
    },
    {
        title: "🗺️ 3b. Mode Stratégie Pro",
        text: "Ce mode est conçu pour planifier avec précision.<br>1. Clique pour <b>Placer</b> un joueur.<br>2. Dessine sa <b>Course de relance</b> (l'outil ↗️).<br>3. Clique sur <b>Valider Joueur</b> pour le figer.<br><br>Tu peux revenir en arrière pour <b>Modifier</b> un joueur via la liste, ou cliquer sur l'icône 👁️ pour masquer temporairement un joueur de la carte."
    },
    {
        title: "🏃 3c. Assistant Break",
        text: "Outil exclusif pour les 6 premières secondes de jeu.<br><br>Sélectionne l'outil <b>🔵 Notre Course</b>. Sur le terrain, clique et dessine <i>à main levée</i> ta vraie trajectoire. Fais de même pour la <b>🔴 Course Adverse</b>.<br>Le logiciel analysera le timing exact et placera un viseur 🎯 là où vos lignes de vue se croisent (en ignorant les modules bas et moyens)."
    },
    {
        title: "✅ 4. Export & Remise à Zéro",
        text: "Une fois ta tactique terminée, clique sur <b>Exporter le Plan</b> pour télécharger une image HD de ta stratégie à partager avec ton équipe.<br><br>Pour tout recommencer de zéro, utilise le bouton <b>🗑️ Reset Total</b> en haut à droite de l'écran."
    }
];

let currentTutStep = 0;

function updateTutorial() {
    document.getElementById('tut-title').innerHTML = tutorialSteps[currentTutStep].title;
    document.getElementById('tut-body').innerHTML = `<p>${tutorialSteps[currentTutStep].text}</p>`;
    
    const progressContainer = document.querySelector('.tut-progress');
    progressContainer.innerHTML = '';
    for(let i = 0; i < tutorialSteps.length; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i === currentTutStep ? ' active' : '');
        progressContainer.appendChild(dot);
    }
    
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

// ========================================
// MOTEUR IA (GÉNÉRATION AUTO)
// ========================================
window.generateAIStrategy = function(style) {
    if (!fieldBounds || obstacles.length === 0) {
        alert("Veuillez d'abord tracer les limites du terrain et poser des obstacles !");
        return;
    }
    
    shooters = shooters.filter(s => s.team === 'right');
    lockedLines = [];
    previewLines = [];
    arrows = [];
    breakMyRuns = [];
    breakOpponentRuns = [];
    breakLanes = [];
    
    const centerX = fieldBounds.x + fieldBounds.w / 2;
    const centerY = fieldBounds.y + fieldBounds.h / 2;
    
    const baseStartX = fieldBounds.x + 10;
    const baseStartY = fieldBounds.y + fieldBounds.h / 2;
    
    let potentialSpots = [];
    
    obstacles.forEach((obs, idx) => {
        const coverDistance = obs.size * 1.5 + 15;
        let spotX = obs.x - coverDistance;
        let spotY = obs.y; 
        
        if (spotX < fieldBounds.x + 5) spotX = fieldBounds.x + 5;
        if (spotX > fieldBounds.x + fieldBounds.w - 5) spotX = fieldBounds.x + fieldBounds.w - 5;
        if (spotY < fieldBounds.y + 5) spotY = fieldBounds.y + 5;
        if (spotY > fieldBounds.y + fieldBounds.h - 5) spotY = fieldBounds.y + fieldBounds.h - 5;
        
        potentialSpots.push({ id: 'spot_' + idx, x: spotX, y: spotY, obs: obs });
    });
    
    if (potentialSpots.length < 5) {
        potentialSpots.push({ id: 'fb_1', x: fieldBounds.x + fieldBounds.w * 0.1, y: fieldBounds.y + fieldBounds.h * 0.2, obs: null });
        potentialSpots.push({ id: 'fb_2', x: fieldBounds.x + fieldBounds.w * 0.1, y: fieldBounds.y + fieldBounds.h * 0.8, obs: null });
        potentialSpots.push({ id: 'fb_3', x: fieldBounds.x + fieldBounds.w * 0.2, y: fieldBounds.y + fieldBounds.h * 0.5, obs: null });
        potentialSpots.push({ id: 'fb_4', x: fieldBounds.x + fieldBounds.w * 0.3, y: fieldBounds.y + fieldBounds.h * 0.3, obs: null });
        potentialSpots.push({ id: 'fb_5', x: fieldBounds.x + fieldBounds.w * 0.3, y: fieldBounds.y + fieldBounds.h * 0.7, obs: null });
    }
    
    // ----------------------------------------------------
    // IA TACTIQUE : Tireurs adverses pour calculer le Danger
    // ----------------------------------------------------
    let actualEnemies = shooters.filter(s => s.team === 'right');
    if (actualEnemies.length === 0) {
        actualEnemies = [
            { x: fieldBounds.x + fieldBounds.w - 20, y: centerY, stance: 'standing' }, 
            { x: fieldBounds.x + fieldBounds.w - 50, y: fieldBounds.y + 40, stance: 'kneeling' }, 
            { x: fieldBounds.x + fieldBounds.w - 50, y: fieldBounds.y + fieldBounds.h - 40, stance: 'standing' } 
        ];
    }
    
    function findSafestPath(startNode, endNode) {
        let nodesList = [startNode, ...potentialSpots];
        let distances = {};
        let previous = {};
        let unvisited = new Set();
        
        nodesList.forEach(n => {
            distances[n.id] = Infinity;
            previous[n.id] = null;
            unvisited.add(n.id);
        });
        distances[startNode.id] = 0;
        
        while (unvisited.size > 0) {
            let current = null;
            for (let id of unvisited) {
                if (current === null || distances[id] < distances[current]) current = id;
            }
            
            if (distances[current] === Infinity) break;
            if (current === endNode.id) break;
            unvisited.delete(current);
            
            let uNode = nodesList.find(n => n.id === current);
            
            for (let vNode of nodesList) {
                if (!unvisited.has(vNode.id)) continue;
                if (vNode.x < uNode.x - 10) continue; // Force forward movement
                let dist = Math.hypot(vNode.x - uNode.x, vNode.y - uNode.y);
                if (dist > fieldBounds.w * 0.25) continue; // Sauts plus courts pour éviter les zigzags
                
                let exposureCost = 0;
                
                // Calcul d'exposition par Raycasting (3 points sur le segment)
                const pts = [
                    {x: uNode.x + (vNode.x - uNode.x)*0.3, y: uNode.y + (vNode.y - uNode.y)*0.3},
                    {x: uNode.x + (vNode.x - uNode.x)*0.5, y: uNode.y + (vNode.y - uNode.y)*0.5},
                    {x: uNode.x + (vNode.x - uNode.x)*0.7, y: uNode.y + (vNode.y - uNode.y)*0.7}
                ];
                
                for (let pt of pts) {
                    for (let shooter of actualEnemies) {
                        let tenduBlocked = false;
                        let blindBlocked = false;
                        const distToShooter = Math.hypot(pt.x - shooter.x, pt.y - shooter.y);
                        
                        for (let obs of obstacles) {
                            if (obs === uNode.obs || obs === vNode.obs) continue;
                            if (doesLineIntersectObstacle(shooter.x, shooter.y, pt.x, pt.y, obs)) {
                                if (shooter.stance === 'standing' && obs.height === 'high') tenduBlocked = true;
                                else if (shooter.stance === 'kneeling' && (obs.height === 'medium' || obs.height === 'high')) tenduBlocked = true;
                                else if (shooter.stance === 'prone') tenduBlocked = true;

                                if (distToShooter < 50 || obs.type === 'totem' || distToShooter > 250) blindBlocked = true;
                                else if (shooter.stance === 'prone') blindBlocked = true;
                            }
                        }
                        
                        let isExposed = false;
                        if (!tenduBlocked || (!blindBlocked && shooter.stance !== 'prone')) {
                            isExposed = true;
                        }

                        if (isExposed) exposureCost += 250; // LOURDE pénalité si tir dégagé
                    }
                }
                
                let alt = distances[current] + dist + exposureCost;
                if (alt < distances[vNode.id]) {
                    distances[vNode.id] = alt;
                    previous[vNode.id] = current;
                }
            }
        }
        
        let path = [];
        let curr = endNode.id;
        while (curr) {
            path.unshift(nodesList.find(n => n.id === curr));
            curr = previous[curr];
        }
        return path;
    }
    
    // ----------------------------------------------------
    // NOUVEAU: Sélection de l'équipe par RÔLES STRICTS
    // ----------------------------------------------------
    let selectedSpots = [];
    
    let sortedForHome = [...potentialSpots].sort((a, b) => {
        const distA = Math.hypot(a.x - baseStartX, a.y - baseStartY);
        const distB = Math.hypot(b.x - baseStartX, b.y - baseStartY);
        return distA - distB;
    });

    const getSpots = (condition) => potentialSpots.filter(s => condition(s) && !selectedSpots.includes(s));

    let enemiesLeft = actualEnemies.filter(e => e.y < centerY).length;
    let enemiesRight = actualEnemies.filter(e => e.y >= centerY).length;

    if (style === 'offensive') {
        const attackLine = centerX + 50;
        
        let home = sortedForHome[0];
        if (home) { home.isHome = true; selectedSpots.push(home); }
        
        let weakY = (enemiesLeft <= enemiesRight) ? (centerY - fieldBounds.h * 0.25) : (centerY + fieldBounds.h * 0.25);
        
        let attackers = getSpots(s => s.x > centerX - 20 && s.x <= attackLine);
        attackers.sort((a, b) => Math.hypot(a.x - attackLine, a.y - weakY) - Math.hypot(b.x - attackLine, b.y - weakY));
        if (attackers.length > 0) selectedSpots.push(attackers[0]);
        if (attackers.length > 1) selectedSpots.push(attackers[1]);
        
        let centerSpots = getSpots(s => Math.abs(s.y - centerY) <= fieldBounds.h * 0.20 && s.x <= attackLine);
        centerSpots.sort((a, b) => b.x - a.x);
        if (centerSpots.length > 0) selectedSpots.push(centerSpots[0]);
        
        let insertSpots = getSpots(s => s.x > baseStartX + 40 && s.x < centerX - 40);
        insertSpots.sort((a, b) => b.x - a.x);
        if (insertSpots.length > 0) selectedSpots.push(insertSpots[0]);
        
    } else {
        for (let i = 0; i < 2; i++) {
            let home = sortedForHome.find(s => !selectedSpots.includes(s) && (!selectedSpots[0] || Math.abs(s.y - selectedSpots[0].y) > 40));
            if (home) { home.isHome = true; selectedSpots.push(home); }
        }
        
        let strongY = (enemiesLeft > enemiesRight) ? (centerY - fieldBounds.h * 0.25) : (centerY + fieldBounds.h * 0.25);
        let safeX = centerX - 50;
        
        let defenders = getSpots(s => s.x > baseStartX + 20 && s.x < safeX);
        defenders.sort((a, b) => Math.hypot(a.x - safeX, a.y - strongY) - Math.hypot(b.x - safeX, b.y - strongY));
        
        if (defenders.length > 0) selectedSpots.push(defenders[0]);
        if (defenders.length > 1) selectedSpots.push(defenders[1]);
        
        let backCenter = getSpots(s => Math.abs(s.y - centerY) <= fieldBounds.h * 0.25 && s.x < safeX);
        backCenter.sort((a, b) => b.x - a.x);
        if (backCenter.length > 0) selectedSpots.push(backCenter[0]);
    }
    
    // Secours si le terrain manque de modules
    for (let spot of potentialSpots) {
        if (selectedSpots.length >= 5) break;
        if (!selectedSpots.includes(spot)) {
            let tooClose = false;
            for (let sel of selectedSpots) {
                if (Math.hypot(spot.x - sel.x, spot.y - sel.y) < 40) { tooClose = true; break; }
            }
            if (!tooClose) selectedSpots.push(spot);
        }
    }
    
    function pointToLineDist(px, py, x1, y1, x2, y2) {
        const A = px - x1; const B = py - y1; const C = x2 - x1; const D = y2 - y1;
        const dot = A * C + B * D; const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq; // CORRECTION: pas de signe négatif
        let closestX, closestY;
        if (param < 0) { closestX = x1; closestY = y1; } 
        else if (param > 1) { closestX = x2; closestY = y2; } 
        else { closestX = x1 + param * C; closestY = y1 + param * D; }
        return Math.hypot(px - closestX, py - closestY);
    }
    
    function doesLineIntersectObstacle(x1, y1, x2, y2, obs) {
        const config = OBSTACLE_CONFIG[obs.type];
        const radius = obs.size * (config ? Math.max(config.w, config.h) : 1) / 1.5;
        return pointToLineDist(obs.x, obs.y, x1, y1, x2, y2) < radius;
    }
    
    for (let i = 0; i < 5; i++) {
        if (i < selectedSpots.length) {
            const spot = selectedSpots[i];
            const playerNum = i + 1;
            const color = SHOOTER_COLORS[i % SHOOTER_COLORS.length];
            
            let stance = 'standing';
            if (spot.obs) {
                if (spot.obs.height === 'medium') stance = 'kneeling';
                if (spot.obs.height === 'low' || spot.obs.type === 'snake') stance = 'prone';
            }
            
            shooters.push({ id: Date.now() + i, x: spot.x, y: spot.y, stance: stance, team: 'left', color: color, active: true, playerNum: playerNum });
            
            let currentX = baseStartX;
            let currentY = baseStartY + (i - 2) * 15;
            const distToBase = spot.x - baseStartX;
            
            let useRelay = false;
            let bestRelay = null;
            
            // Pathfinding récursif par Waypoints pour esquiver les modules (micro-gestion)
            function routeSafeArrow(startX, startY, endX, endY, pNum, col, targetObs = null, startObs = null, depth = 0) {
                if (depth > 2) { 
                    arrows.push({ x1: startX, y1: startY, x2: endX, y2: endY, color: col, playerNum: pNum });
                    return;
                }
                
                let hitObs = null;
                let minDist = 99999;
                for (let o of obstacles) {
                    if (o === startObs || o === targetObs) continue;
                    
                    if (doesLineIntersectObstacle(startX, startY, endX, endY, o)) {
                        const d = Math.hypot(o.x - startX, o.y - startY);
                        if (d < minDist) { minDist = d; hitObs = o; }
                    }
                }
                
                if (hitObs) {
                    const config = OBSTACLE_CONFIG[hitObs.type];
                    const avoidDist = hitObs.size * (config ? Math.max(config.w, config.h) : 1) / 1.5 + 15;
                    
                    let wp1Y = hitObs.y - avoidDist;
                    let wp2Y = hitObs.y + avoidDist;
                    
                    wp1Y = Math.max(fieldBounds.y + 5, Math.min(fieldBounds.y + fieldBounds.h - 5, wp1Y));
                    wp2Y = Math.max(fieldBounds.y + 5, Math.min(fieldBounds.y + fieldBounds.h - 5, wp2Y));
                    
                    const wp1 = { x: hitObs.x, y: wp1Y };
                    const wp2 = { x: hitObs.x, y: wp2Y };
                    
                    const d1 = pointToLineDist(wp1.x, wp1.y, startX, startY, endX, endY);
                    const d2 = pointToLineDist(wp2.x, wp2.y, startX, startY, endX, endY);
                    
                    const bestWp = (d1 < d2) ? wp1 : wp2;
                    
                    arrows.push({ x1: startX, y1: startY, x2: bestWp.x, y2: bestWp.y, color: col, playerNum: pNum });
                    routeSafeArrow(bestWp.x, bestWp.y, endX, endY, pNum, col, targetObs, hitObs, depth + 1);
                } else {
                    arrows.push({ x1: startX, y1: startY, x2: endX, y2: endY, color: col, playerNum: pNum });
                }
            }
            
            const arrColor = color.replace('0.3', '1');
            
            if (spot.isHome) {
                routeSafeArrow(currentX, currentY, spot.x, spot.y, playerNum, arrColor, spot.obs, null);
                continue;
            }
            
            let baseNode = { id: 'base_' + playerNum, x: currentX, y: currentY, obs: null };
            let path = findSafestPath(baseNode, spot);
            
            // Si le graphe est bloqué, secours direct
            if (path.length < 2) {
                routeSafeArrow(currentX, currentY, spot.x, spot.y, playerNum, arrColor, spot.obs, null);
                continue;
            }
            
            for (let j = 0; j < path.length - 1; j++) {
                let n1 = path[j];
                let n2 = path[j+1];
                
                let startX = n1.x; let startY = n1.y;
                if (n1.obs && n1.x < n2.x) { // Si on repart d'un obstacle
                    const config = OBSTACLE_CONFIG[n1.obs.type];
                    const avoidDist = n1.obs.size * (config ? Math.max(config.w, config.h) : 1) / 1.5 + 15;
                    const dirY = n2.y > n1.y ? 1 : -1;
                    startX = n1.obs.x;
                    startY = n1.obs.y + avoidDist * dirY;
                    arrows.push({ x1: n1.x, y1: n1.y, x2: startX, y2: startY, color: arrColor, playerNum: playerNum });
                }
                
                routeSafeArrow(startX, startY, n2.x, n2.y, playerNum, arrColor, n2.obs, n1.obs);
            }
        }
    }
    
    // ----------------------------------------------------
    // Visée intelligente (Smart Aiming Physique)
    // ----------------------------------------------------
    
    const originalStrategyMode = isStrategyMode;
    isStrategyMode = false;
    calculateSightlines();
    const allPhysicsLines = [...previewLines];
    previewLines = [];
    isStrategyMode = originalStrategyMode;

    let myShooters = shooters.filter(s => s.team === 'left');
    
    myShooters.forEach((s) => {
        let bestLine = null;
        let minAngleDiff = 999;
        
        const myLines = allPhysicsLines.filter(l => l.shooterId === s.id && !l.isBlind);
        
        actualEnemies.forEach(enemy => {
            const targetAngle = Math.atan2(enemy.y - s.y, enemy.x - s.x);
            if (myLines.length > 0) {
                myLines.forEach(l => {
                    const lineAngle = Math.atan2(l.y2 - l.y1, l.x2 - l.x1);
                    let diff = Math.abs(targetAngle - lineAngle);
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    diff = Math.abs(diff);
                    
                    if (diff < minAngleDiff && diff < 0.3) { 
                        minAngleDiff = diff;
                        bestLine = l;
                    }
                });
            }
        });
        
        if (bestLine) {
            lockedLines.push(bestLine);
        } else {
            let fallbackLine = null;
            let maxLen = 0;
            myLines.forEach(l => {
                const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
                const angle = Math.atan2(l.y2 - l.y1, l.x2 - l.x1);
                if (l.x2 > s.x && len > maxLen && Math.abs(angle) < Math.PI/1.5) {
                    maxLen = len;
                    fallbackLine = l;
                }
            });
            
            if (fallbackLine) {
                lockedLines.push(fallbackLine);
            } else {
                lockedLines.push({
                    x1: s.x, y1: s.y, x2: s.x + 50, y2: s.y,
                    shooterId: s.id, color: s.color, isBlind: true 
                });
            }
        }
    });
    
    updateUI();
    drawCanvas();
    goToStep(4);
};