# Git Orbit

A little orbital relay that grows with your repository, drawn in terminal characters.

<p align="center"><img src="output/station-dark.gif" width="576" alt="An orbital relay drawn with terminal characters, cyan solar panels, a pulsing amber beacon and a maintenance drone." /></p>

The default renderer is a **72 × 30 character grid** with eight colors. The same
characters drive the animated ANSI terminal view and the GIF for your README.
Solar panels use `░▒`, metal uses box-drawing characters, and signals travel in
little pulses. Four construction stages keep the original central hub in place.

## Run in your terminal

Python 3.10+ and Git are required. All fonts and artwork are included.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python orbit.py --demo --terminal
```

Use a UTF-8 terminal at least 72 columns × 31 rows. Ctrl+C restores your previous
screen and cursor. `--duration 8` exits after one loop. This mode writes ANSI
characters directly; it does not require Chafa or an image protocol.

```sh
# Use the actual activity of a repository.
.venv/bin/python orbit.py --repo /path/to/repo --terminal

# Print one frame as plain, uncolored Unicode text.
.venv/bin/python orbit.py --demo --plain
```

## Export a README animation

```sh
# Adult demo plus the four simulated construction stages.
.venv/bin/python orbit.py --demo --gallery

# A station based on an actual local repository.
.venv/bin/python orbit.py --repo /path/to/repo --output my-station
```

This reads local Git history without changing the source repository or contacting
GitHub. Use a full clone: shallow histories are rejected. `--as-of 2026-11-01`
selects a reproducible snapshot date; the default is the current UTC date.

The terminal renderer is the default. `--style pixel` selects the earlier illustrated
sprite renderer. `--terminal` and `--plain` use the character renderer.

## Growth

![Four construction stages](output/stages.png)

| Stage | Non-merge commits | Active ISO weeks | Structure |
| --- | ---: | ---: | --- |
| Sonde | 0 | 0 | Core, folded panels, beacon |
| Relais | 12 | 2 | Solar wings, dish, service cylinder |
| Avant-poste | 60 | 6 | Side modules, docking arm, maintenance drone |
| Station | 180 | 16 | Four arrays, two dishes, observation module |

Both thresholds must be met. Active weeks contain at least one qualifying commit;
they do not have to be consecutive. Quiet periods never remove built hardware.
Commits touching only `output/`, the chosen output directory, or paths passed with
`--exclude` do not count. Automatic image commits therefore cannot grow the station.

Recent work controls transmission cadence. Real version tags add gold rivets.
The root commit seeds the drone's phase and beacon timing. These signals represent
repository activity; they do not measure uptime, CI checks or production health.

## Output

- `station.gif`: transparent animation, **576 × 480** for the terminal style.
- `station-dark.gif`: the same animation on a terminal-dark background.
- `station.png`: transparent still image.
- `station.txt`: one frame as plain Unicode characters.
- `station.ansi`: the same frame with ANSI colors; view with `cat`.
- `metrics.json`: the actual input data, selected stage and visual style.
- `--gallery`: four stage GIFs, `stages.png` and an accelerated `growth.gif`.
  This gallery uses **simulated milestones**, independent of the repository's stage.

The supplied `output/` files demonstrate the adult station. `examples/mowhry/`
contains a real snapshot of the profile repository. Pixel-style GIFs remain 320 ×
320 and do not export character files. Use separate output directories to keep variants.

```html
<img src="output/station-dark.gif" width="576" alt="My repository's orbital relay" />
```

## GitHub Actions

`action.yml` is a local composite action. It renders; `examples/orbit.yml` performs
the commit. It has not been published as a marketplace action.

For this project at the root of a GitHub repository, copy `examples/orbit.yml` to
`.github/workflows/orbit.yml`. To embed it in another repo, copy `orbit.py`,
`terminal_art.py`, `requirements.txt`, `action.yml` and `assets/` under
`.github/orbit/`, then change `uses: ./` to `uses: ./.github/orbit` in the workflow.
Keep `fetch-depth: 0`. Run it manually once. Pushing requires branch write access.
The action's `style` input defaults to `terminal` and also accepts `pixel`.

## Rendering and sources

The terminal artwork is authored as character geometry in `terminal_art.py`.
It is rendered directly to ANSI or to a bitmap with the bundled Source Code Pro
font, with antialiasing disabled. Its SIL Open Font License is in
`assets/fonts/LICENSE.md`. There is no system-font dependency.

The optional pixel-style sprites were created with imagegen using git-koi and
git-bonsai as visual references. Their source atlas and prompt are in
`assets/source/`; `bash assets/prepare.sh` re-extracts them using ImageMagick.
Image generation is not used at runtime. There are four construction stages;
unlimited unique station layouts are not implemented.

Motion, activity mapping and GIF encoding are deterministic for identical metrics
and dependency versions. Validate the growth rules, Git exclusions, animation
loops, character exports and terminal restoration with:

```sh
.venv/bin/python -m unittest discover -s tests -v
```
