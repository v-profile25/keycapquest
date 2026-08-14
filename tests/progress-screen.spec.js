const assert = require('assert');
const { freshProfile, seedPlayer, clearedThrough, typeCurrentTextCorrectly } = require('./helpers');

module.exports = function (test) {
  test('shows rewards earned, trend charts, and stat highlights', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'ProgTest');

    // 8 worlds cleared with a rising WPM/accuracy trend, plus a few badges,
    // gear, and an owned title, to exercise every section at once.
    const sub = {};
    for (let w = 1; w <= 8; w++) {
      sub[w] = {
        practice: { stars: 3, bestWpm: 10 + w * 2, bestAcc: 80 + w, attempts: 1, passed: true, timesCleared: 1 },
        skirmish: { stars: 3, bestWpm: 12 + w * 2, bestAcc: 82 + w, attempts: 1, passed: true, timesCleared: 1 },
        boss: { stars: 3, bestWpm: 14 + w * 2, bestAcc: 85 + w, attempts: 1, passed: true, timesCleared: 1 },
      };
    }
    await seedPlayer(page, {
      subProgress: sub,
      badges: ['first_victory', 'speed_racer'],
      gearWorlds: [1, 2, 3],
      fightsWon: 24,
      flawlessWins: 5,
      totalCharsTyped: 3456,
      bestCombo: 42,
      ownedTitles: ['speedy'],
    });

    await page.click('#btnProgress');
    await page.waitForTimeout(250);
    assert.strictEqual(await page.evaluate(() => document.querySelector('.screen.active').id), 'screen-progress');

    const rewardsText = await page.evaluate(() => Array.from(document.querySelectorAll('#rewardsGrid .stat-tile')).map((t) => t.textContent));
    assert.match(rewardsText[0], /2\/8.*Badges.*Home Row Hero/s, 'badges tile should count owned and name the next one');
    assert.match(rewardsText[1], /3\/12.*Gear.*World 4 boss/s, 'gear tile should count owned and name the next boss');
    assert.match(rewardsText[2], /1\/12.*Avatars/s, 'avatars tile should count recruited characters');
    assert.match(rewardsText[3], /1\/8.*Titles/s, 'titles tile should count owned titles');

    const statsText = await page.evaluate(() => Array.from(document.querySelectorAll('#statsHighlightGrid .stat-tile')).map((t) => t.textContent));
    assert.ok(statsText.some((t) => /30.*Best WPM Ever/s.test(t)), 'best WPM should be the max bestWpm across all stages (world 8 boss: 14+16=30)');
    assert.ok(statsText.some((t) => /93%.*Best Accuracy Ever/s.test(t)), 'best accuracy should be the max bestAcc (world 8 boss: 85+8=93)');
    assert.ok(statsText.some((t) => /42.*Longest Combo/s.test(t)));
    assert.ok(statsText.some((t) => /3456.*Characters Typed/s.test(t)));
    assert.ok(statsText.some((t) => /8\/100.*Bosses Cleared/s.test(t)));

    const chartRowDisplay = await page.evaluate(() => getComputedStyle(document.getElementById('progChartRow')).display);
    assert.strictEqual(chartRowDisplay, 'flex', 'trend charts should show once multiple worlds have data');
    const wpmPoints = await page.evaluate(() => document.querySelectorAll('#chartWpm circle').length);
    const accPoints = await page.evaluate(() => document.querySelectorAll('#chartAcc circle').length);
    assert.strictEqual(wpmPoints, 8, 'WPM chart should have one point per world with data');
    assert.strictEqual(accPoints, 8, 'accuracy chart should have one point per world with data');

    // The finger-accuracy report now lives here (moved off the Character
    // screen); with no finger data seeded it should show the blurb, not the report.
    assert.strictEqual(await page.evaluate(() => getComputedStyle(document.getElementById('fingerReport')).display), 'none');
    assert.strictEqual(await page.evaluate(() => document.querySelector('#screen-character #fingerReport')), null, 'finger report should no longer live on the Character screen');
  });

  test('a fresh player sees empty-state messaging instead of broken charts', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'FreshProg');
    await page.click('#btnProgress');
    await page.waitForTimeout(200);
    const chartBlurbDisplay = await page.evaluate(() => getComputedStyle(document.getElementById('progChartBlurb')).display);
    const chartRowDisplay = await page.evaluate(() => getComputedStyle(document.getElementById('progChartRow')).display);
    assert.strictEqual(chartBlurbDisplay, 'block');
    assert.strictEqual(chartRowDisplay, 'none');
    const rewardsCount = await page.evaluate(() => document.querySelectorAll('#rewardsGrid .stat-tile').length);
    assert.strictEqual(rewardsCount, 4, 'rewards grid should still render 4 tiles (all at 0) with no progress yet');
  });

  test('tracks calendar-time progress separately from per-world progress', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'DailyTest');

    // Live playthrough: finishLevel should record a dailyStats entry for today.
    await page.click('.node');
    await page.click('.stage-card'); // practice
    await page.click('#btnStartLevel');
    await page.waitForTimeout(150);
    await typeCurrentTextCorrectly(page);
    const today = new Date().toISOString().slice(0, 10);
    const daily = await page.evaluate(() => JSON.parse(localStorage.getItem('keycapQuest.v3')).players[0].dailyStats);
    assert.ok(daily && daily[new Date().toISOString().slice(0, 10)], 'finishLevel should record a dailyStats entry keyed by today\'s date');
    assert.strictEqual(daily[today].attempts, 1);
    assert.ok(daily[today].bestWpm > 0);

    // Seed a multi-day history to check the "since you started" charts render.
    await seedPlayer(page, {
      dailyStats: {
        '2026-08-01': { attempts: 3, bestWpm: 12, bestAcc: 78 },
        '2026-08-03': { attempts: 5, bestWpm: 16, bestAcc: 82 },
        '2026-08-07': { attempts: 4, bestWpm: 19, bestAcc: 85 },
        '2026-08-10': { attempts: 6, bestWpm: 24, bestAcc: 90 },
        '2026-08-14': { attempts: 2, bestWpm: 29, bestAcc: 94 },
      },
    });
    await page.click('#btnProgress');
    await page.waitForTimeout(250);

    const rowDisplay = await page.evaluate(() => getComputedStyle(document.getElementById('dailyChartRow')).display);
    assert.strictEqual(rowDisplay, 'flex', 'daily trend charts should show once 2+ days have data');
    const wpmPoints = await page.evaluate(() => document.querySelectorAll('#chartDailyWpm circle').length);
    assert.strictEqual(wpmPoints, 5, 'one point per day played, independent of world progress');
    const range = await page.evaluate(() => document.getElementById('dailyWpmRange').textContent);
    assert.match(range, /Aug 1/);
    assert.match(range, /Aug 14/);
    const daysPlayedTile = await page.evaluate(() => Array.from(document.querySelectorAll('#statsHighlightGrid .stat-tile')).find((t) => t.textContent.includes('Days Played'))?.textContent);
    assert.match(daysPlayedTile || '', /^🗓️5/);
  });
};
