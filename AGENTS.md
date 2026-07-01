# Repository Guidelines

## Project Structure & Module Organization

This repository is a standalone browser game.

- `index.html` defines the page shell, HUD, overlays, controls, and external font links.
- `game.js` contains the canvas game engine, state, rendering, audio, skins, upgrades, and input handling.
- `style.css` contains layout, neon theme variables, HUD styling, overlays, animations, and responsive presentation.

Keep new assets close to the root unless the project grows; for multiple images, sounds, or data files, create folders such as `assets/images/` or `assets/audio/`.

## Build, Test, and Development Commands

There is currently no build step. Run the game as static files:

- `python3 -m http.server 8000` starts a local server at `http://localhost:8000`.
- `open index.html` opens the page directly in the default browser for quick checks.
- `git status` confirms your working tree before and after changes.

Prefer the local server so relative paths and browser APIs behave consistently.

## Coding Style & Naming Conventions

Use 4-space indentation in HTML, CSS, and JavaScript to match the existing files. Keep JavaScript constants in `UPPER_SNAKE_CASE`, state object fields in `camelCase`, and DOM ids/classes descriptive and hyphenated, for example `menu-overlay` or `score-val`.

Preserve the cyberpunk bilingual UI style where visible text pairs English command labels with Chinese descriptions. Keep comments useful and brief, especially in `game.js`.

## Testing Guidelines

No automated test framework is configured yet. Validate changes manually in a browser:

- Start `python3 -m http.server 8000`.
- Confirm menu navigation, story mode, endless mode, shop tabs, audio toggle, keyboard controls, mouse controls, and restart/game-over flows.
- Check browser DevTools for console errors.

If automated tests are added later, document the exact command here and place tests in a dedicated `tests/` directory.

## Commit & Pull Request Guidelines

Git history uses short conventional-style messages, such as `feat: ...`, `fix: ...`, `design: ...`, and `init`. Continue that pattern with imperative, scoped summaries: `fix: prevent paddle drift after mouse input`.

Pull requests should include a concise description, screenshots or short recordings for visual changes, manual test notes, and any linked issue. Call out gameplay balance changes separately so reviewers know what behavior to verify.

## Security & Configuration Tips

Do not commit generated browser storage, credentials, or local-only configuration. External resources are currently limited to Google Fonts in `index.html`; review any new third-party scripts carefully before adding them.

---

## 🎮 Game Features & Technical Reference (CYBER_BREAK)

**CYBER_BREAK** is a cyberpunk-themed breakout game using native HTML5 Canvas, Vanilla CSS, and Web Audio API.

### 1. Controls (操作指南)
- **Mouse / Touch**: Move paddle horizontally. Tap screen or click to launch the ball when attached.
- **Keyboard (A/D or Arrow keys)**: Move paddle left/right.
- **Space**: Launch the ball or fire dual vertical laser beams when `LASER_MOD` is active.

### 2. Power-up System (升级模组)
- **LASER_MOD** (Red 🔴): Double laser blasters. Destroy bricks above using Space.
- **SPLIT_CORE** (Gold 🟡): Instantly clone all balls on screen into three times their amount.
- **WIDE_LINK** (Blue 🔵): Increases paddle width to catch high-speed balls.
- **NET_SHIELD** (Green 🟢): High-energy safety net at screen bottom that bounces ball back once.
- **TIME_DILATION** (Purple 🟣): Temporarily slows down all balls for precise control.

### 3. Technical Implementation & Architecture (技术架构)
- **Procedural Audio (Web Audio API)**: Generates 115 BPM synth background music via raw `sawtooth` oscillators and lowpass filters. Collision sound FX (Cyan/Magenta/Yellow brick hits) and laser/explosions are procedurally synthesized using exponential ramp frequency sweeps and white noise decay.
- **Neon Particle System**: Generates custom colored (Cyan/Magenta/Yellow/Red) particle clusters on brick smash, shield impact, or damage. Features friction decay and alpha fade.
- **CRT Visual FX**: 平铺 4px CSS linear gradients to simulate CRT arcade monitor scanlines, radial vignette to darken corners, and Canvas translation shake on high-impact events.
- **Symmetric Procedural Levels (无尽关卡)**: Generate symmetric layout by mirroring left 5 columns. Adaptive difficulty scaling increases maximum rows (4 to 7) and armor/explosive brick ratios based on `state.level`.
