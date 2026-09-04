# Pixel Plumber

A tiny 5-level side-scrolling platformer, built with plain HTML5 Canvas and JavaScript — no framework, no build step.

**[Play it live →](https://pixel-plumber.vercel.app)**

## About

Run, jump, stomp goombas, grab coins, and reach the flag across 5 levels of increasing difficulty. Enemy count and patrol speed ramp up each level, from level 1 (5 enemies) through level 5 (10 enemies, fastest patrol speed).

Every level is defined as data — a chain of ground lengths and pit widths — rather than hand-placed pixel coordinates, and was verified completable end-to-end with an automated playtest bot before shipping.

## Controls

| Key | Action |
|---|---|
| `←` / `→` or `A` / `D` | Move |
| `Space` / `↑` / `W` | Jump |

## Tech

- Vanilla HTML5 Canvas + JavaScript (`game.js`)
- `artifact.html` — self-contained single-file build with the full arcade-cabinet UI (glowing marquee, scoreboard, CRT scanlines) used for the live deploy
- Deployed on [Vercel](https://pixel-plumber.vercel.app)

## Files

- `index.html`, `style.css`, `game.js` — original multi-file dev version
- `artifact.html` — the polished, single-file production build
- `devlog-article.html` — a write-up of the build process, the collision bugs found along the way, and how they were caught

## Credits

Built with [Claude Code](https://claude.com/claude-code). Original character and branding — not affiliated with Nintendo or the Mario franchise.
