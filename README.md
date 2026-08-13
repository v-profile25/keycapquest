# keycapquest
Keycap Quest: a typing game

A single-page typing tutor game for kids. Players create a profile, work
through 12 keyboard "worlds" (home row, top row, bottom row, numbers, sight
words, punctuation, sentences...), each with a Practice / Skirmish / Boss
Fight progression, earn gold and gear from boss fights, and customize their
character with hats, companions, and auras.

## Running it

It's a single static file with no build step or dependencies.

```
open index.html
```

or serve it locally:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000/index.html`.

## Testing

A small Playwright smoke suite lives in `tests/` (dev-only -- the game
itself still has zero dependencies). It drives the app through the DOM
like a real player, plus direct `localStorage` seeding for fixtures like
gold/gems/boss-clears.

```
npm install
npm test
```
