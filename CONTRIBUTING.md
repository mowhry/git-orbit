# Contribuer à Git Orbit

Node.js 22 ou supérieur et npm sont nécessaires.

```sh
npm ci
npm test
npm run demo
```

Les tests utilisent des réponses GitHub simulées : aucun jeton ni compte externe
n'est requis. Pour essayer la collecte réelle, définis `GITHUB_TOKEN` puis lance
`npm run generate -- TON-PSEUDO --output orbit.svg`.

## Modifier le rendu

Le pipeline reste séparé : collecte → métriques normalisées → progression → scène
SVG. Garde les couleurs limitées, les pixels nets et les images lisibles à 800 × 400.
N'ajoute pas de compteurs ni de panneaux de statistiques dans les constellations.

Le rendu doit être déterministe. Toute variation utilise la graine du pseudo,
jamais `Math.random()`. Les étoiles ne créent pas de satellites, l'inactivité ne
retire pas de matériel acquis, et le plafond reste à 21 satellites.

Les dessins source sont définis dans `scripts/build-assets.mjs`. Après une
modification des assets :

```sh
npm run assets
npm run demo
npm test
npm run verify:generated # après avoir commité les fichiers générés
```

Inclus les SVG, le PNG de rotation, `src/renderer/assets.generated.ts` et les
exemples régénérés dans le même commit. Compare la galerie sur fond clair et
sombre. Pour une animation, vérifie aussi le mode statique et la réduction des
mouvements dans le navigateur. Les instantanés des tests sont les SVG statiques
de `examples/constellations/`.

## Proposer un changement

Ouvre une issue avec le comportement attendu, le comportement observé et, si
possible, une fixture minimale sans données privées. Pour une pull request,
décris le résultat visible et les vérifications effectuées. Une dépendance
supplémentaire doit répondre à un besoin concret.

La CI vérifie les tests et la reproductibilité des assets. Les fichiers de
`output/` sont produits par le workflow du propriétaire du dépôt ; les scènes
de démonstration vivent dans `examples/constellations/`.

La compression PNG utilise `fflate`, verrouillé dans `package-lock.json` : les
compressions natives de Node peuvent différer entre zlib et zlib-ng. Cette
dépendance sert uniquement à fabriquer les assets, pas à exécuter le moteur.
