# Utilisation avancée

## CLI

Après `npm ci && npm run build` :

```sh
node dist/src/cli.js mowhry --demo > orbit.svg
node dist/src/cli.js mowhry --fixture fixtures/growing.json --theme dark -o growing.svg
node dist/src/cli.js mowhry --static --output orbit-static.svg
node dist/src/cli.js mowhry --refresh --output orbit.svg
node dist/src/cli.js --help
```

Sans `--demo` ni `--fixture`, définis `GITHUB_TOKEN` ou `GH_TOKEN` dans ton
environnement. Pour utiliser directement `git-orbit mowhry > orbit.svg`, lance
`npm link` après la compilation. Le paquet n'est pas publié sur npm.

Le SVG est la seule sortie sur stdout ; les diagnostics vont sur stderr. Une
erreur GitHub produit un SVG « No signal » sur stdout et un code de sortie non
nul. Avec `--output`, une erreur préserve le fichier existant. Les fixtures
acceptent des métriques normalisées ou un instantané enregistré par le cache.

## Progression

```sh
node dist/src/cli.js mowhry --demo --config examples/progression.json -o orbit.svg
```

Les poids, seuils, niveaux de satellite et effets sont configurables dans
[`examples/progression.json`](../examples/progression.json). Le score exclut les
étoiles. Le plafond de lisibilité est de 21 satellites répartis sur quatre plans
orbitaux, avec au plus six satellites par plan.

## Collecte et cache

GraphQL est interrogé année par année, avec des fenêtres sans chevauchement. Les
commits, PR et reviews sont les contributions comptées par GitHub, pas tous les
objets Git de toutes les branches. La collecte pagine les dépôts publics possédés
pour compter leurs étoiles. Aucune activité manquante n'est inventée.

Le cache disque dure 30 minutes ; `--cache CHEMIN` choisit son emplacement. Les
requêtes simultanées pour le même compte sont regroupées. En cas de panne ou de
limite API, le dernier instantané reste utilisable. Les maxima cumulés des commits,
PR et reviews conservent le matériel acquis si la visibilité des données change.
Les étoiles et le streak restent des signaux actuels.

L'action stocke le cache sous `output/.orbit-state/` pour le conserver dans Git.
Les métriques sont agrégées et ne contiennent aucun jeton. Le cache local par
défaut est `.cache/orbit/`, ignoré par Git.

La structure des requêtes suit la [référence GraphQL GitHub](https://docs.github.com/en/graphql/reference/users#contributionscollection).

## Endpoint HTTP facultatif

```sh
npm start
```

- Démo sans jeton : `http://127.0.0.1:3000/api/demo?username=mowhry`
- Activité réelle : `http://127.0.0.1:3000/api/orbit?username=mowhry`
- Options : `&theme=dark&animation=false`

`HOST`, `PORT` et `ORBIT_CACHE_DIR` sont configurables. Pour utiliser un fichier
local `.env`, copie [`.env.example`](../.env.example), renseigne-le et démarre :

```sh
node --env-file=.env dist/src/server.js
```

Le serveur écoute sur `127.0.0.1:3000` par défaut. L'adresse locale n'est pas
accessible depuis GitHub ; le workflow quotidien permet d'utiliser les images
sans héberger cet endpoint.

Une erreur d'image retourne un SVG valide avec HTTP 200, `Cache-Control: no-store`
et un en-tête `X-Orbit-Error`. Les réponses réussies incluent un ETag et
`X-Orbit-Source: live`, `cache`, `stale` ou `demo`.

## En cas de problème

- **Image absente après le push** : attends la première exécution réussie de
  **Grow my constellation**, puis vérifie `output/orbit.svg` dans le dépôt.
- **Image inaccessible depuis le profil** : le dépôt contenant l'image doit être
  public ; un jeton d'accès privé ne doit pas être inséré dans l'URL du README.
- **Commit automatique refusé** : vérifie `permissions: contents: write` et les
  règles de protection de la branche.
- **Action introuvable** : le workflow de profil référence
  `mowhry/git-orbit@master`. Le dépôt source doit être accessible depuis ce workflow.
- **Cache visuel ancien** : GitHub met en cache les images ; voir
  [sa documentation Camo](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls).
- **Erreur de reproductibilité** : utilise `npm ci`, puis `npm run assets` et
  `npm run demo`, et enregistre les fichiers générés. Le compresseur JavaScript
  verrouillé évite les différences entre les versions natives de zlib.
