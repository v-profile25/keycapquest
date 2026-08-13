const assert = require('assert');
const { freshProfile, typeCurrentTextCorrectly } = require('./helpers');

module.exports = function (test) {
  test('gold/gem rewards scale with difficulty', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'DiffTest');

    await page.click('#btnDifficulty');
    await page.waitForTimeout(150);
    const cards = await page.evaluate(() => Array.from(document.querySelectorAll('.diff-card')).map((c) => c.textContent));
    assert.match(cards[0], /Easy.*35%/s);
    assert.match(cards[1], /Normal.*100%/s);
    assert.match(cards[2], /Hard.*180%/s);

    // Easy: World 1 practice, first clear (kind='complete', flat base-2 payout).
    await page.click('.diff-card:nth-child(1)');
    await page.click('#btnCloseDifficulty');
    await page.click('.node');
    await page.click('.stage-card'); // practice
    await page.click('#btnStartLevel');
    await page.waitForTimeout(150);
    await typeCurrentTextCorrectly(page);
    const easyGold = await page.evaluate(() => document.getElementById('resGold').textContent);
    const easyNote = await page.evaluate(() => document.getElementById('resGoldNote').textContent);
    assert.strictEqual(easyGold, '+1', 'Easy practice-clear gold should be floored by the 35% reward multiplier');
    assert.match(easyNote, /Easy ×35%/);
    await page.click('#btnResultMap');

    // Normal: skirmish, first clear (kind='win', base 10 + stars*2).
    await page.click('#btnWdDifficulty');
    await page.click('.diff-card:nth-child(2)');
    await page.click('#btnCloseDifficulty');
    await page.click('.stage-card:nth-child(2)'); // skirmish
    await page.click('#btnStartLevel');
    await page.waitForTimeout(150);
    await typeCurrentTextCorrectly(page);
    const normalGold = await page.evaluate(() => document.getElementById('resGold').textContent);
    assert.strictEqual(normalGold, '+16', 'Normal skirmish 3-star first clear should pay base 10 + 3*2 at 100%');
    await page.click('#btnResultMap');

    // Hard: boss, first clear (kind='win', base 25 + stars*5, plus a flat +25 gear-unlock bonus).
    await page.click('#btnWdDifficulty');
    await page.click('.diff-card:nth-child(3)');
    await page.click('#btnCloseDifficulty');
    await page.click('.stage-card:nth-child(3)'); // boss
    await page.click('#btnStartLevel');
    await page.waitForTimeout(150);
    for (let i = 0; i < 80; i++) {
      const overlayActive = await page.evaluate(() => document.getElementById('overlayResult').classList.contains('active'));
      if (overlayActive) break;
      const spanState = await page.evaluate(() => {
        var spans = document.querySelectorAll('#typeBox .ch');
        for (var i = 0; i < spans.length; i++) if (spans[i].classList.contains('current')) return i;
        return -1;
      });
      if (spanState === -1) break;
      const text = await page.evaluate(() => Array.from(document.querySelectorAll('#typeBox .ch')).map((s) => s.classList.contains('space') ? ' ' : s.textContent).join(''));
      for (const ch of text.slice(spanState, spanState + 5)) await page.keyboard.press(ch === ' ' ? 'Space' : ch);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(200);
    const hardGold = await page.evaluate(() => document.getElementById('resGold').textContent);
    const hardNote = await page.evaluate(() => document.getElementById('resGoldNote').textContent);
    assert.strictEqual(hardGold, '+97', 'Hard boss 3-star first clear: round((25+15)*1.8) + 25 gear bonus = 97');
    assert.match(hardNote, /Hard ×180%/);
  });
};
