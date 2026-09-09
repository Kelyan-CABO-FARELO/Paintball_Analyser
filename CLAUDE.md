# Instructions pour Claude Code — Paintball Analyser

Ce fichier documente les conventions à suivre pour que tous les outils de la
boîte à outils restent visuellement cohérents. Lis-le avant de créer ou modifier
un outil sous `tools/`. Pour la structure générale du dépôt, voir [README.md](README.md).

## Design system partagé

Toutes les pages (hub + outils) chargent **assets/css/core.css**, qui contient
les tokens (couleurs, espacements, rayons, ombres, typo) et les composants
communs (topbar, back-link, boutons). **Ne jamais coder une couleur en dur**
(`#0f172a`, `#38bdf8`, etc.) dans un `style.css` d'outil : toujours utiliser les
variables `var(--...)` définies dans `core.css`. Si un outil a besoin d'une
teinte spécifique (ex. le violet "IA" de Stratégie), déclarer une variable
locale dans son propre `:root` plutôt que d'écrire le hex directement.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/core.css">
<link rel="stylesheet" href="style.css">
```

## Icônes

- Navigation et actions d'interface (retour, tutoriel, stop, flag...) : icône
  SVG au trait, dans un sprite `<svg style="display:none"><defs>...</defs></svg>`
  **inliné en tête du `<body>` de chaque page**. Ne pas référencer un fichier
  SVG externe via `<use href="assets/icons.svg#...">` : ça casse en `file://`
  (voir README, le projet doit pouvoir s'ouvrir sans serveur). Copier les
  `<symbol>` déjà définis dans `tools/timer/index.html` ou
  `tools/strategie/index.html` plutôt que d'en redessiner.
- Pictogrammes "métier" (types d'obstacles, postures, modes de jeu...) :
  l'emoji reste approprié, il sert de repère visuel instantané. Ne pas les
  remplacer par des icônes SVG.

## Gabarit de topbar (obligatoire pour tout nouvel outil)

Chaque page d'outil (`tools/<nom>/index.html`) doit utiliser ces classes
partagées, définies une seule fois dans `core.css` — ne pas les redéfinir
localement dans le `style.css` de l'outil.

**Cas simple (pas de navigation multi-étapes), voir `tools/timer/index.html` :**

```html
<header class="topbar topbar--tool">
    <a href="../../index.html" class="back-link">
        <svg class="icon"><use href="#icon-arrow-left"/></svg>
        <span class="label">Boîte à outils</span>
    </a>
    <div class="topbar-title">
        <svg class="icon"><use href="#icon-mon-outil"/></svg>
        <span class="label">Nom de l'outil</span>
    </div>
    <div class="topbar-actions">
        <button id="tutorialBtn" class="btn-outline topbar-icon-btn">❓<span class="label">Tutoriel</span></button>
    </div>
</header>
```

- `back-link` est **toujours** le premier élément, à gauche.
- `topbar-title` est **toujours centré** (c'est un `flex:1` avec
  `justify-content:center`) entre le back-link et les actions — jamais
  collé à gauche à côté du back-link.
- `topbar-actions` regroupe les boutons de droite. S'il y en a plusieurs
  (ex. un futur bouton "Reset"), le bouton **Tutoriel est toujours le
  dernier** (le plus à droite), pour que son point d'ancrage visuel reste
  identique d'un outil à l'autre.
- Si le nom de l'outil est long et risque de coller aux boutons voisins sur
  mobile, ajouter la classe `hide-label-on-mobile` sur `.topbar-title`
  (masque le texte sous 480px, ne garde que l'icône) — voir
  `tools/strategie/index.html`.

**Cas avec navigation multi-étapes (stepper), voir `tools/strategie/index.html` :**
Le stepper ne rejoint jamais la topbar elle-même — il prend trop de place et
finit par entrer en collision avec le titre ou les actions dès qu'on descend
sous ~1100px. Il passe en **seconde ligne dédiée**, sous la topbar :

```html
<header class="topbar topbar--tool">
    <!-- back-link / topbar-title / topbar-actions, comme ci-dessus -->
</header>
<nav class="stepper-row">
    <div class="stepper">
        <div class="step active" id="indicator-step1"><span class="step-num">1</span><span class="step-label">...</span></div>
        <!-- ... -->
    </div>
</nav>
```

`stepper-row` et `stepper` sont définis dans le `style.css` de Stratégie (pas
encore remontés dans `core.css` puisqu'un seul outil les utilise pour
l'instant) : copier ces règles telles quelles pour un nouvel outil à étapes,
et si un deuxième outil en a besoin, les remonter dans `core.css` à ce
moment-là plutôt que de les dupliquer une deuxième fois.

## Responsive

- Toujours mobile-first, tester au minimum 375px (mobile), ~800px (petit
  écran/tablette) et ~1280px (desktop) avant de considérer une page finie.
- `back-link` et les boutons de `topbar-actions` masquent leur `.label` sous
  479px (règle déjà dans `core.css`) : ne pas la dupliquer.
- Un outil avec une mise en page desktop rigide (sidebar fixe + zone de
  travail, comme Stratégie) doit prévoir un point de rupture (900px pour
  Stratégie) qui repasse en flux vertical scrollable — jamais de sidebar figée
  qui déborde sur mobile.

## Tester en local

Utiliser le serveur configuré dans `.claude/launch.json` (`python3 -m http.server`),
pas `npx serve` : ce dernier réécrit les URL (option `cleanUrls`) d'une façon
qui casse les chemins relatifs des pages dans des sous-dossiers (`tools/xxx/`).
