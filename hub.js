// Liste des outils de la boîte à outils.
// Pour ajouter un futur module : ajouter une entrée ici avec status "active"
// et un href une fois l'outil prêt — aucune autre modification n'est nécessaire.
const TOOLS = [
    {
        icon: 'icon-map',
        title: 'Stratégie & Tactique',
        description: "Planifie tes déploiements : mode Live, Stratégie Pro, Assistant Break et génération IA de stratégie.",
        href: 'tools/strategie/index.html',
        status: 'active',
    },
    {
        icon: 'icon-timer',
        title: 'Timer',
        description: "Minuteur de match pour le paintball sportif, avec annonces vocales et bips.",
        href: 'tools/timer/index.html',
        status: 'active',
    },
    { status: 'soon', empty: true },
    { status: 'soon', empty: true },
    { status: 'soon', empty: true },
    { status: 'soon', empty: true },
    { status: 'soon', empty: true },
    { status: 'soon', empty: true },
];

function renderTools() {
    const grid = document.getElementById('toolsGrid');
    grid.innerHTML = TOOLS.map(tool => {
        const isActive = tool.status === 'active';
        const statusLabel = isActive ? 'Disponible' : 'Bientôt disponible';

        if (tool.empty) {
            return `
                <div class="tool-card disabled empty">
                    <span class="icon-badge"><svg class="icon"><use href="#icon-lock"/></svg></span>
                    <span class="status">${statusLabel}</span>
                </div>
            `;
        }

        const tag = isActive ? 'a' : 'div';
        const hrefAttr = isActive ? `href="${tool.href}"` : '';
        const descriptionHtml = tool.description ? `<p>${tool.description}</p>` : '';
        return `
            <${tag} class="tool-card ${isActive ? 'active' : 'disabled'}" ${hrefAttr}>
                <div class="row">
                    <span class="icon-badge"><svg class="icon"><use href="#${tool.icon}"/></svg></span>
                    <h3>${tool.title}</h3>
                </div>
                ${descriptionHtml}
                <span class="status">${statusLabel}</span>
            </${tag}>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', renderTools);
