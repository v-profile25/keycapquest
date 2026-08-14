const assert = require('assert');
const { freshProfile, seedPlayer, clearedThrough } = require('./helpers');

module.exports = function (test) {
  test('battle items can be bought, brought into a boss fight, and Second Wind revives a loss', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'ConsTest');
    await seedPlayer(page, { gold: 5000, gems: 500, subProgress: clearedThrough(1) });

    await page.click('#btnCharacter');
    await page.waitForTimeout(200);
    for (let i = 1; i <= 4; i++) {
      await page.click(`#shopConsumables .shop-item:nth-child(${i})`);
      await page.waitForTimeout(80);
    }
    const consAfterBuy = await page.evaluate(() => Array.from(document.querySelectorAll('#shopConsumables .shop-item')).map((c) => c.textContent));
    assert.ok(consAfterBuy.every((c) => /own 1/.test(c)), 'each consumable should show 1 owned after buying one of each');

    await page.click('#btnCharBack');
    await page.click('.node');
    await page.click('.stage-card:nth-child(3)'); // boss
    await page.waitForTimeout(200);

    const pvCards = await page.evaluate(() => Array.from(document.querySelectorAll('#pvConsumablesGrid .shop-item')).map((c) => c.textContent));
    const reviveIdx = pvCards.findIndex((t) => t.includes('Second Wind'));
    assert.notStrictEqual(reviveIdx, -1, 'Second Wind should be selectable from the boss preview');
    await page.click(`#pvConsumablesGrid .shop-item:nth-child(${reviveIdx + 1})`);
    await page.waitForTimeout(120);

    await page.click('#btnStartLevel');
    await page.waitForTimeout(200);
    const activeRow = await page.evaluate(() => document.getElementById('activeConsumablesRow').textContent);
    assert.match(activeRow, /Second Wind/, 'the fight should show the active consumable badge');

    // Deliberately lose by mashing a wrong key. A wrong keystroke only ever
    // *decreases* tug directly, so any increase right after one is
    // unambiguous proof the revive fired (nothing else could raise it).
    let sawReviveJump = false;
    const readLeft = () => page.evaluate(() => {
      var m = document.getElementById('tugMarker');
      return m ? parseFloat(m.style.left) : null;
    });
    for (let i = 0; i < 150; i++) {
      const overlayActive = await page.evaluate(() => document.getElementById('overlayResult').classList.contains('active'));
      if (overlayActive) break;
      const before = await readLeft();
      await page.keyboard.press('1');
      await page.waitForTimeout(20);
      const after = await readLeft();
      if (before != null && after != null && after > before + 10) sawReviveJump = true;
    }
    assert.ok(sawReviveJump, 'tug should jump back up once when Second Wind revives the fight');
    const finalOverlay = await page.evaluate(() => document.getElementById('overlayResult').classList.contains('active'));
    assert.ok(finalOverlay, 'after the single revive is spent, a second loss should end the fight for real');

    await page.click('#btnResultMap');
    await page.click('#btnCharacter');
    await page.waitForTimeout(200);
    const consAfterFight = await page.evaluate(() => Array.from(document.querySelectorAll('#shopConsumables .shop-item')).map((c) => c.textContent));
    const revivedCard = consAfterFight.find((c) => c.includes('Second Wind'));
    assert.ok(!/own/.test(revivedCard), 'Second Wind should be fully consumed after saving the fight once');
    const others = consAfterFight.filter((c) => !c.includes('Second Wind'));
    assert.ok(others.every((c) => /own 1/.test(c)), 'the other 3 unused consumables should be untouched');
  });
};
