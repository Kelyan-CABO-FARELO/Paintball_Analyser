# Paintball Analyser

Boîte à outils web pour les clubs de paintball sportif. Aujourd'hui : un outil de
préparation tactique et un minuteur de match. À terme : une suite complète pour gérer
un club (licences, planning, matériel, statistiques...) — les prochains outils sont
encore à l'étude pour coller au plus près des besoins réels d'un club de paintball
sportif avant d'être ajoutés à la boîte à outils.

## Structure du dépôt

```
/
  index.html          Hub — page d'accueil listant tous les outils (grille de cartes)
  hub.css             Styles propres au hub (grille de cartes, topbar du hub)
  hub.js              Génère la grille de cartes à partir d'une liste d'outils

  assets/
    css/core.css      Design system partagé (tokens + composants communs : topbar,
                       back-link, boutons...) chargé par le hub et tous les outils

  tools/
    strategie/         Outil "Stratégie & Tactique"
      index.html       Modes Live, Stratégie Pro, Assistant Break, IA Auto
      script.js        Logique de calcul (lignes de vue, pathfinding IA, break) et UI
      style.css        Styles propres à l'outil
      scratch.js       Script de debug Node (rejoue generateAIStrategy hors navigateur)
    timer/              Outil "Timer" (minuteur de match, annonces vocales et bips)
      index.html
      script.js
      style.css
```

Chaque outil vit dans son propre dossier sous `tools/`. Pour ajouter un nouvel outil au
hub, il suffit de créer `tools/<nom>/` et d'ajouter une entrée `status: 'active'` dans
`TOOLS` (`hub.js`). Voir [CLAUDE.md](CLAUDE.md) pour les conventions à respecter
(design system, topbar, icônes, responsive) afin que le nouvel outil reste cohérent
avec les autres.

## Lancer le projet

Aucune installation ni build nécessaire : c'est du HTML/CSS/JS statique.

- Le plus simple : ouvrir `index.html` directement dans un navigateur.
- Pour un rendu plus fidèle (chemins relatifs, pas de restrictions de navigateur sur
  `file://`), servir le dossier avec un petit serveur statique. La configuration
  `.claude/launch.json` du dépôt utilise :

```bash
python3 -m http.server 5173
```

  Éviter `npx serve` : son option `cleanUrls` réécrit les URL d'une façon qui casse les
  chemins relatifs des pages dans des sous-dossiers (`tools/xxx/`).

## Roadmap

- ✅ **Stratégie & Tactique** — disponible
- ✅ **Timer** — disponible
- 🔎 **Prochains outils à l'étude** — la vision à terme est une suite complète pour la
  gestion d'un club de paintball sportif (licences, planning, matériel, statistiques...),
  mais rien n'est figé côté périmètre : chaque nouvel outil est d'abord étudié pour
  coller précisément aux besoins réels d'un club avant d'être développé.

## Dette technique connue / prochaine étape

L'outil Stratégie fonctionne mais reste un prototype côté ingénierie : c'est volontaire
pour l'instant (priorité au produit), à traiter avant d'empiler beaucoup plus de
fonctionnalités dessus :

- `script.js` est un seul fichier de ~1500 lignes avec état global — à découper en
  modules (géométrie/IA, rendu, état, UI, stockage).
- Pas de build tool (Vite ou équivalent) — utile pour de vrais modules ES, un mode dev,
  et préparer une éventuelle PWA plus tard.
- Pas de modèle de données formalisé (`Field`, `Obstacle`, `Player`, `Strategy`).
- La persistance (`localStorage`) est appelée directement un peu partout — à isoler
  derrière une petite couche de stockage pour pouvoir brancher un backend plus tard
  sans tout réécrire.
- Aucun test automatisé, en particulier sur la logique la plus fragile (calcul des
  lignes de vue, pathfinding IA).

Volontairement laissé de côté pour l'instant : tout ce qui touche à la connexion
(backend, base de données, authentification, licences, paiement) — à traiter quand le
produit sera prêt à passer en multi-utilisateur.
