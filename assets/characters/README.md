# Character art

Painted evolution art for player avatars. Each avatar has its own folder
(named by slug, see `AVATAR_SLUGS` in `index.html`) containing 10 images,
one per growth tier:

```
assets/characters/<slug>/tier-1.png   (tier 1 of 10)
assets/characters/<slug>/tier-2.png
...
assets/characters/<slug>/tier-10.png  (tier 10 of 10, max)
```

Current slugs: `fox`, `tiger`, `panda`, `lion`, `frog`, `monkey`,
`unicorn`, `koala`, `dog`, `cat`, `rabbit`, `bear`.

Specs: square image (1024x1024 recommended), plain/neutral background,
no baked-in text or watermarks -- the game overlays tier info itself.

A missing file just falls back to the emoji portrait, so avatars can be
illustrated one at a time. Once a `tier-N.png` file exists here, it still
needs a matching entry added to the `CHARACTER_ART` manifest in
`index.html` before it'll actually show up in-game.
