# Companion art

Painted portraits for the companion cosmetics (see `COMPANIONS` in
`index.html`). Unlike character evolution art, companions don't have
growth tiers -- each one is a single image:

```
assets/companions/<id>.webp
```

Valid ids (12 companions): `chick`, `butterfly`, `fish`, `turtle`, `bee`,
`fox`, `owl`, `penguin`, `unicorn`, `octopus`, `ghost`, `dragon`.

Same pipeline as character art: generate at any size (square, transparent
or plain background, no baked-in text/watermarks), then resize to 512x512
and convert to WebP before landing here. A missing file falls back to a
large emoji, so companions can be illustrated one at a time. Once a
`<id>.webp` file exists here, it still needs an entry added to the
`COMPANION_ART` manifest in `index.html` before it shows up in-game.

Companion art shows up larger than character art ever does at once --
the Character screen's companion showcase panel displays it at 96x96 in
one shot (character portraits scale from tiny badges up to a 340px hero
image, but always start small). Keep the subject centered and readable
at that size: no fine detail that only reads at a bigger scale.
