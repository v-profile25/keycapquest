const assert = require('assert');
const { freshProfile, seedPlayer, clearedThrough } = require('./helpers');

module.exports = function (test) {
  test('groups the 100 worlds into 9 themed landscape regions', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'MapTest');

    const regionNames = await page.evaluate(() => Array.from(document.querySelectorAll('.mrb-name')).map((n) => n.textContent));
    assert.deepStrictEqual(regionNames, [
      'Home Row Valley', 'Word Voyage', 'Word Odyssey', 'Sentence Sprint',
      'Comma Canyon', 'Quote Quarry', 'Story Springs', 'Paragraph Peaks', 'Keyboard Legends',
    ], 'the map should group all 100 worlds into exactly these 9 regions, in order');

    // Region wrappers carry their own accent color as a CSS custom property,
    // used to tint the connector line, banner text, and node borders.
    const firstAccent = await page.evaluate(() => document.querySelector('.map-region').style.getPropertyValue('--region-accent'));
    assert.ok(firstAccent, 'each region band should set --region-accent');

    // A fresh player has only world 1 unlocked, so every region is still
    // "upcoming" except the very first -- grayed out like locked nodes already are.
    const regionUpcoming = await page.evaluate(() => Array.from(document.querySelectorAll('.map-region')).map((r) => r.classList.contains('upcoming')));
    assert.deepStrictEqual(regionUpcoming, [false, true, true, true, true, true, true, true, true]);

    // Clicking a node still navigates to the World Detail screen -- the
    // region-grouping restructure shouldn't break that.
    await page.click('.node');
    await page.waitForTimeout(150);
    assert.strictEqual(await page.evaluate(() => document.querySelector('.screen.active').id), 'screen-world');
  });

  test('a region with progress is no longer grayed out as "upcoming"', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'MapTest2');
    await seedPlayer(page, { subProgress: clearedThrough(15) });

    const regionUpcoming = await page.evaluate(() => {
      var names = Array.from(document.querySelectorAll('.mrb-name')).map((n) => n.textContent);
      var upcoming = Array.from(document.querySelectorAll('.map-region')).map((r) => r.classList.contains('upcoming'));
      var byName = {};
      names.forEach((n, i) => { byName[n] = upcoming[i]; });
      return byName;
    });
    assert.strictEqual(regionUpcoming['Home Row Valley'], false);
    assert.strictEqual(regionUpcoming['Word Voyage'], false, 'world 13 is cleared, so Word Voyage should no longer be grayed out');
    assert.strictEqual(regionUpcoming['Word Odyssey'], true, 'world 24+ is still locked');
  });
};
