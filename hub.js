// Liste des outils de la boîte à outils.
// Pour ajouter un futur module : ajouter une entrée ici avec status "active"
// et un href une fois l'outil prêt — aucune autre modification n'est nécessaire.
// "category" doit correspondre à l'id d'une entrée de CATEGORIES ci-dessous.
const CATEGORIES = [
    { id: 'match', label: 'Outils de match', icon: 'icon-target' },
    { id: 'gestion', label: 'Gestion du club', icon: 'icon-folder' },
];

const TOOLS = [
    {
        icon: 'icon-map',
        title: 'Stratégie & Tactique',
        description: "Planifie tes déploiements : mode Live, Stratégie Pro, Assistant Break et génération IA de stratégie.",
        href: 'tools/strategie/index.html',
        status: 'active',
        category: 'match',
    },
    {
        icon: 'icon-timer',
        title: 'Timer',
        description: "Minuteur de match pour le paintball sportif, avec annonces vocales et bips.",
        href: 'tools/timer/index.html',
        status: 'active',
        category: 'match',
    },
    { status: 'soon', empty: true, category: 'match' },
    { status: 'soon', empty: true, category: 'match' },
    { status: 'soon', empty: true, category: 'match' },
    { status: 'soon', empty: true, category: 'match' },
    { status: 'soon', empty: true, category: 'gestion' },
    { status: 'soon', empty: true, category: 'gestion' },
    { status: 'soon', empty: true, category: 'gestion' },
    { status: 'soon', empty: true, category: 'gestion' },
    { status: 'soon', empty: true, category: 'gestion' },
    { status: 'soon', empty: true, category: 'gestion' },
];

function toolCardHtml(tool) {
    if (tool.empty) {
        return `
            <div class="tool-card disabled empty">
                <span class="icon-badge"><svg class="icon"><use href="#icon-lock"/></svg></span>
                <span class="status">Bientôt disponible</span>
            </div>
        `;
    }

    const isActive = tool.status === 'active';
    const statusLabel = isActive ? 'Disponible' : 'Bientôt disponible';
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
}

function categoryGroupHtml(category, tools, open) {
    // Les cartes "empty" sont un simple remplissage visuel (pour que la
    // grille paraisse fournie) : on ne les compte pas dans le badge.
    const realCount = tools.filter(tool => !tool.empty).length;
    const countHtml = realCount > 0 ? `<span class="group-count">${realCount}</span>` : '';
    return `
        <details class="tool-group"${open ? ' open' : ''}>
            <summary>
                <svg class="icon chevron"><use href="#icon-chevron-down"/></svg>
                <svg class="icon group-icon"><use href="#${category.icon}"/></svg>
                <span class="group-title">${category.label}</span>
                ${countHtml}
            </summary>
            <div class="tools-grid">${tools.map(toolCardHtml).join('')}</div>
        </details>
    `;
}

function renderTools() {
    document.getElementById('toolsGroups').innerHTML = CATEGORIES.map((category, i) => {
        const tools = TOOLS.filter(tool => tool.category === category.id);
        if (tools.length === 0) return '';
        return categoryGroupHtml(category, tools, i === 0);
    }).join('');
}

document.addEventListener('DOMContentLoaded', renderTools);
