// ========================================
// VARIABLES GLOBALES ET CONFIGURATION
// ========================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Variables d'état de l'application
let loadedImage = null;
let obstacles = [];
let shooters = [];
let sightlines = [];

// NOUVEAU : Variables pour les limites du terrain
let fieldBounds = null; // Stockera {x, y, w, h}
let isDrawingField = false;
let fieldStartPos = null;

// Variables de sélection pour l'ajout
let selectedObstacleType = 'snake';
let selectedObstacleHeight = 'low';
let obstacleSize = 25;

let shooterStance = 'standing';
let shooterTeam = 'left';

// ========================================
// CONFIGURATION DES COULEURS ET OBSTACLES
// ========================================

const SHOOTER_COLORS = [
    'rgba(255, 0, 0, 0.3)', 'rgba(0, 0, 255, 0.3)', 'rgba(255, 165, 0, 0.3)',
    'rgba(148, 0, 211, 0.3)', 'rgba(0, 255, 255, 0.3)', 'rgba(255, 20, 147, 0.3)',
    'rgba(0, 255, 0, 0.3)', 'rgba(255, 255, 0, 0.3)'
];

const OBSTACLE_CONFIG = {
    snake: { height: 'low', color: 'rgba(101, 67, 33, 0.7)' },
    dorito: { height: 'medium', color: 'rgba(139, 69, 19, 0.7)' },
    can: { height: 'medium', color: 'rgba(160, 82, 45, 0.7)' },
    brick: { height: 'medium', color: 'rgba(178, 34, 34, 0.7)' },
    temple: { height: 'high', color: 'rgba(120, 60, 30, 0.7)' },
    m: { height: 'medium', color: 'rgba(70, 70, 70, 0.7)' },
    x: { height: 'medium', color: 'rgba(139, 69, 19, 0.7)' },
    cake: { height: 'low', color: 'rgba(139, 90, 43, 0.7)' },
    goat: { height: 'low', color: 'rgba(245, 222, 179, 0.7)' },
    totem: { height: 'high', color: 'rgba(105, 105, 105, 0.7)' }
};

// ========================================
// GESTIONNAIRES D'ÉVÉNEMENTS
// ========================================

// Boutons d'interface
document.querySelectorAll('.obstacle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.obstacle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedObstacleType = btn.dataset.type;
        selectedObstacleHeight = btn.dataset.height;
    });
});

document.querySelectorAll('.stance-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const parent = btn.parentElement;
        parent.querySelectorAll('.stance-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (btn.dataset.stance) shooterStance = btn.dataset.stance;
        if (btn.dataset.team) shooterTeam = btn.dataset.team;
    });
});

document.getElementById('sizeSlider').addEventListener('input', (e) => {
    obstacleSize = parseInt(e.target.value);
    document.getElementById('sizeValue').textContent = obstacleSize;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    obstacleSize = Math.max(15, Math.min(50, obstacleSize + (e.deltaY > 0 ? -2 : 2)));
    document.getElementById('sizeSlider').value = obstacleSize;
    document.getElementById('sizeValue').textContent = obstacleSize;
});

// Chargement de l'image
document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                loadedImage = img;
                fieldBounds = null; // Reset les limites quand on change d'image
                document.getElementById('detectionStatus').textContent = 'Image chargée.';
                drawCanvas();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// NOUVEAU : Bouton pour tracer le terrain
document.getElementById('drawFieldBtn').addEventListener('click', () => {
    isDrawingField = true;
    fieldStartPos = null;
    document.getElementById('detectionStatus').textContent = 'Tracez un rectangle sur l\'image (cliquer-glisser)';
    document.getElementById('drawFieldBtn').style.opacity = '0.5'; // Effet visuel
});

// ========================================
// INTERFACE UI
// ========================================

function updateUI() {
    document.getElementById('obstacleCount').textContent = obstacles.length;
    document.getElementById('shooterCount').textContent = shooters.length;
    document.getElementById('shooterCountStats').textContent = shooters.length;
    document.getElementById('lineCount').textContent = sightlines.length;

    const hasShooters = shooters.length > 0;
    document.getElementById('calculateBtn').disabled = !hasShooters;
    document.getElementById('teamCoverageBtn').disabled = !hasShooters;

    const list = document.getElementById('shooterList');
    list.innerHTML = '';
    shooters.forEach((s, index) => {
        const div = document.createElement('div');
        div.className = 'shooter-item';
        let icon = s.stance === 'standing' ? '🧍' : s.stance === 'kneeling' ? '🧎' : '🤸';
        div.innerHTML = `
            <span>J${index + 1} ${icon} (${s.team === 'left' ? 'G' : 'D'})</span>
            <button class="shooter-delete" onclick="removeShooter(${s.id})">X</button>
        `;
        list.appendChild(div);
    });
}

function removeShooter(id) {
    shooters = shooters.filter(s => s.id !== id);
    sightlines = sightlines.filter(l => l.shooterId !== id);
    updateUI();
    drawCanvas();
}

// ========================================
// INTERACTION AVEC LE CANVAS (SOURIS)
// ========================================

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousedown', (e) => {
    if (!loadedImage) return;
    const pos = getMousePos(e);

    // MODE : Tracer le terrain
    if (isDrawingField) {
        fieldStartPos = pos;
        return;
    }

    // MODE : Ajout/Suppression classique
    if (e.ctrlKey || e.metaKey) {
        let removed = false;
        const shooterIndex = shooters.findIndex(s => Math.hypot(s.x - pos.x, s.y - pos.y) < 15);
        if (shooterIndex !== -1) { shooters.splice(shooterIndex, 1); removed = true; }
        else {
            const obsIndex = obstacles.findIndex(o => Math.hypot(o.x - pos.x, o.y - pos.y) < o.size + 10);
            if (obsIndex !== -1) { obstacles.splice(obsIndex, 1); removed = true; }
        }
        if (removed) sightlines = [];
    } else if (e.shiftKey) {
        shooters.push({
            id: Date.now(), x: pos.x, y: pos.y, stance: shooterStance, team: shooterTeam,
            color: SHOOTER_COLORS[shooters.length % SHOOTER_COLORS.length]
        });
        sightlines = [];
    } else {
        obstacles.push({
            x: pos.x, y: pos.y, type: selectedObstacleType, height: selectedObstacleHeight,
            size: obstacleSize, rotation: 0
        });
        sightlines = [];
    }

    updateUI();
    drawCanvas();
});

// NOUVEAU : Mouvement de souris (pour visualiser le rectangle en train d'être dessiné)
canvas.addEventListener('mousemove', (e) => {
    if (isDrawingField && fieldStartPos) {
        const pos = getMousePos(e);
        drawCanvas(); // Redessine tout

        // Dessine le rectangle temporaire en pointillé
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(fieldStartPos.x, fieldStartPos.y, pos.x - fieldStartPos.x, pos.y - fieldStartPos.y);
        ctx.setLineDash([]);
    }
});

// NOUVEAU : Relâchement du clic (valide les limites du terrain)
canvas.addEventListener('mouseup', (e) => {
    if (isDrawingField && fieldStartPos) {
        const pos = getMousePos(e);

        // Calcule le rectangle final
        const w = Math.abs(pos.x - fieldStartPos.x);
        const h = Math.abs(pos.y - fieldStartPos.y);

        // Sécurité : éviter un terrain de 2 pixels si l'utilisateur a juste cliqué sans glisser
        if (w > 20 && h > 20) {
            fieldBounds = {
                x: Math.min(fieldStartPos.x, pos.x),
                y: Math.min(fieldStartPos.y, pos.y),
                w: w,
                h: h
            };
            document.getElementById('detectionStatus').textContent = 'Limites définies !';
        } else {
            document.getElementById('detectionStatus').textContent = 'Tracé annulé (trop petit).';
        }

        isDrawingField = false;
        fieldStartPos = null;
        document.getElementById('drawFieldBtn').style.opacity = '1';
        sightlines = []; // Forcer le recalcul si on modifie les bords

        updateUI();
        drawCanvas();
    }
});

// ========================================
// MOTEUR DE RENDU (DESSIN)
// ========================================

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (loadedImage) {
        ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
    }

    // NOUVEAU : Dessine les bordures du terrain
    if (fieldBounds) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)'; // Jaune semi-transparent
        ctx.lineWidth = 3;
        ctx.strokeRect(fieldBounds.x, fieldBounds.y, fieldBounds.w, fieldBounds.h);
    }

    // Lignes de tir
    sightlines.forEach(line => {
        ctx.beginPath(); ctx.moveTo(line.x1, line.y1); ctx.lineTo(line.x2, line.y2);
        ctx.strokeStyle = line.color; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Obstacles
    obstacles.forEach(obs => {
        const config = OBSTACLE_CONFIG[obs.type];
        ctx.save(); ctx.translate(obs.x, obs.y); ctx.rotate(obs.rotation * Math.PI / 180);
        ctx.fillStyle = config ? config.color : 'rgba(100,100,100,0.5)';
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, obs.size, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke(); ctx.restore();
    });

    // Tireurs
    shooters.forEach((s, index) => {
        ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = s.color.replace('0.3', '1'); ctx.fill();
        ctx.strokeStyle = s.team === 'left' ? '#000' : '#FFF'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = s.team === 'left' ? '#FFF' : '#000';
        ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(index + 1, s.x, s.y);
    });
}

// ========================================
// ALGORITHME DE RAYCASTING (LIGNES DE TIR)
// ========================================

document.getElementById('calculateBtn').addEventListener('click', () => { calculateSightlines(); });

document.getElementById('resetBtn').addEventListener('click', () => {
    if(confirm("Tout effacer (obstacles, joueurs, et terrain) ?")) {
        obstacles = []; shooters = []; sightlines = []; fieldBounds = null;
        updateUI(); drawCanvas();
    }
});

function calculateSightlines() {
    sightlines = [];

    // NOUVEAU : Définition des limites du calcul (le terrain OU le canvas entier)
    const minX = fieldBounds ? fieldBounds.x : 0;
    const maxX = fieldBounds ? fieldBounds.x + fieldBounds.w : canvas.width;
    const minY = fieldBounds ? fieldBounds.y : 0;
    const maxY = fieldBounds ? fieldBounds.y + fieldBounds.h : canvas.height;

    shooters.forEach(shooter => {
        for (let angle = 0; angle < 360; angle += 1) {
            const rad = angle * Math.PI / 180;
            let currentX = shooter.x;
            let currentY = shooter.y;
            const step = 4;
            let hit = false;

            // On vérifie que la ligne de tir est bien à l'intérieur des bordures fixées !
            while (!hit && currentX >= minX && currentX <= maxX && currentY >= minY && currentY <= maxY) {
                currentX += Math.cos(rad) * step;
                currentY += Math.sin(rad) * step;

                for (let obs of obstacles) {
                    const distance = Math.sqrt((currentX - obs.x)**2 + (currentY - obs.y)**2);
                    if (distance <= obs.size) {
                        let blocks = false;
                        if (shooter.stance === 'standing') blocks = (obs.height === 'high');
                        else if (shooter.stance === 'kneeling') blocks = (obs.height === 'medium' || obs.height === 'high');
                        else if (shooter.stance === 'prone') blocks = true;

                        if (blocks) { hit = true; break; }
                    }
                }
            }

            sightlines.push({ x1: shooter.x, y1: shooter.y, x2: currentX, y2: currentY, shooterId: shooter.id, color: shooter.color });
        }
    });

    updateUI(); drawCanvas();
}