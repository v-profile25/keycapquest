// Shared helpers for the smoke-test suite. index.html keeps everything
// inside one closure (nothing lands on `window`), so tests drive the app
// through the DOM like a real player would, and reach into localStorage
// directly to seed fixtures (gold/gems/boss-clears) instead of grinding
// through the UI for state that isn't the thing under test.
const STORAGE_KEY = 'keycapQuest.v3';

async function freshProfile(page, baseUrl, name) {
  await page.goto(baseUrl + '/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('.profile-card.new');
  await page.fill('#newName', name);
  await page.click('#btnCreate');
  await page.waitForTimeout(250);
  await page.click('#btnTutorialClose').catch(() => {});
  await page.waitForTimeout(150);
}

// Merges `overrides` onto players[0] and reloads so the app picks it up.
// Pass e.g. { gold: 5000, gems: 500 } or a subProgress patch.
async function seedPlayer(page, patch) {
  await page.evaluate(({ KEY, patch }) => {
    var data = JSON.parse(localStorage.getItem(KEY));
    var p = data.players[0];
    Object.keys(patch).forEach(function(k) {
      if (k === 'subProgress') {
        p.subProgress = p.subProgress || {};
        Object.keys(patch.subProgress).forEach(function(worldId) {
          p.subProgress[worldId] = p.subProgress[worldId] || {};
          Object.assign(p.subProgress[worldId], patch.subProgress[worldId]);
        });
      } else {
        p[k] = patch[k];
      }
    });
    localStorage.setItem(KEY, JSON.stringify(data));
  }, { KEY: STORAGE_KEY, patch });
  await page.reload();
  await page.waitForTimeout(250);
}

function passedEntry() {
  return { stars: 3, bestWpm: 30, bestAcc: 100, attempts: 1, passed: true, timesCleared: 1 };
}

// Marks worlds 1..n's practice/skirmish/boss all passed, so those worlds'
// stages and any boss-gated unlocks tied to them are reachable.
function clearedThrough(n) {
  var sub = {};
  for (var w = 1; w <= n; w++) sub[w] = { practice: passedEntry(), skirmish: passedEntry(), boss: passedEntry() };
  return sub;
}

async function readTypedText(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('#typeBox .ch'))
      .map(s => s.classList.contains('space') ? ' ' : s.textContent)
      .join('');
  });
}

// Types the current level's text correctly, start to finish.
async function typeCurrentTextCorrectly(page) {
  const text = await readTypedText(page);
  for (const ch of text) await page.keyboard.press(ch === ' ' ? 'Space' : ch);
  await page.waitForTimeout(150);
  return text;
}

async function tugMarkerLeft(page) {
  return page.evaluate(() => {
    var m = document.getElementById('tugMarker');
    return m ? parseFloat(m.style.left) : null;
  });
}

module.exports = {
  STORAGE_KEY,
  freshProfile,
  seedPlayer,
  passedEntry,
  clearedThrough,
  readTypedText,
  typeCurrentTextCorrectly,
  tugMarkerLeft,
};
