# git-orbit

> Build your GitHub constellation.

`git-orbit` turns a GitHub profile into an evolving pixel-art satellite constellation.

The user's GitHub activity is represented visually as a small animated world:

- Earth at the center
- pixel-art satellites orbiting around it
- more activity creates a larger constellation
- satellites evolve as the user becomes more active
- GitHub stars become stars in the background
- pull requests, reviews, commits and streaks influence different visual properties

The goal is not to display another GitHub statistics dashboard.

The goal is to create a small living object that someone wants to put in their GitHub profile README, in the same spirit as projects such as `git-bonsai` or `git-koi`.

The final output should feel like a collectible pixel-art scene, not an analytics widget.

---

# 1. Product vision

A GitHub profile becomes a small orbital ecosystem.

At the beginning, the user may only have:

```text
          satellite

             Earth
```

As the user contributes more:

```text
             satellite

        .---------------.
     satellite       satellite
          .-------.
       satellite Earth satellite
          '-------'
     satellite       satellite
        '---------------'
```

Eventually, an experienced developer has:

- several orbital layers
- multiple satellites
- more advanced satellite designs
- active communication links
- more stars in the sky
- subtle animations
- a visually richer scene

The constellation should represent progression without becoming visually cluttered.

---

# 2. Core principle

The visual should tell the story.

Do not display a dashboard around the scene.

Avoid adding:

- commit counters
- contribution charts
- language percentages
- Kubernetes logos
- SRE labels
- metric panels
- GitHub statistics cards
- unnecessary text inside the generated image

The primary output should simply be:

```text
Earth + satellites + orbits + stars + animations
```

The meaning of each element can be explained in the project README.

---

# 3. Visual direction

The entire project uses pixel art.

The aesthetic should be:

- small
- clean
- charming
- readable at README size
- slightly retro
- space-themed
- minimal
- dark-background friendly

The style should resemble a small 16-bit or 32-bit game asset rather than a detailed digital illustration.

Important:

Do not generate realistic satellites.

Do not create large complex space stations.

Do not make the scene look like a SaaS dashboard.

The satellite should look approximately like a small CubeSat:

```text
      |
      *
   +-----+
===|     |===
   |  ^  |
   +-----+
```

Typical satellite components:

- small central cube
- two solar panels
- tiny antenna
- small status light
- optional communication dish
- optional propulsion module
- optional additional solar panels

The basic satellite should remain recognizable even at very small resolutions.

---

# 4. Main scene

The scene contains:

## Earth

Earth is always at the center.

It represents the user's GitHub ecosystem.

Earth should not change dramatically based on activity.

Possible subtle animations:

- slow rotation
- small clouds
- atmospheric glow

Earth is primarily a visual anchor.

---

## Satellites

Satellites orbit Earth.

They represent GitHub activity and progression.

Users with little activity should have very few satellites.

Users with significant activity should have a visibly richer constellation.

Do not create one satellite for every contribution.

That would quickly become unreadable.

Instead, activity contributes toward progression thresholds.

Example:

```text
50 activity points -> unlock one satellite
```

The exact scoring values should be configurable.

---

# 5. GitHub activity scoring

The initial scoring model can be:

```text
Commit       = 1 point
Code review  = 3 points
Pull request = 5 points
Star received = 10 points
```

These values are placeholders and must be configurable.

A possible initial satellite progression:

```text
0-49 points       -> 1 satellite
50-149 points     -> 2 satellites
150-299 points    -> 3 satellites
300-499 points    -> 4 satellites
500-749 points    -> 5 satellites
750-999 points    -> 6 satellites
1000+             -> continue progressively
```

Do not hardcode this exact progression into the architecture.

The progression system should be easy to tune later.

---

# 6. Maximum satellite count

The constellation must never become unreadable.

Recommended maximum visible satellites:

```text
20-30 satellites
```

After reaching the maximum satellite count, additional activity should improve existing satellites rather than continuously adding more.

Possible progression:

```text
more satellites
        |
        v
more orbital layers
        |
        v
better satellites
        |
        v
richer animations
```

This ensures the visual remains readable even for highly active GitHub users.

---

# 7. Satellite evolution

Satellites should have several visual tiers.

## Tier 1 - Basic CubeSat

Very small satellite.

Features:

- cube body
- two small solar panels
- antenna
- one small LED

Example:

```text
[==]-[ ]-[==]
```

---

## Tier 2 - Improved satellite

Features:

- larger solar panels
- stronger antenna
- additional lights
- slightly larger body

Example:

```text
[====]-[  ]-[====]
          |
          *
```

---

## Tier 3 - Advanced satellite

Features:

- communication dish
- propulsion module
- extra sensors
- larger solar arrays
- multiple lights

Example:

```text
          /
        ( )
         |
[====]-[====]-[====]
         |
        (o)
```

---

## Tier 4 - Rare / elite satellite

Should still look like the same satellite family.

Do not turn it into a spaceship or space station.

Possible additions:

- four solar panels
- large communication dish
- brighter signal
- rare accent color
- small propulsion trail
- unique antenna configuration

The evolution must remain visually coherent.

---

# 8. Orbital layers

Satellites should be distributed across several orbital rings.

Possible progression:

```text
Orbit 1
Orbit 2
Orbit 3
Orbit 4
```

The user should start with one orbit.

Additional orbital layers appear as the profile becomes more active.

Example:

```text
               satellite
        .-------------------.
    satellite             satellite

           .---------.
       satellite   satellite
             Earth

           '---------'

    satellite             satellite
        '-------------------'
```

Orbit lines should remain subtle.

They can be:

- faint pixel lines
- dotted orbital paths
- partially visible arcs

Avoid bright geometric circles dominating the composition.

---

# 9. Meaning of each GitHub metric

Different GitHub actions should influence different visual aspects.

This is important.

Do not make every metric simply add satellites.

---

## Commits

Commits are the main progression metric.

They contribute toward:

- satellite count
- general constellation growth

They should represent regular activity.

---

## Pull requests

Pull requests represent larger contributions.

They contribute more points than commits.

They can also influence satellite upgrades.

For example:

```text
many PRs -> more advanced satellite modules
```

---

## Code reviews

Reviews represent collaboration.

They should influence communication between satellites.

Possible effects:

```text
satellite ....... satellite
```

Animated tiny pixels can occasionally travel between satellites.

This represents communication inside the network.

Do not make these links permanently visible everywhere.

They should be subtle and occasional.

---

# 10. GitHub stars

GitHub stars should NOT generate normal satellites.

A GitHub star should become a literal star in space.

Example:

```text
     *              +

            satellite

        .-----------.
      satellite Earth satellite
        '-----------'

  +                         *
```

The number of stars received by the user's repositories should influence the background sky.

Possible mapping:

```text
few stars -> sparse background

many stars -> richer star field

very popular project -> a few brighter stars
```

Do not render thousands of stars individually.

Use thresholds and density levels.

Example:

```text
0 stars
10 stars
50 stars
100 stars
500 stars
1000+ stars
```

Each threshold increases sky richness.

---

# 11. Contribution streak

Streaks should not create satellites.

They represent energy and activity.

Possible effects:

- brighter satellite LEDs
- occasional radio signals
- subtle orbital glow
- slightly faster satellite movement
- communication pulse

Example:

```text
      )))
   satellite
```

The effect should remain subtle.

Do not turn streaks into a huge flame icon.

---

# 12. Inactivity

Never punish the user visually.

Satellites should not disappear because the user stops committing.

The constellation represents accumulated progress.

Inactivity can optionally affect temporary animation:

- slower movement
- fewer communication signals
- dimmer LEDs

But permanent achievements remain visible.

---

# 13. Animation

The output should feel alive.

Animations should remain slow and relaxing.

Possible animations:

### Satellites

Slow orbital movement.

Different orbital rings may use different speeds.

---

### Earth

Very slow rotation.

---

### Stars

Occasional subtle twinkle.

---

### Satellite LEDs

Very small blinking animation.

---

### Communications

Small signal pulses occasionally travel between satellites.

---

### Radio antenna

Occasional small radio wave.

Example:

```text
      )))
    satellite
```

Avoid excessive movement.

The README should not look like a flashing gaming banner.

---

# 14. Output format

The project should eventually support embedding inside a GitHub README.

Ideal usage:

```md
![git-orbit](GENERATED_URL)
```

Potential output formats:

- SVG preferred
- animated SVG if GitHub compatibility allows it
- fallback static SVG
- optional GIF if required

SVG should be preferred because:

- scales cleanly
- works well inside README files
- can be generated dynamically
- supports reusable pixel-art assets
- keeps output lightweight

Research GitHub README restrictions before relying on SVG animation techniques.

---

# 15. Expected user experience

A user should ideally be able to add something similar to:

```md
![Git Orbit](https://example.com/api/orbit?username=octocat)
```

The service:

1. receives the GitHub username
2. retrieves GitHub activity
3. calculates progression
4. builds the orbital scene
5. renders the image
6. returns the generated SVG

The user should not need to manually regenerate the image.

---

# 16. Architecture

Keep the architecture simple initially.

Possible high-level flow:

```text
GitHub API
    |
    v
Data Collector
    |
    v
GitHub Activity Model
    |
    v
Progression Engine
    |
    v
Scene Generator
    |
    v
SVG Renderer
    |
    v
README Image
```

Do not overengineer the first version.

---

# 17. GitHub data model

Create a clean internal data structure independent of GitHub's raw API responses.

Example:

```ts
type GitHubActivity = {
  commits: number
  pullRequests: number
  reviews: number
  starsReceived: number
  accountAgeDays: number
  currentStreak?: number
}
```

The rendering engine should never depend directly on GitHub API response structures.

---

# 18. Progression model

Convert GitHub activity into a visual state.

Example:

```ts
type OrbitState = {
  score: number

  satelliteCount: number
  satelliteTier: number

  orbitCount: number

  starDensity: number

  communicationLevel: number

  activityLevel: number
}
```

Pipeline:

```text
GitHubActivity
      |
      v
calculateOrbitState()
      |
      v
OrbitState
      |
      v
renderScene()
```

This separation is important.

It allows the scoring system to evolve without rewriting the renderer.

---

# 19. Satellite asset system

Satellites should be created from reusable pixel-art assets.

Do not create one giant hardcoded SVG.

Recommended structure:

```text
assets/
  earth/
    earth.svg

  satellites/
    tier-1.svg
    tier-2.svg
    tier-3.svg
    tier-4.svg

  effects/
    signal.svg
    star.svg
```

If necessary, create the pixel assets using SVG rectangles aligned to a grid.

Avoid anti-aliased shapes when possible.

Pixel art should remain crisp.

Suggested SVG property:

```css
image-rendering: pixelated;
```

---

# 20. Procedural satellite variation

Satellites should not all be perfect copies.

Create small variations while keeping the same visual family.

Possible differences:

- antenna position
- solar panel shape
- LED color
- small sensor
- orientation
- communication dish
- propulsion module

Use deterministic generation.

The same user should always receive the same constellation configuration for the same activity state.

Possible seed:

```text
GitHub username
```

For example:

```text
seed = hash(username)
```

This seed determines:

- satellite variants
- initial orbital positions
- star positions
- small visual details

The scene should not randomly change every request.

---

# 21. Orbit generation

Each satellite needs:

```ts
type Satellite = {
  id: number
  orbitIndex: number
  angle: number
  speed: number
  tier: number
  variant: number
}
```

Satellite positions can be computed using basic ellipse math.

Example:

```text
x = centerX + cos(angle) * radiusX
y = centerY + sin(angle) * radiusY
```

Use elliptical orbits instead of perfectly circular ones if it improves visual depth.

---

# 22. Depth

Satellites should appear to move around Earth rather than on top of a flat diagram.

Possible technique:

```text
satellite behind Earth
        |
        v
Earth
        |
        v
satellite in front of Earth
```

When the satellite is on the upper half of the orbit:

```text
render behind Earth
```

When on the lower half:

```text
render in front of Earth
```

This simple depth trick should make the scene much more convincing.

---

# 23. Canvas size

The image should be designed specifically for GitHub README display.

Initial target:

```text
800 x 400
```

or similar wide ratio.

The Earth should occupy approximately the central third of the scene.

Do not make the canvas extremely tall.

The image must remain readable when displayed inside a GitHub profile.

---

# 24. Dark and light GitHub themes

The scene should work on both GitHub themes.

Prefer transparent background.

Example:

```text
background = transparent
```

The space area can use very dark blue / purple pixels around the central composition if necessary.

Avoid relying on GitHub's background color.

Test on:

- GitHub dark theme
- GitHub light theme

---

# 25. Colors

Keep the palette deliberately limited.

Suggested families:

```text
space
#050816
#090d20
#111936

satellite metal
#d9e1f2
#aab7cf
#66738e

solar panels
#173a8f
#2459c4
#3478e5

lights
#56f0ff
#ffd84d

Earth
blue
green
white
```

These values are only starting points.

The final pixel-art palette should remain small and consistent.

---

# 26. MVP

Do not attempt the entire system immediately.

## MVP 1

Build only:

- static Earth
- one orbit
- 1-8 satellites
- deterministic positions
- simple pixel-art satellite
- GitHub username input
- commit count
- generated SVG

Goal:

```text
GitHub username -> constellation SVG
```

---

## MVP 2

Add:

- multiple orbital rings
- satellite progression
- pull requests
- reviews
- stars in background

---

## MVP 3

Add:

- animations
- communication effects
- streak effects
- satellite variations
- improved Earth

---

## MVP 4

Add:

- public hosted endpoint
- caching
- rate-limit handling
- GitHub README embedding
- customization options

---

# 27. Customization

Customization should remain deliberately limited.

Possible parameters:

```text
username
theme
animation
```

Maybe later:

```text
density
earthStyle
satelliteStyle
```

Do not create dozens of configuration options.

The project should have a recognizable visual identity.

---

# 28. Performance

The generated asset must remain lightweight.

Avoid:

- huge SVG files
- hundreds of DOM elements per satellite
- excessive animations
- unnecessary JavaScript in generated output

Prefer reusable SVG symbols when possible.

Example:

```svg
<symbol id="satellite-tier-1">
...
</symbol>
```

Then:

```svg
<use href="#satellite-tier-1" />
```

---

# 29. Caching

GitHub data does not need to be fetched every time the image is requested.

Eventually support caching.

Possible cache duration:

```text
15-60 minutes
```

This reduces:

- GitHub API usage
- response time
- rate-limit problems

Caching is not required for the first local MVP.

---

# 30. Error states

If the GitHub user does not exist:

Return a valid SVG with a small pixel-art error state.

Example:

```text
       ?

     Earth

No signal
```

Do not return a broken image.

If GitHub's API is temporarily unavailable:

return the last cached constellation when possible.

---

# 31. Repository structure

Suggested initial structure:

```text
git-orbit/
|
|-- README.md
|
|-- src/
|   |-- github/
|   |   |-- client.ts
|   |   |-- activity.ts
|   |
|   |-- progression/
|   |   |-- score.ts
|   |   |-- orbit-state.ts
|   |
|   |-- renderer/
|   |   |-- scene.ts
|   |   |-- earth.ts
|   |   |-- satellite.ts
|   |   |-- orbit.ts
|   |   |-- stars.ts
|   |
|   |-- utils/
|       |-- seed.ts
|       |-- math.ts
|
|-- assets/
|   |-- satellites/
|   |-- earth/
|   |-- effects/
|
|-- tests/
|
|-- examples/
```

Adapt this structure if the chosen stack suggests something simpler.

Do not introduce architecture layers that are unnecessary for the current phase.

---

# 32. Testing

The progression engine should be easy to test.

Example test cases:

```text
new user
low activity user
active user
very active user
extreme activity user
popular repository owner
user with many reviews
user with no stars
```

Test invariants:

```text
satelliteCount <= MAX_SATELLITES

orbitCount <= MAX_ORBITS

same input -> same constellation

higher score must never reduce permanent progression
```

Also test that extreme GitHub activity values do not break rendering.

---

# 33. Determinism

This is a core requirement.

Given:

```text
same username
same GitHub metrics
same project version
```

The generated constellation should be identical.

Do not use uncontrolled `Math.random()` inside the renderer.

Use a seeded pseudo-random generator.

---

# 34. What git-orbit is NOT

It is not:

- a GitHub analytics dashboard
- a productivity score
- a developer ranking system
- a Kubernetes visualization
- a monitoring dashboard
- a resume generator
- a contribution heatmap replacement

It is a visual representation of someone's GitHub journey.

---

# 35. Emotional goal

When someone sees their constellation for the first time, the reaction should be:

> "That's my GitHub activity turned into a tiny space world."

Not:

> "Here are my GitHub statistics again."

The constellation should create attachment.

Users should want to see it grow.

---

# 36. Design rule

When deciding whether to add a feature, ask:

> Does this make the constellation feel more alive?

If yes, consider it.

If the feature only adds more information, metrics or labels, probably reject it.

---

# 37. Initial development objective

The first target is NOT production deployment.

The first target is:

```text
Input:
GitHub username

Output:
A deterministic pixel-art SVG containing:

- Earth
- orbital path
- satellites
- stars
```

Example CLI:

```bash
git-orbit octocat > orbit.svg
```

or:

```bash
npm run generate -- octocat
```

depending on the chosen implementation.

The CLI should make iteration on the renderer easy before building a hosted service.

---

# 38. First implementation task

Start by implementing the visual engine with mock data.

Do not begin with GitHub API integration.

Use:

```ts
const mockActivity = {
  commits: 800,
  pullRequests: 50,
  reviews: 120,
  starsReceived: 75,
  accountAgeDays: 1800,
  currentStreak: 12,
}
```

Build:

```text
mockActivity
    |
    v
OrbitState
    |
    v
SVG
```

Once the visual output is convincing, connect the GitHub API.

The visual identity is the product.

A technically perfect GitHub API integration with an ugly renderer is not useful.

---

# 39. Development philosophy

Keep commits small.

Do not have coding agents implement the entire project in one pass.

Each meaningful step should remain understandable and reviewable.

Recommended order:

```text
1. repository skeleton
2. OrbitState model
3. deterministic seed
4. Earth renderer
5. basic satellite asset
6. orbital positioning
7. multiple satellites
8. stars
9. progression engine
10. snapshot tests
11. GitHub API integration
12. animation
13. hosted endpoint
```

After each major visual milestone, generate example SVG files under:

```text
examples/
```

so changes can be reviewed visually.

---

# 40. Agent instructions

When working on this repository:

- read this README before implementing features
- preserve the pixel-art identity
- prefer simple architecture
- do not add dependencies without a clear reason
- do not add dashboards or statistics cards
- do not replace the custom renderer with a charting library
- do not overengineer before the visual MVP works
- add tests for progression logic
- keep generated scenes deterministic
- generate visual examples after renderer changes
- make small commits with meaningful messages
- update this README when major architectural decisions change

If an implementation decision conflicts with the core product vision:

```text
the visual identity wins
```

---

# 41. Success criteria

The MVP is successful when someone can run:

```bash
git-orbit <github-username>
```

and receive a clean pixel-art image that:

- clearly contains Earth
- contains a meaningful number of satellites
- feels visually balanced
- is deterministic
- is readable at GitHub README size
- feels alive without being visually noisy
- looks good enough that someone would voluntarily add it to their profile

Only after reaching this quality bar should the project focus on hosting, optimization and advanced statistics.

---

# 42. Final vision

A new GitHub user sees:

```text
              satellite

                 Earth
```

Months later:

```text
                *
                     satellite

          .---------------------.
      satellite             satellite

             .---------.
         satellite Earth satellite
             '---------'

      satellite             satellite
          '---------------------'

   *                             +
```

Years later, the same profile has become a rich but readable orbital ecosystem.

The constellation becomes a visual record of the developer's journey.

That is `git-orbit`.
