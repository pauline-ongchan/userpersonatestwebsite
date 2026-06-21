import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Vercel `cleanUrls` serves `/demo-app/account-settings` from one of these two
// files depending on trailing slash, so they must stay byte-identical.
const cleanPath = join(root, "demo-app", "account-settings.html");
const dirPath = join(root, "demo-app", "account-settings", "index.html");

const clean = readFileSync(cleanPath, "utf8");
const dir = readFileSync(dirPath, "utf8");

test("both served copies of the account-settings page are identical", () => {
  assert.equal(clean, dir, "account-settings.html and account-settings/index.html drifted");
});

test("a successful account-email change confirms with 'Email updated successfully'", () => {
  // Regression: the confirmation heading used to read "Account email changed
  // successfully", so reaching the confirmation screen never surfaced the
  // expected "Email updated successfully" copy.
  assert.match(clean, /showSuccess\(\s*"Email updated successfully"/);
  assert.doesNotMatch(clean, /Account email changed successfully/);
});
