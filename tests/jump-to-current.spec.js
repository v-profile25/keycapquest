const assert = require('assert');
const { freshProfile, seedPlayer, clearedThrough } = require('./helpers');

module.exports = function (test) {
  test('Jump to Current Level scrolls to the first world whose boss is unbeaten', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'JumpTest');
    await seedPlayer(page, { subProgress: clearedThrough(30) });

    // World 31 is unlocked (world 30's boss is cleared) but not itself
    // cleared, so it's the frontier the button should jump to.
    const before = await page.evaluate(() => {
      var r = document.getElementById('node-31').getBoundingClientRect();
      return r.top >= 0 && r.top <= window.innerHeight;
    });
    assert.strictEqual(before, false, 'world 31 should start off-screen, far down the map');

    await page.click('#btnJumpCurrent');
    await page.waitForTimeout(900);

    const highlighted = await page.evaluate(() => document.getElementById('node-31').classList.contains('jump-highlight'));
    assert.ok(highlighted, 'world 31 node should get the jump-highlight pulse');

    const inView = await page.evaluate(() => {
      var r = document.getElementById('node-31').getBoundingClientRect();
      return r.top >= 0 && r.top <= window.innerHeight;
    });
    assert.ok(inView, 'world 31 node should be scrolled into view');
  });

  test('with everything cleared, it jumps to the final world', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'JumpTest2');
    await seedPlayer(page, { subProgress: clearedThrough(100) });

    await page.click('#btnJumpCurrent');
    await page.waitForTimeout(900);

    const inView = await page.evaluate(() => {
      var r = document.getElementById('node-100').getBoundingClientRect();
      return r.top >= 0 && r.top <= window.innerHeight;
    });
    assert.ok(inView, 'world 100 node should be scrolled into view when every world is cleared');
  });
};
