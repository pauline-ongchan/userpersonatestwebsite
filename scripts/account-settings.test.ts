import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Pages served for /demo-app/account-settings (cleanUrls maps to either of these).
const PAGES = [
  "demo-app/account-settings/index.html",
  "demo-app/account-settings.html",
];

const repoRoot = resolve(import.meta.dirname, "..");

// Regression: changing the account email to test@example.com must reach a
// confirmation screen whose heading reads "Email updated successfully".
// PersonaProbe's adversarial run failed because the heading used different
// wording, so the confirmation text could not be found.
for (const page of PAGES) {
  test(`${page} confirms email updates with the expected heading`, async () => {
    const html = await readFile(resolve(repoRoot, page), "utf8");

    assert.ok(
      html.includes("Email updated successfully"),
      `${page} should show "Email updated successfully" on the confirmation screen`
    );
    assert.ok(
      !html.includes("Account email changed successfully"),
      `${page} should no longer use the old confirmation heading`
    );
  });
}
