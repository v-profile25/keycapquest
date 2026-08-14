const assert = require('assert');
const { freshProfile, seedPlayer, clearedThrough } = require('./helpers');

module.exports = function (test) {
  test('cosmetics/food unlock progressively and recruiting spends gold+gems', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'ProgTest');
    // Worlds 1, 2 and 5 cleared -- world 4 and 6 stay locked, so their
    // gated items should too.
    const sub = Object.assign({}, clearedThrough(2));
    sub[5] = { practice: { passed: true }, skirmish: { passed: true }, boss: { passed: true } };
    await seedPlayer(page, { gold: 5000, gems: 500, subProgress: sub });

    await page.click('#btnCharacter');
    await page.waitForTimeout(200);

    const hatCards = await page.evaluate(() => Array.from(document.querySelectorAll('#shopHats .shop-item')).map((c) => c.textContent));
    assert.match(hatCards[0], /Cap🪙 15/, 'first hat is free from the start');
    assert.match(hatCards[1], /Party Hat🪙 25/, 'unlockWorld:2 hat should be purchasable once world 2 is cleared');
    assert.match(hatCards[2], /Hard Hat🔒 World 4/, 'unlockWorld:4 hat should stay locked with a world-number label');

    const foodCards = await page.evaluate(() => Array.from(document.querySelectorAll('#shopFood .shop-item')).map((c) => c.textContent));
    assert.match(foodCards[1], /Apple🔒 World 3/);

    const titleCards = await page.evaluate(() => Array.from(document.querySelectorAll('#shopTitles .shop-item')).map((c) => c.textContent));
    assert.ok(titleCards.every((t) => /🔒/.test(t)), 'titles gate on badges, and no badges are earned yet');

    // Companion HP bonus folds into combat power once equipped.
    const hpBefore = await page.evaluate(() => document.getElementById('powerHp').textContent);
    assert.strictEqual(hpBefore, '5');
    await page.click('#shopCompanions .shop-item:nth-child(2)'); // Butterfly, unlockWorld:2, hpBonus:1
    await page.waitForTimeout(150);
    const hpAfter = await page.evaluate(() => document.getElementById('powerHp').textContent);
    assert.strictEqual(hpAfter, '6', 'equipping a +1 HP companion should raise displayed combat power by 1');

    // Recruiting costs gold AND gems, and both prices scale with roster size.
    const rosterCard = await page.evaluate(() => document.querySelector('#rosterGrid .shop-item:last-child').textContent);
    assert.match(rosterCard, /🪙 100 · 💎 5/);
    const goldBefore = await page.evaluate(() => (JSON.parse(localStorage.getItem('keycapQuest.v3')).players[0].gold));
    const gemsBefore = await page.evaluate(() => (JSON.parse(localStorage.getItem('keycapQuest.v3')).players[0].gems));
    await page.click('#rosterGrid .shop-item:last-child');
    await page.waitForTimeout(150);
    await page.click('#recruitAvatarSwatches .swatch-av:not(.locked)'); // world-5-unlocked rabbit
    await page.click('#btnDoRecruit');
    await page.waitForTimeout(250);
    const goldAfter = await page.evaluate(() => (JSON.parse(localStorage.getItem('keycapQuest.v3')).players[0].gold));
    const gemsAfter = await page.evaluate(() => (JSON.parse(localStorage.getItem('keycapQuest.v3')).players[0].gems));
    assert.strictEqual(goldBefore - goldAfter, 100, 'recruit should deduct 100 gold at roster size 1');
    assert.strictEqual(gemsBefore - gemsAfter, 5, 'recruit should deduct 5 gems at roster size 1');
    const rosterSize = await page.evaluate(() => document.querySelectorAll('#rosterGrid .shop-item').length);
    assert.strictEqual(rosterSize, 3, '2 characters + 1 recruit card after recruiting');
  });
};
