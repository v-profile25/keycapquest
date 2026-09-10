const assert = require('assert');
const { freshProfile, seedPlayer, clearedThrough, readTypedText } = require('./helpers');

// Regression test for a bug where skirmish HP loss per mistake scaled with
// worldPowerMult() (same formula used for the boss's tug-of-war penalty and
// for skirmish enemy HP), so late-game skirmishes cost 2+ hearts per miss
// instead of the flat 1 the 5-heart skirmish meter is designed around.
module.exports = function (test) {
  test('skirmish costs exactly 1 heart per mistake at a late world', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'HpTest');
    // World 76 (worldMult = 1 + 75*0.02 = 2.5) reproduces the bug: before the
    // fix, Math.round(2.5) = 3 hearts lost on a single mistake.
    await seedPlayer(page, { subProgress: clearedThrough(76) });

    await page.click('.node:has-text("WORLD 76")');
    await page.waitForTimeout(150);
    await page.click('.stage-card:nth-child(2)'); // skirmish
    await page.click('#btnStartLevel');
    await page.waitForTimeout(150);

    const heartsBefore = await page.evaluate(() => document.getElementById('playerHpRow').textContent);
    assert.strictEqual((heartsBefore.match(/❤️/g) || []).length, 5, 'skirmish should start at 5 hearts');

    const text = await readTypedText(page);
    const wrongKey = text[0] === 'a' ? 'b' : 'a';
    await page.keyboard.press(wrongKey);
    await page.waitForTimeout(100);

    const heartsAfter = await page.evaluate(() => document.getElementById('playerHpRow').textContent);
    const fullHeartsAfter = (heartsAfter.match(/❤️/g) || []).length;
    assert.strictEqual(fullHeartsAfter, 4, 'a single mistake should cost exactly 1 heart, regardless of world');
  });
};
