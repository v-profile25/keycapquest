const assert = require('assert');
const { freshProfile, seedPlayer } = require('./helpers');

module.exports = function (test) {
  test('shows a large companion showcase on the Character screen instead of only the tiny corner badge', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'CompTest');
    await seedPlayer(page, { gold: 5000, gems: 500 });

    await page.click('#btnCharacter');
    await page.waitForTimeout(200);

    assert.strictEqual(
      await page.evaluate(() => getComputedStyle(document.getElementById('companionShowcase')).display),
      'none',
      'showcase should be hidden with no companion equipped'
    );
    assert.strictEqual(
      await page.evaluate(() => !!document.querySelector('#charPortrait .portrait-companion')),
      false,
      'hero portrait should never show the tiny corner badge, equipped or not'
    );

    // Chick is free and unlocked from the very start, so buying/equipping it
    // needs no world-progress fixture (unlike the other 11 companions).
    await page.click('#shopCompanions .shop-item:nth-child(1)');
    await page.waitForTimeout(200);

    assert.strictEqual(
      await page.evaluate(() => getComputedStyle(document.getElementById('companionShowcase')).display),
      'flex',
      'showcase should appear once a companion is equipped'
    );
    assert.strictEqual(await page.evaluate(() => document.getElementById('companionShowcaseName').textContent), 'Chick');
    assert.match(
      await page.evaluate(() => document.getElementById('companionShowcaseBonus').textContent),
      /^\+1❤️ Max HP in battle$/
    );
    // No assets/companions/chick.webp yet, so it should fall back to the emoji.
    assert.strictEqual(await page.evaluate(() => document.getElementById('companionShowcaseArt').innerHTML), '🐤');
    assert.strictEqual(
      await page.evaluate(() => !!document.querySelector('#charPortrait .portrait-companion')),
      false,
      'hero portrait should still not show the tiny badge once equipped -- it moved to the showcase'
    );

    // The compact badge should still show up in tight spaces like the battle
    // arena, which is unaffected by the hero-portrait-only suppression.
    await seedPlayer(page, { subProgress: { 1: { practice: { passed: true }, skirmish: { passed: true } } } });
    await page.click('.node');
    await page.click('.stage-card:nth-child(3)');
    await page.click('#btnStartLevel');
    await page.waitForTimeout(200);
    assert.strictEqual(
      await page.evaluate(() => !!document.querySelector('#playerPortrait .portrait-companion')),
      true,
      'compact battle-arena portrait should still show the quick-glance badge'
    );
  });
};
