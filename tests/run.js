#!/usr/bin/env node
// Minimal test runner -- no @playwright/test dependency, just the
// `playwright` package (already a project devDependency) plus Node's
// built-in `assert`. Boots a static server, launches one browser, runs
// every tests/*.spec.js file, and prints a pass/fail summary.
//
// Usage: node tests/run.js   (or: npm test)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const PORT = 8934;
const BASE_URL = `http://localhost:${PORT}`;
const CHROMIUM_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium';

function waitForServer(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll() {
      http.get(url, (res) => { res.resume(); resolve(); })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) reject(new Error('static server did not start in time'));
          else setTimeout(poll, 150);
        });
    })();
  });
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  let stopped = false;
  const stopServer = () => { if (!stopped) { stopped = true; try { server.kill(); } catch (e) {} } };
  process.on('exit', stopServer);

  await waitForServer(`${BASE_URL}/index.html`, 10000);

  const launchOpts = fs.existsSync(CHROMIUM_PATH) ? { executablePath: CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launchOpts);

  const specFiles = fs.readdirSync(__dirname).filter((f) => f.endsWith('.spec.js')).sort();
  const results = [];

  for (const file of specFiles) {
    const tests = [];
    const register = (name, fn) => tests.push({ name: `${file} > ${name}`, fn });
    require(path.join(__dirname, file))(register);

    for (const t of tests) {
      const context = await browser.newContext();
      const page = await context.newPage();
      // Only uncaught JS exceptions (`pageerror`) fail a test. Console
      // "error"-level messages also cover routine resource-load noise like
      // the missing favicon.ico (Chromium's message for that doesn't even
      // include the URL, so it can't be filtered by text) -- not a
      // reliable signal of an actual app bug, so those are non-fatal.
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));
      try {
        await t.fn({ page, baseUrl: BASE_URL });
        if (pageErrors.length) throw new Error('uncaught page error(s): ' + pageErrors.join('; '));
        results.push({ name: t.name, ok: true });
        console.log(`  ok   ${t.name}`);
      } catch (err) {
        results.push({ name: t.name, ok: false, err });
        console.log(`FAIL   ${t.name}`);
        console.log(`       ${err.message}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  stopServer();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
