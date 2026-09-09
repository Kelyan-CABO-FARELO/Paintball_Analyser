// Liste des outils de la boîte à outils.
// Pour ajouter un futur module : ajouter une entrée ici avec status "active"
// et un href une fois l'outil prêt — aucune autre modification n'est nécessaire.
const TOOLS = [
    {
        icon: '🗺️',
        title: 'Stratégie & Tactique',
        description: "Planifie tes déploiements : mode Live, Stratégie Pro, Assistant Break et génération IA de stratégie.",
        href: 'tools/strategie/index.html',
        status: 'active',
    },
    {
        icon: '🪪',
        title: 'Licences & Membres',
        description: "Gestion des licenciés du club, suivi des adhésions et des cotisations.",
        status: 'soon',
    },
    {
        icon: '📅',
        title: 'Planning & Entraînements',
        description: "Organisation des séances d'entraînement et réservation des créneaux terrain.",
        status: 'soon',
    },
    {
        icon: '🎒',
        title: 'Matériel & Inventaire',
        description: "Suivi du matériel du club : billes, bouteilles, protections, marqueurs.",
        status: 'soon',
    },
    {
        icon: '📊',
        title: 'Statistiques & Performance',
        description: "Historique des matchs et statistiques de performance par joueur et par équipe.",
        status: 'soon',
    },
];

function renderTools() {
    const grid = document.getElementById('toolsGrid');
    grid.innerHTML = TOOLS.map(tool => {
        const isActive = tool.status === 'active';
        const tag = isActive ? 'a' : 'div';
        const hrefAttr = isActive ? `href="${tool.href}"` : '';
        const statusLabel = isActive ? 'Disponible' : 'Bientôt disponible';
        return `
            <${tag} class="tool-card ${isActive ? 'active' : 'disabled'}" ${hrefAttr}>
                <span class="icon">${tool.icon}</span>
                <h3>${tool.title}</h3>
                <p>${tool.description}</p>
                <span class="status">${statusLabel}</span>
            </${tag}>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', renderTools);
