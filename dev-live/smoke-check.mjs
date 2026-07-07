#!/usr/bin/env node

const DEFAULT_BASE = 'http://127.0.0.1:8765/dev-live/';
const DEFAULT_EXPECTED_VERSION = '3.0.0-devlive7';
const DEFAULT_EXPECTED_LABEL = 'TapCalc Dev-Live';
const DEFAULT_EXPECTED_CACHE = 'tapcalc-dev-live-cache-3.0.0-devlive7';

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const envName = `TAPCALC_${name.replace(/-/g, '_').toUpperCase()}`;
  return process.env[envName] || fallback;
}

const baseUrl = new URL(readArg('base', DEFAULT_BASE));
const expectedVersion = readArg('expect-version', DEFAULT_EXPECTED_VERSION);
const expectedLabel = readArg('expect-label', DEFAULT_EXPECTED_LABEL);
const expectedCache = readArg('expect-cache', DEFAULT_EXPECTED_CACHE);

const checks = [];

function resolveUrl(path, from = baseUrl) {
  return new URL(path, from).href;
}

async function fetchText(path, from) {
  const url = resolveUrl(path, from);
  const response = await fetch(url, { cache: 'no-store' });
  const text = await response.text();
  checks.push({
    ok: response.ok,
    name: `GET ${path}`,
    detail: `${response.status} ${url}`
  });
  return { url, response, text };
}

async function fetchHeadish(path, from) {
  const url = resolveUrl(path, from);
  const response = await fetch(url, { cache: 'no-store' });
  await response.arrayBuffer();
  checks.push({
    ok: response.ok,
    name: `GET ${path}`,
    detail: `${response.status} ${url}`
  });
  return response;
}

function expectContains(name, text, needle) {
  checks.push({
    ok: text.includes(needle),
    name,
    detail: needle
  });
}

function extractQuotedAssets(serviceWorkerText) {
  return Array.from(serviceWorkerText.matchAll(/['"](\.{1,2}\/[^'"]+)['"]/g))
    .map((match) => match[1])
    .filter((value, index, all) => all.indexOf(value) === index);
}

function extractCssImports(cssText) {
  return Array.from(cssText.matchAll(/@import\s+url\(["']?([^"')]+)["']?\)/g))
    .map((match) => match[1])
    .filter((value, index, all) => all.indexOf(value) === index);
}

async function main() {
  const html = await fetchText('measurement-card.html', baseUrl);
  expectContains('HTML version marker', html.text, expectedVersion);
  expectContains('HTML label marker', html.text, expectedLabel);
  expectContains('HTML config script marker', html.text, `firebase-config.js?v=${expectedVersion}`);
  expectContains('HTML app script marker', html.text, `measurement.js?v=${expectedVersion}`);

  const config = await fetchText(`firebase-config.js?v=${expectedVersion}`, baseUrl);
  expectContains('Config channel marker', config.text, "channel: 'dev-live'");
  expectContains('Config version marker', config.text, expectedVersion);
  expectContains('Config label marker', config.text, expectedLabel);

  const measurement = await fetchText(`measurement.js?v=${expectedVersion}`, baseUrl);
  expectContains('Measurement version marker', measurement.text, `BUILD_VERSION = '${expectedVersion}'`);
  expectContains('Shared stackup path marker', measurement.text, "STACKUP_VISUAL_BASE_PATH = '../reference/stackups/'");

  const overlay = await fetchText(`overlays/tapcalc-mobile-reliability.js?v=${expectedVersion}`, baseUrl);
  expectContains('Reference scroll helper marker', overlay.text, 'tapCalcKeepReferenceEntryVisible');

  const overlayCss = await fetchText(`tapcalc-overlays.css?v=${expectedVersion}`, baseUrl);
  expectContains('Overlay CSS version marker', overlayCss.text, expectedVersion);
  const cssImports = extractCssImports(overlayCss.text);
  for (const importPath of cssImports) {
    await fetchHeadish(importPath, overlayCss.url);
  }

  const serviceWorker = await fetchText(`service-worker.js?v=${expectedVersion}`, baseUrl);
  expectContains('Service worker cache marker', serviceWorker.text, expectedCache);
  expectContains('Service worker version marker', serviceWorker.text, expectedVersion);
  const serviceWorkerAssets = extractQuotedAssets(serviceWorker.text)
    .filter((asset) => !asset.endsWith('/'));
  for (const asset of serviceWorkerAssets) {
    await fetchHeadish(asset, serviceWorker.url);
  }

  await fetchHeadish('../reference/stackups/HTP%20Stackups.pdf', baseUrl);

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    const mark = check.ok ? 'PASS' : 'FAIL';
    console.log(`${mark} ${check.name} - ${check.detail}`);
  }
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed for ${baseUrl.href}`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});

