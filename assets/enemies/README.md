# Enemy art

Painted portraits for the boss/mini-boss enemies of the 12 hand-built
intro-arc worlds (World 1 through World 12). Each file is named after its
enemy's identifier used in the `ENEMY_ART` manifest in `index.html`:

```
assets/enemies/sergeant_steady.webp
assets/enemies/vocab_viper.webp
...
```

`ENEMY_ART` maps each enemy's exact in-game `name` (e.g. `"Sergeant
Steady"`) to its art file. A missing entry just falls back to the enemy's
emoji, same convention as `assets/characters/`.

Worlds 13-100 use `proceduralEnemy()` to combine an adjective (`ARC_ADJ`)
with a creature species (`ARC_CREATURE`) -- there's no fixed identity to
illustrate there (144 possible combinations from just 12 species), so
those stay emoji-only. If that ever gets illustrated, the sensible target
is the 12 base creature species, not every adjective combination.

Source images can be generated at any size (square, transparent or plain
background, no baked-in text -- the game overlays the enemy's name
itself), but get resized to 512x512 and converted to WebP before landing
here, same as character art.
