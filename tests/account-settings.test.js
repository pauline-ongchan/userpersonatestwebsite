import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// The account-settings page is served at /demo-app/account-settings. Vercel
// cleanUrls can resolve to either the file or the directory index, so both
// copies must stay in sync and show the same confirmation.
const pages = ["demo-app/account-settings.html", "demo-app/account-settings/index.html"];

for (const page of pages) {
  const html = readFileSync(new URL(page, `file://${root}`), "utf8");

  test(`${page}: confirms a successful email update with clear copy`, () => {
    // Regression: the success screen must announce the update so users (and
    // UI agents) can recognize the confirmation screen was reached.
    assert.match(html, /Email updated successfully/);
  });

  test(`${page}: still validates the account email before confirming`, () => {
    // Guard the fix from silently dropping validation.
    assert.match(html, /isValidEmail\(accountValue\)/);
    assert.match(html, /accountValue !== "test@example\.com"/);
  });

  test(`${page}: keeps the account email accessibility label`, () => {
    assert.match(html, /aria-label="Account email"/);
  });
}
