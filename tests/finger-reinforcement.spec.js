const assert = require('assert');
const { freshProfile, readTypedText } = require('./helpers');

module.exports = function (test) {
  test('tracks per-finger accuracy, reports it, and supports weak-finger drills', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'FingerTest');

    // World 1 practice, unlocked by default.
    await page.click('.node');
    await page.click('.stage-card'); // practice
    await page.click('#btnStartLevel');
    await page.waitForTimeout(150);

    // Play several rounds, deliberately fumbling 'a' (left pinky) so a
    // weak finger shows up in both the per-round note and the lifetime report.
    for (let i = 0; i < 6; i++) {
      const text = await readTypedText(page);
      for (const ch of text) {
        if (ch === 'a') await page.keyboard.press('x'); // wrong key on purpose
        await page.keyboard.press(ch === ' ' ? 'Space' : ch);
      }
      await page.waitForTimeout(120);
      const overlayActive = await page.evaluate(() => document.getElementById('overlayResult').classList.contains('active'));
      assert.ok(overlayActive, `round ${i}: result overlay should be active after finishing the level`);
      if (i === 0) {
        const note = await page.evaluate(() => document.getElementById('resFingerNote').textContent);
        assert.match(note, /Left Pinky/, 'first-round finger note should call out the fumbled finger');
      }
      if (i < 5) { await page.click('#btnRetryLevel'); await page.waitForTimeout(150); }
    }

    await page.click('#btnResultMap');
    await page.click('#btnCharacter');
    await page.waitForTimeout(250);

    const reportDisplay = await page.evaluate(() => getComputedStyle(document.getElementById('fingerReport')).display);
    assert.strictEqual(reportDisplay, 'block', 'lifetime finger report should render once enough attempts exist');
    const chipCount = await page.evaluate(() => document.getElementById('fingerAccGrid').children.length);
    assert.strictEqual(chipCount, 8, 'report should show all 8 non-thumb fingers');
    const weakBtnText = await page.evaluate(() => document.getElementById('btnPracticeWeak').textContent);
    assert.match(weakBtnText, /Left Pinky/, 'practice-weakest button should target the fumbled finger');

    // Launch the drill and confirm the "insist" cue fires after two misses in a row.
    await page.click('#btnPracticeWeak');
    await page.waitForTimeout(250);
    assert.strictEqual(await page.evaluate(() => document.querySelector('.screen.active').id), 'screen-level');
    const drillText = await readTypedText(page);
    const wrongFirst = drillText[0] === 'q' ? 'p' : 'q';
    await page.keyboard.press(wrongFirst);
    await page.keyboard.press(wrongFirst);
    await page.waitForTimeout(150);
    const hintClass = await page.evaluate(() => document.getElementById('fingerHint').className);
    assert.match(hintClass, /insist/, 'hint should escalate to the insist state after two misses on the same key');

    // Finish the drill and confirm it lands back on the character screen with a summary banner.
    for (const ch of drillText) await page.keyboard.press(ch === ' ' ? 'Space' : ch);
    await page.waitForTimeout(300);
    assert.strictEqual(await page.evaluate(() => document.querySelector('.screen.active').id), 'screen-character');
    const banner = await page.evaluate(() => document.querySelector('#screen-character .reward-banner')?.textContent || '');
    assert.match(banner, /drill complete/i);

    // Regression: a normal level after a drill should restore the exit button's label and behavior.
    await page.click('#playerPill');
    await page.click('.profile-card:not(.new)');
    await page.click('.node');
    await page.click('.stage-card');
    await page.click('#btnStartLevel');
    await page.waitForTimeout(150);
    const exitLabel = await page.evaluate(() => document.getElementById('btnExitLevel').textContent);
    assert.strictEqual(exitLabel, '← Stages');
    await page.click('#btnExitLevel');
    await page.waitForTimeout(150);
    assert.strictEqual(await page.evaluate(() => document.querySelector('.screen.active').id), 'screen-world');
  });
};
