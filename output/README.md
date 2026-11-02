# Constellation générée

Le workflow **Grow my constellation** remplit ce dossier avec les données GitHub
du propriétaire du dépôt après le premier push sur `master`, puis chaque jour.

| Fichier | Contenu |
| --- | --- |
| `orbit.svg` | Constellation animée, fond transparent |
| `orbit-static.svg` | Même constellation sans animation |
| `.orbit-state/<pseudo>.json` | Métriques cumulées et date du dernier relevé |

Ces fichiers sont suivis par Git. L'instantané contient uniquement des métriques
agrégées, jamais le jeton. Conserve-le pour mémoriser la progression.

Les images apparaîtront après la première exécution réussie du workflow.
Les exemples immédiatement disponibles sont dans [`examples/constellations/`](../examples/constellations/).
