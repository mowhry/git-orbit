# git-orbit

> Build your GitHub constellation.

Ton activité GitHub devient un petit monde en pixel art : la Terre au centre,
des CubeSats en orbite, des étoiles et quelques signaux lumineux. Les satellites
grandissent avec ton historique. Le dessin raconte la progression, sans compteurs.

![Une constellation Git Orbit, données de démonstration](examples/constellations/active-dark.svg)

**Version locale fonctionnelle** : moteur TypeScript, SVG statiques et animés,
collecte GitHub, CLI, endpoint HTTP, cache persistant et action de génération.
Aucun service public n'est déployé. Les exemples utilisent des données simulées,
avec `mowhry` comme graine de génération.

## Essayer

Node.js **22 ou supérieur**. Aucune dépendance d'exécution ; TypeScript et les types
Node servent uniquement à la compilation.

```sh
cd git-orbit
npm ci
npm run demo
```

Ouvre [`examples/constellations/index.html`](examples/constellations/index.html)
dans ton navigateur : débutant, actif, vétéran et progression maximale, avec
versions transparentes, sombres, claires et statiques.

Pour créer un exemple sans jeton ni connexion :

```sh
npm run generate -- mowhry --demo --output orbit.svg
```

Le pseudo détermine la disposition. `--demo` utilise **toujours des métriques
simulées**, jamais celles du compte indiqué.

## Utiliser les données GitHub

Configure `GITHUB_TOKEN` ou `GH_TOKEN` dans ton environnement, puis :

```sh
npm run generate -- mowhry --output orbit.svg

# Sortie SVG seule sur stdout, utilisable avec une redirection.
node dist/src/cli.js octocat > orbit.svg

# Même scène, sans animation.
node dist/src/cli.js mowhry --static --output orbit-static.svg

# Métriques précises ou instantané enregistré, sans réseau.
node dist/src/cli.js mowhry --fixture fixtures/veteran.json --theme dark -o veteran.svg

node dist/src/cli.js --help
```

Pour utiliser littéralement `git-orbit mowhry > orbit.svg`, exécute `npm link`
après `npm run build`. Le paquet n'est pas encore publié sur npm.

La collecte interroge GraphQL, année par année depuis la création du compte,
et pagine tous les dépôts publics possédés pour compter leurs étoiles. Les commits,
PR et reviews correspondent aux contributions reconnues par GitHub, pas à tous
les objets Git de toutes les branches. Les contributions privées dépendent des
autorisations du jeton et de la visibilité du profil. Aucune activité manquante
n'est inventée. Les organisations ne sont pas prises en charge.

Sans jeton, utilise `--demo` ou `--fixture`. Une erreur produit un SVG « No signal »
sur stdout et un code de sortie non nul. Avec `--output`, une erreur préserve le
fichier existant. Les diagnostics vont sur stderr.

## Ce qui fait évoluer la constellation

| Activité | Effet |
| --- | --- |
| Commits cumulés | Croissance principale, 1 point par commit |
| Pull requests | 5 points, modèles de satellite plus avancés |
| Reviews | 3 points, petits échanges lumineux entre satellites |
| Étoiles reçues | Densité du ciel, quelques étoiles plus brillantes ; aucun satellite supplémentaire |
| Streak actuel | LED et signaux, vitesse légèrement augmentée ; aucun matériel supplémentaire |

Les seuils initiaux sont 0, 50, 150, 300, 500, 750, 1000… points. La scène est
limitée à **24 satellites et 4 orbites**. Les quatre modèles restent des CubeSats :
petit cube, panneaux solaires, antenne, puis capteurs, parabole et accents dorés.
Au plafond, le matériel continue d'évoluer jusqu'au quatrième niveau.

Le score exclut les étoiles pour respecter le cahier des charges : une étoile
GitHub devient une étoile dans le ciel. Les poids et seuils sont modifiables
sans toucher au moteur graphique :

```sh
node dist/src/cli.js mowhry --demo --config examples/progression.json -o orbit.svg
```

Les pixels, positions et variantes dépendent uniquement du pseudo, de l'état et de
la version du moteur. Aucun `Math.random()` dans le rendu. L'âge du compte est
collecté, mais ne change pas la Terre dans cette version.

## Intégrer à un README

```md
![Ma constellation GitHub](output/orbit.svg)
```

Le SVG mesure **800 × 400**, avec un fond transparent par défaut. Les satellites
utilisent des symboles SVG ; la Terre animée utilise une bande de pixels PNG
embarquée dans le SVG. Aucune police, image ou feuille de style distante, aucun
JavaScript. `--theme dark` et `--theme light` ajoutent
un fond ; `--static` supprime toutes les animations.

La Terre tourne sur elle-même en **96 secondes** : les continents défilent sur la
sphère, avec un éclairage et une atmosphère fixes. Les quatre plans orbitaux sont
inclinés sur des axes différents, comme dans une représentation d'atome. Les
satellites alternent les sens de parcours et chaque plan conserve son propre
premier plan et arrière-plan pour passer correctement autour du globe.

Les animations utilisent uniquement du CSS. Les étoiles scintillent doucement et
les LED clignotent. Quelques paquets de communication circulent au chargement de
l'image. `prefers-reduced-motion` désactive
l'animation. Aucun GIF n'est généré par ce nouveau moteur.

Les SVG sont contrôlés localement dans des balises `<img>` sous Chromium et Firefox. La compatibilité dans
un README publié doit encore être vérifiée après mise en ligne ;
`orbit-static.svg` constitue le repli explicite. Le format respecte les
[restrictions des SVG utilisés comme images](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image).
GitHub utilise un [proxy d'images avec cache](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls),
donc une mise à jour peut ne pas être visible immédiatement.

## Mise à jour quotidienne

L'[action composite](action.yml) compile le moteur et écrit `orbit.svg`,
`orbit-static.svg` et `.orbit-state/<pseudo>.json` dans le dossier de sortie.
Le jeton intégré du workflow est utilisé par défaut. L'action génère les fichiers ;
le workflow d'exemple effectue le commit.

Si ce projet est à la racine de ton dépôt GitHub :

```sh
mkdir -p .github/workflows
cp examples/orbit.yml .github/workflows/orbit.yml
```

Déclenche ensuite **Grow my constellation** dans l'onglet Actions. Le workflow
s'exécute aussi chaque jour. Il nécessite l'autorisation d'écrire sur la branche.

Pour un dépôt de profil distinct, copie `src/`, `package.json`, `package-lock.json`,
`tsconfig.json` et `action.yml` sous `.github/orbit/`, puis remplace `uses: ./`
par `uses: ./.github/orbit` dans le workflow. Les sprites sont déjà embarqués
dans le module généré ; aucun téléchargement d'assets n'est requis.

Conserve aussi `output/.orbit-state/` dans les commits : ce sont uniquement les
métriques agrégées et la date du dernier relevé, sans jeton. Elles mémorisent les
progrès, même si la visibilité des contributions change.

## Endpoint local

```sh
npm start
```

- Démonstration : `http://127.0.0.1:3000/api/demo?username=mowhry`
- Données GitHub : `http://127.0.0.1:3000/api/orbit?username=mowhry`
- Options : `&theme=dark&animation=false`

L'endpoint réel nécessite le même `GITHUB_TOKEN`. Le serveur écoute sur
`127.0.0.1:3000` par défaut ; `HOST`, `PORT` et `ORBIT_CACHE_DIR` sont configurables.

Après hébergement sur une URL HTTPS publique, le même endpoint pourra être utilisé
dans `![Git Orbit](https://TON-HOTE/api/orbit?username=TON-PSEUDO)`.
Cet hébergement reste à configurer ; l'adresse locale n'est pas accessible depuis
GitHub. Le workflow quotidien permet déjà de se passer d'un serveur public.

Le cache disque dure 30 minutes. Les requêtes simultanées pour le même compte
sont regroupées. En cas de panne ou de limite API, le dernier instantané est
réutilisé. Les maxima cumulés des commits, PR et reviews préservent le matériel
acquis tant que le dossier de cache est conservé. Sans cache, l'historique cumulé
évite déjà la régression due à une simple période d'inactivité.

Une erreur de l'endpoint retourne un **SVG valide avec HTTP 200** pour les proxys
d'images, `Cache-Control: no-store` et un en-tête `X-Orbit-Error`. Les réponses
réussies incluent un ETag et `X-Orbit-Source: live`, `cache`, `stale` ou `demo`.

## Développer

```sh
npm test        # progression, API simulée, cache, HTTP et rendu
npm run demo    # régénérer la galerie, déterministe
npm run assets  # régénérer les sprites SVG et le module embarqué
```

```text
src/github/        collecte, normalisation et cache
src/progression/   activité → état visuel configurable
src/renderer/      état → satellites, orbites, étoiles → SVG
src/utils/         graine déterministe
assets/            Terre, quatre CubeSats et effets en SVG
fixtures/          métriques de démonstration
examples/          images générées, galerie et workflow
tests/             tests Node sans service externe
```

Les requêtes suivent la [référence GraphQL GitHub](https://docs.github.com/en/graphql/reference/users#contributionscollection).
Les tests simulent les réponses GitHub, dont la pagination, les limites API,
les années bissextiles et les données incomplètes. Une validation authentifiée
et une exécution du workflow sur GitHub restent à faire avec ton jeton/dépôt.

## Origine du projet

Le [cahier des charges original](docs/vision.md) est conservé. Les dépôts locaux
[git-bonsai](https://github.com/egorthinks/git-bonsai) et
[git-koi](https://github.com/yalongwastaken/git-koi) ont servi de références pour la
séparation collecte/rendu, la génération déterministe et l'utilisation dans un
README. Les dessins et le moteur de constellation sont propres à ce projet.

L'ancien prototype Python de station en caractères est toujours présent
(`orbit.py`, `terminal_art.py`, ses assets et ses sorties). Sa documentation et
son ancienne action sont conservées dans [docs/legacy-station.md](docs/legacy-station.md)
et [examples/legacy-action.yml](examples/legacy-action.yml).
