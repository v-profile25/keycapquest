const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { freshProfile } = require('./helpers');

module.exports = function (test) {
  test('renaming a player updates the topbar, character screen, and saved data', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'Riley');
    await page.click('#btnCharacter');
    await page.waitForTimeout(200);

    await page.click('#btnRenamePlayer');
    await page.waitForTimeout(150);
    assert.strictEqual(await page.evaluate(() => document.getElementById('overlayRenamePlayer').classList.contains('active')), true);
    assert.strictEqual(await page.inputValue('#renameNameInput'), 'Riley');

    await page.fill('#renameNameInput', 'Jordan');
    await page.click('#btnDoRename');
    await page.waitForTimeout(150);

    assert.strictEqual(await page.evaluate(() => document.getElementById('overlayRenamePlayer').classList.contains('active')), false);
    assert.strictEqual(await page.textContent('#charTitle'), 'Jordan');
    assert.strictEqual(await page.textContent('#pillName'), 'Jordan');
    assert.strictEqual(
      await page.evaluate(() => JSON.parse(localStorage.getItem('keycapQuest.v3')).players[0].name),
      'Jordan'
    );
  });

  test('blank name is rejected and does not overwrite the existing one', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'Sam');
    await page.click('#btnCharacter');
    await page.waitForTimeout(200);

    await page.click('#btnRenamePlayer');
    await page.fill('#renameNameInput', '   ');
    await page.click('#btnDoRename');
    await page.waitForTimeout(150);

    assert.strictEqual(await page.evaluate(() => document.getElementById('overlayRenamePlayer').classList.contains('active')), true);
    assert.strictEqual(await page.textContent('#charTitle'), 'Sam');
  });

  test('exporting downloads a save file, and loading it back on the profile screen restores it', async ({ page, baseUrl }) => {
    await freshProfile(page, baseUrl, 'Avery');
    await page.click('#btnCharacter');
    await page.waitForTimeout(200);
    await page.click('#playerPill');
    await page.waitForTimeout(200);

    await page.click('.export-save');
    await page.waitForTimeout(150);
    assert.strictEqual(await page.evaluate(() => document.getElementById('overlayExportSave').classList.contains('active')), true);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btnDownloadSave'),
    ]);
    assert.match(download.suggestedFilename(), /^keycapquest-save-avery-\d{4}-\d{2}-\d{2}\.json$/);

    const savePath = path.join(os.tmpdir(), 'kq-test-' + Date.now() + '.json');
    await download.saveAs(savePath);
    const saved = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    assert.strictEqual(saved.name, 'Avery');
    assert.ok(saved.id);

    await page.click('#btnCloseExport2');

    // Rename the in-browser copy, then re-import the original file over it
    // (same id -> overwrite path) and confirm the name reverts to "Avery".
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('keycapQuest.v3'));
      data.players[0].name = 'Changed';
      localStorage.setItem('keycapQuest.v3', JSON.stringify(data));
    });
    await page.reload();
    await page.waitForTimeout(300);
    await page.click('#playerPill');
    await page.waitForTimeout(200);

    page.once('dialog', (d) => d.accept());
    await page.click('#btnImportSave');
    await page.waitForTimeout(150);
    const fileInput = await page.$('#importFileInput');
    await fileInput.setInputFiles(savePath);
    await page.waitForTimeout(250);
    fs.unlinkSync(savePath);

    assert.strictEqual(await page.evaluate(() => document.getElementById('overlayImportSave').classList.contains('active')), false);
    const names = await page.$$eval('.profile-card:not(.new) .pname', (els) => els.map((e) => e.textContent));
    assert.deepStrictEqual(names, ['Avery']);
  });
};
