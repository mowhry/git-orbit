# git-orbit

> Build your GitHub constellation.

Turn your GitHub activity into a living pixel-art constellation: a rotating Earth,
CubeSats on tilted orbits, and a sky that grows with your projects.

Embed it in your profile README and let GitHub Actions update it every day.
No hosted service required.

[![Tests](https://github.com/mowhry/git-orbit/actions/workflows/ci.yml/badge.svg)](https://github.com/mowhry/git-orbit/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Animated Git Orbit constellation](examples/constellations/active-dark.svg)

*Preview generated from sample data. Each account gets a deterministic constellation based on its username and activity.*

## Features

- Pixel-art Earth with a slow, 96-second rotation.
- Up to 21 satellites across four inclined orbital planes.
- Four CubeSat designs that evolve with contributions.
- Repository stars become stars in the sky; reviews enable communication signals.
- Self-contained animated SVGs, with static exports and reduced-motion support.
- Transparent, dark, and light backgrounds.
- Daily updates through GitHub Actions, or local generation through the CLI.
- Persistent progress and cached data for temporary GitHub API outages.

## Add it to your GitHub profile

Create `.github/workflows/orbit.yml` in your profile repository
(`YOUR-USERNAME/YOUR-USERNAME`) with the following workflow. A ready-to-copy file is
also available in [examples/profile-workflow.yml](examples/profile-workflow.yml).

```yaml
name: Grow my constellation

on:
  schedule:
    - cron: '23 3 * * *'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: git-orbit-${{ github.ref }}
  cancel-in-progress: false

jobs:
  orbit:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.ref_name }}
      - uses: mowhry/git-orbit@master
        with:
          username: ${{ github.repository_owner }}
          output-dir: output
      - name: Save the constellation
        shell: bash
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
          git add -- output/orbit.svg output/orbit-static.svg output/.orbit-state
          if ! git diff --cached --quiet; then
            git commit -m 'chore: grow my constellation'
            git push
          fi
```

Open **Actions → Grow my constellation → Run workflow** to generate the first
image. Once the workflow succeeds, add this to your profile README:

```md
![My GitHub constellation](output/orbit.svg)
```

The workflow then updates the image daily at 03:23 UTC. It uses the built-in
`GITHUB_TOKEN` by default; no personal token is needed for public activity.

For a still image, use `output/orbit-static.svg` instead. Keep
`output/.orbit-state/` in your repository to preserve earned progress across runs.

## A constellation that grows

| First satellite | Active constellation |
| :---: | :---: |
| ![First satellite](examples/constellations/new-dark.svg) | ![Active constellation](examples/constellations/active-dark.svg) |
| **1 satellite** | **8 satellites** |

| Expanding constellation | Mature constellation |
| :---: | :---: |
| ![Expanding constellation](examples/constellations/growing-dark.svg) | ![Mature constellation](examples/constellations/veteran-dark.svg) |
| **14 satellites** | **21 satellites maximum** |

These examples illustrate the progression. Satellites unlock gradually between
milestones, and further activity upgrades existing hardware after the count reaches
its limit.

| GitHub activity | Visual effect |
| --- | --- |
| Commits | Main source of growth: 1 point per commit |
| Pull requests | 5 points each, plus more advanced satellite designs |
| Code reviews | 3 points each, plus brief communication signals |
| Stars received | A richer star field, without adding satellites |
| Current streak | Brighter LEDs, radio signals, and slightly faster movement |

Quiet periods do not remove earned satellites. The same username, visual state,
and engine version produce identical SVG bytes.

## Run locally

Requires **Node.js 22 or later** and npm.

```sh
git clone https://github.com/mowhry/git-orbit.git
cd git-orbit
npm ci
npm run generate -- your-username --demo --output orbit.svg
```

`--demo` uses sample activity and works without a token or network connection.
To use real GitHub activity, set `GITHUB_TOKEN` or `GH_TOKEN` in your environment,
then omit `--demo`:

```sh
npm run generate -- your-username --output orbit.svg
```

Additional examples:

```sh
# Dark background or static export.
npm run generate -- your-username --demo --theme dark --output orbit.svg
npm run generate -- your-username --demo --static --output orbit-static.svg

# Render saved activity without contacting GitHub.
npm run generate -- your-username --fixture fixtures/growing.json --output orbit.svg

# Generate all examples and open examples/constellations/index.html locally.
npm run demo

# After building, write only SVG to stdout.
node dist/src/cli.js your-username --demo > orbit.svg
node dist/src/cli.js --help
```

The CLI writes diagnostics to stderr. GitHub failures return a nonzero exit code;
when using `--output`, an existing image is preserved.

## GitHub Action inputs

| Input | Default | Description |
| --- | --- | --- |
| `username` | Repository owner | GitHub account to render |
| `github-token` | `${{ github.token }}` | Token used to read the GitHub API |
| `output-dir` | `output` | Destination for images and persistent activity data |
| `theme` | `transparent` | `transparent`, `dark`, or `light` |

The action generates:

```text
output/
├── orbit.svg
├── orbit-static.svg
└── .orbit-state/
    └── your-username.json
```

The action renders files; the example workflow commits them. Activity snapshots
contain aggregate metrics and a fetch timestamp, never the token.

## Customization

Use `--theme transparent`, `--theme dark`, or `--theme light` to choose a background.
Use `--static` to disable all animation.

Scoring weights, unlock thresholds, and effect levels can be adjusted without
changing the renderer:

```sh
node dist/src/cli.js your-username --demo \
  --config examples/progression.json --output orbit.svg
```

See [examples/progression.json](examples/progression.json) for the available
settings. The layout supports a maximum of 21 satellites and four orbits.

## Optional HTTP endpoint

```sh
npm start
```

- Sample data: `http://127.0.0.1:3000/api/demo?username=your-username`
- GitHub activity: `http://127.0.0.1:3000/api/orbit?username=your-username`
- Options: `&theme=dark&animation=false`

Real activity requires `GITHUB_TOKEN` or `GH_TOKEN`. Configure `HOST`, `PORT`, and
`ORBIT_CACHE_DIR` through the environment. An optional local configuration template
is provided in [.env.example](.env.example).

The server binds to `127.0.0.1:3000` by default. Using its URL in a GitHub README
requires deploying it to a publicly accessible host. The GitHub Actions workflow
works without running this server.

## Rendering and data

Images are **800 × 400** and contain all required assets. Satellites use reusable
SVG symbols; Earth uses an embedded PNG frame strip. Animation runs entirely in
CSS, with no scripts or external resources inside the image. Animated images have
been checked in Chromium and Firefox, and respect `prefers-reduced-motion`.

Activity is collected through GitHub GraphQL, year by year from account creation.
Commit, pull request, and review counts follow GitHub's contribution rules. Stars
are collected from public repositories owned by the account. Private contributions
depend on token permissions and profile visibility. Organization accounts are not
currently supported.

Activity is cached for 30 minutes. Temporary API failures and rate limits fall
back to the last cached snapshot when available. Stored contribution totals retain
earned hardware if data visibility changes.

GitHub's image proxy may delay visible updates. See
[GitHub's image caching documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls).

## Development

The renderer has no runtime dependencies. TypeScript, Node types, and the pinned
JavaScript PNG compressor are build-time dependencies.

```sh
npm ci
npm test
npm run assets             # Regenerate artwork and the embedded asset module.
npm run demo               # Rebuild the example gallery.
npm run verify:generated   # Check generated files against committed versions.
```

```text
src/github/        GitHub collection, normalization, and caching
src/progression/   Activity-to-visual-state mapping
src/renderer/      Earth, satellites, orbits, stars, and SVG output
assets/            Pixel artwork and Earth animation frames
fixtures/          Sample activity data
examples/          Generated scenes and workflow templates
tests/             Progression, rendering, API, cache, CLI, and repository tests
```

Tests use mocked GitHub responses and do not require credentials. Generated assets
and examples are committed so changes can be reviewed visually. See
[CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and
[CHANGELOG.md](CHANGELOG.md) for release notes.

## Acknowledgments

Inspired by [git-bonsai](https://github.com/egorthinks/git-bonsai) and
[git-koi](https://github.com/yalongwastaken/git-koi). Git Orbit's constellation engine
and artwork are original to this project.

## License

[MIT](LICENSE).
