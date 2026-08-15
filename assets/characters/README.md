# Character art

Painted evolution art for player avatars. Each avatar has its own folder
(named by slug, see `AVATAR_SLUGS` in `index.html`) containing:

```
assets/characters/<slug>/tier-1.webp            (shared "youngster" phase, tiers 1-5)
assets/characters/<slug>/tier-2.webp
...
assets/characters/<slug>/tier-5.webp

assets/characters/<slug>/tier-6-radiant.webp     (tier 6+, one file per evolution path)
assets/characters/<slug>/tier-6-valiant.webp
assets/characters/<slug>/tier-6-ferocious.webp
...
assets/characters/<slug>/tier-10-radiant.webp    (tier 10 of 10, max)
assets/characters/<slug>/tier-10-valiant.webp
assets/characters/<slug>/tier-10-ferocious.webp
```

Tiers 1-5 are shared by every player of that avatar. At tier 6 the player
picks one of the three `EVOLUTION_PATHS` in `index.html` -- `cute`
(display name "Radiant"), `mythic` ("Valiant"), or `ferocious`
("Ferocious") -- and tiers 6-10 are illustrated per path, suffixed by
path name (`-radiant`/`-valiant`/`-ferocious`) so all three can coexist.
A path with no art for a given avatar just falls back to the emoji
portrait for players on that path -- avatars don't need all three
illustrated to ship.

The `CHARACTER_ART` manifest entry in `index.html` records which files
exist for a given avatar (`base` = tiers 1-5, then `cute`/`mythic`/
`ferocious` arrays for 6-10, built via the `pathArt(slug, path)` helper
which assumes the `tier-N-<path>.webp` naming above):

```js
fox:{
  base: [...tier-1.webp...tier-5.webp],
  cute: pathArt('fox','radiant'),
  mythic: pathArt('fox','valiant'),
  ferocious: pathArt('fox','ferocious')
}
```

Valid slugs (all 12 avatars): `fox`, `tiger`, `panda`, `lion`, `frog`,
`snake`, `unicorn`, `koala`, `dog`, `cat`, `rabbit`, `bear`. Currently
illustrated: `dog`, `fox`, `cat`, all three with all three paths for
tiers 6-10. The rest fall back to emoji portraits until art is added.

Source images can be generated at any size/format (square, transparent or
plain/neutral background, no baked-in text or watermarks -- the game
overlays tier info itself), but get resized to 512x512 and converted to
WebP before landing here -- the portrait only ever displays at up to
~150px, so a full-size PNG straight from an image generator is 40-50x
larger than it needs to be for zero visible quality difference (the dog
and fox lines went from tens of MB of source PNGs to under 1MB each this
way).

A missing file just falls back to the emoji portrait, so avatars (and
individual paths within an avatar) can be illustrated one at a time. Once
a `tier-N-<path>.webp` file exists here, it still needs a matching entry
in the `CHARACTER_ART` manifest in `index.html` before it'll actually
show up in-game.

If art gets uploaded straight into `assets/characters/` (e.g. via the
GitHub web UI, which can't create a new folder on upload), it needs to be
moved into `assets/characters/<slug>/` and renamed to `tier-N-<path>.webp`
before it does anything -- a file sitting in the parent folder, or one
missing its path suffix or `.webp` extension, isn't picked up by
`CHARACTER_ART` regardless of its contents.
