// ========================================
// VARIABLES GLOBALES ET CONFIGURATION
// ========================================

// Référence au canvas HTML et son contexte 2D
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Variables d'état de l'application
let loadedImage = null;           // Image du terrain chargée
let obstacles = [];                // Liste des obstacles détectés/placés [{x, y, type, height, size, rotation}]
let shooters = [];                 // Liste des tireurs (joueurs) [{x, y, id, stance, team, active}]
let sightlines = [];               // Lignes de tir calculées [{x1, y1, x2, y2, shooterId}]
let playZone = null;               // Polygone définissant la zone de jeu [{x, y}, {x, y}, ...]

// Variables de sélection pour l'ajout manuel d'obstacles
let selectedObstacleType = 'snake';      // Type d'obstacle sélectionné
let selectedObstacleHeight = 'low';      // Hauteur de l'obstacle sélectionné
let obstacleSize = 25;                   // Taille de l'obstacle en pixels

// Variables de sélection pour l'ajout de tireurs
let shooterStance = 'standing';    // Position du tireur (standing/kneeling/prone)
let shooterTeam = 'left';          // Équipe du tireur (left/right)

// Mode d'affichage
let showTeamCoverage = false;      // false = lignes individuelles, true = couverture d'équipe

// ========================================
// CONFIGURATION DES COULEURS PAR JOUEUR
// ========================================
// Chaque joueur a une couleur unique pour ses lignes de tir
const SHOOTER_COLORS = [
    'rgba(255, 0, 0, 0.2)',      // Rouge - Joueur 1
    'rgba(0, 0, 255, 0.2)',      // Bleu - Joueur 2
    'rgba(255, 165, 0, 0.2)',    // Orange - Joueur 3
    'rgba(148, 0, 211, 0.2)',    // Violet - Joueur 4
    'rgba(0, 255, 255, 0.2)',    // Cyan - Joueur 5
    'rgba(255, 20, 147, 0.2)',   // Rose - Joueur 6
    'rgba(0, 255, 0, 0.2)',      // Vert - Joueur 7
    'rgba(255, 255, 0, 0.2)'     // Jaune - Joueur 8
];

// ========================================
// CONFIGURATION DES TYPES D'OBSTACLES
// ========================================
// Définit les propriétés de chaque type d'obstacle
const OBSTACLE_CONFIG = {
    snake: { height: 'low', color: 'rgba(101, 67, 33, 0.7)' },      // Snake: obstacle bas, allongé
    dorito: { height: 'medium', color: 'rgba(139, 69, 19, 0.7)' },  // Dorito: obstacle moyen, triangulaire
    can: { height: 'medium', color: 'rgba(160, 82, 45, 0.7)' },     // Can: obstacle moyen, cylindrique
    brick: { height: 'medium', color: 'rgba(178, 34, 34, 0.7)' },   // Brique: obstacle moyen, rectangulaire
    temple: { height: 'high', color: 'rgba(120, 60, 30, 0.7)' },    // Temple: obstacle haut, large
    m: { height: 'medium', color: 'rgba(70, 70, 70, 0.7)' },        // M/Télé: obstacle moyen
    x: { height: 'medium', color: 'rgba(139, 69, 19, 0.7)' },       // X-Bunker: obstacle moyen en X
    cake: { height: 'low', color: 'rgba(139, 90, 43, 0.7)' },       // Cake: obstacle bas, demi-cercle
    goat: { height: 'low', color: 'rgba(245, 222, 179, 0.7)' },     // Chavrou: obstacle bas
    totem: { height: 'high', color: 'rgba(105, 105, 105, 0.7)' }    // Totem: obstacle très haut, vertical
};

// ========================================
// GESTIONNAIRES D'ÉVÉNEMENTS - SÉLECTION
// ========================================

/**
 * Gestion de la sélection d'obstacles
 * Permet à l'utilisateur de choisir le type d'obstacle à placer
 */
document.querySelectorAll('.obstacle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.obstacle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedObstacleType = btn.dataset.type;
        selectedObstacleHeight = btn.dataset.height;
    });
});

/**
 * Gestion des boutons de position du tireur et d'équipe
 * Met à jour les variables globales selon le bouton cliqué
 */
document.querySelectorAll('.stance-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const parent = btn.parentElement;
        parent.querySelectorAll('.stance-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (btn.dataset.stance) {
            shooterStance = btn.dataset.stance;
        }
        if (btn.dataset.team) {
            shooterTeam = btn.dataset.team;
        }
    });
});

/**
 * Gestion du slider de taille d'obstacle
 */
document.getElementById('sizeSlider').addEventListener('input', (e) => {
    obstacleSize = parseInt(e.target.value);
    document.getElementById('sizeValue').textContent = obstacleSize;
});

/**
 * Ajustement de la taille avec la molette de la souris
 */
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    obstacleSize = Math.max(15, Math.min(50, obstacleSize + (e.deltaY > 0 ? -2 : 2)));
    document.getElementById('sizeSlider').value = obstacleSize;
    document.getElementById('sizeValue').textContent = obstacleSize;
});

// ========================================
// CHARGEMENT D'IMAGE
// ========================================

/**
 * Gère le chargement de l'image du terrain
 * Active le bouton de détection automatique une fois l'image chargée
 */
document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                loadedImage = img;
                document.getElementById('autoDetectBtn').disabled = false;
                document.getElementById('detectionStatus').textContent = 'Image chargée. Cliquez sur Détection automatique.';
                drawCanvas();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// ========================================
// DÉTECTION AUTOMATIQUE
// ========================================

/**
 * Lance l'analyse automatique de l'image
 * Détecte la zone de jeu et les obstacles
 */
document.getElementById('autoDetectBtn').addEventListener('click', async () => {
    document.getElementById('detectionStatus').textContent = '🔍 Analyse en cours...';
    document.getElementById('autoDetectBtn').disabled = true;

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        detectPlayZone();
        detectObstacles();
        document.getElementById('detectionStatus').textContent = `✅ Détection terminée : ${obstacles.length} obstacles trouvés`;
        updateUI();
    } catch (error) {
        document.getElementById('detectionStatus').textContent = '❌ Erreur lors de la détection';
        console.error(error);
    }

    document.getElementById('autoDetectBtn').disabled = false;
});

/**
 * Détecte la zone de jeu à partir de l'image
 * Crée un polygone rectangulaire avec marge
 */
function detectPlayZone() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

    const margin = 20;
    playZone = [
        { x: margin, y: margin },
        { x: canvas.width - margin, y: margin },
        { x: canvas.width - margin, y: canvas.height - margin },
        { x: margin, y: canvas.height - margin }
    ];
}

/**
 * Détecte les obstacles dans l'image
 * Utilise flood fill pour identifier les régions sombres
 * Détermine le type selon la forme
 */
function detectObstacles() {
    obstacles = [];

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const visited = new Array(canvas.width * canvas.height).fill(false);
    const minSize = 400;

    for (let y = 0; y < canvas.height; y += 5) {
        for (let x = 0; x < canvas.width; x += 5) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;

            if (brightness < 120 && !visited[y * canvas.width + x]) {
                const region = floodFill(data, canvas.width, canvas.height, x, y, visited, 120);

                if (region.length > minSize) {
                    const centerX = region.reduce((sum, p) => sum + p.x, 0) / region.length;
                    const centerY = region.reduce((sum, p) => sum + p.y, 0) / region.length;

                    const minX = Math.min(...region.map(p => p.x));
                    const maxX = Math.max(...region.map(p => p.x));
                    const minY = Math.min(...region.map(p => p.y));
                    const maxY = Math.max(...region.map(p => p.y));

                    const width = maxX - minX;
                    const height = maxY - minY;
                    const area = region.length;
                    const ratio = width / height;

                    let type, obstacleHeight, size, rotation = 0;

                    if (ratio > 2.5) {
                        type = 'snake';
                        obstacleHeight = 'low';
                        size = Math.min(width, height) / 2;
                        rotation = 0;
                    } else if (ratio < 0.4) {
                        type = 'snake';
                        obstacleHeight = 'low';
                        size = Math.min(width, height) / 2;
                        rotation = 90;
                    } else if (ratio > 0.8 && ratio < 1.2) {
                        if (area < 1500) {
                            type = 'can';
                            obstacleHeight = 'medium';
                            size = Math.sqrt(area) / 3;
                        } else {
                            type = 'temple';
                            obstacleHeight = 'high';
                            size = Math.sqrt(area) / 4;
                        }
                    } else if (ratio > 1.2 && ratio < 2) {
                        if (height > width) {
                            type = 'brick';
                            obstacleHeight = 'medium';
                            size = width / 2;
                            rotation = 0;
                        } else {
                            type = 'dorito';
                            obstacleHeight = 'medium';
                            size = Math.max(width, height) / 3;
                        }
                    } else {
                        type = 'can';
                        obstacleHeight = 'medium';
                        size = Math.sqrt(area) / 3;
                    }

                    obstacles.push({
                        x: centerX,
                        y: centerY,
                        type: type,
                        height: obstacleHeight,
                        size: Math.max(15, Math.min(50, size)),
                        rotation: rotation
                    });
                }
            }
        }
    }
}

/**
 * Algorithme flood fill pour détecter les régions connectées
 * Retourne un tableau de points {x, y} appartenant à la région
 */
function floodFill(data, width, height, startX, startY, visited, threshold) {
    const stack = [{ x: startX, y: startY }];
    const region = [];

    while (stack.length > 0 && region.length < 10000) {
        const { x, y } = stack.pop();

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const idx = y * width + x;
        if (visited[idx]) continue;

        const pixelIdx = idx * 4;
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];
        const brightness = (r + g + b) / 3;

        if (brightness >= threshold) continue;

        visited[idx] = true;
        region.push({ x, y });

        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
    }

    return region;
}

// Suite dans le prochain message...