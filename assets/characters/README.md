# Character art

Painted evolution art for player avatars. Each avatar has its own folder
(named by slug, see `AVATAR_SLUGS` in `index.html`) containing 10 images,
one per growth tier:

```
assets/characters/<slug>/tier-1.webp   (tier 1 of 10)
assets/characters/<slug>/tier-2.webp
...
assets/characters/<slug>/tier-10.webp  (tier 10 of 10, max)
```

Current slugs: `fox`, `tiger`, `panda`, `lion`, `frog`, `monkey`,
`unicorn`, `koala`, `dog`, `cat`, `rabbit`, `bear`.

Source images can be generated at any size/format (square, plain/neutral
background, no baked-in text or watermarks -- the game overlays tier info
itself), but get resized to 512x512 and converted to WebP before landing
here -- the portrait only ever displays at up to ~150px, so a full-size
PNG straight from an image generator is 40-50x larger than it needs to be
for zero visible quality difference (the dog line went from 24MB to
~0.5MB this way).

A missing file just falls back to the emoji portrait, so avatars can be
illustrated one at a time. Once a `tier-N.webp` file exists here, it still
needs a matching entry added to the `CHARACTER_ART` manifest in
`index.html` before it'll actually show up in-game.
