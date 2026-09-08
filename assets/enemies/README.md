# Enemy art

Painted portraits for every fixed-identity enemy in the game: the 12
bosses and 12 mini-bosses of the hand-built intro arc (World 1-12), the
campaign's true final boss (The Keymaster, World 100), the 12 creature
species reused across worlds 13-100, and the two Mary Poppins bonus-round
enemies. Each file is named after its identifier:

```
assets/enemies/sergeant_steady.webp
assets/enemies/wobble_bot.webp
assets/enemies/griffin.webp
assets/enemies/keymaster.webp
assets/enemies/poppins_nanny.webp
...
```

Two lookup paths land on these files, both in `index.html`:

- `ENEMY_ART` maps a fixed enemy's exact in-game `name` (e.g. `"Sergeant
  Steady"`, `"The Keymaster"`) to its art file. This covers every enemy
  with a unique, unchanging name.
- Worlds 13-100's enemies are procedurally combined by `proceduralEnemy()`
  -- an adjective (`ARC_ADJ`) plus a creature species (`ARC_CREATURE`), so
  the *name* isn't unique (e.g. many different worlds produce a "Storm
  Griffin"). Those enemies carry their art directly on an `.art` field
  instead, pointing at one portrait per species (`CREATURE_ART`) reused
  across every adjective variant -- there's no separate art for each of
  the 144 adjective x species combinations, just the 12 base species.

`enemyArtFor(enemyDef)` checks `.art` first, then falls back to the
`ENEMY_ART` name lookup. Either way, a missing entry just falls back to
the enemy's emoji, same convention as `assets/characters/`.

Source images can be generated at any size (square, transparent or plain
background, no baked-in text -- the game overlays the enemy's name
itself), but get resized to 512x512 and converted to WebP before landing
here, same as character art.
