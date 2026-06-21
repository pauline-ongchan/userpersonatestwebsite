import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// The route file and its static-host alias must stay byte-for-byte identical.
const ROUTE = resolve(root, "demo-app/account-settings/index.html");
const ALIAS = resolve(root, "demo-app/account-settings.html");

const routeHtml = readFileSync(ROUTE, "utf8");
const aliasHtml = readFileSync(ALIAS, "utf8");

test("route file and static alias stay in sync", () => {
  assert.equal(routeHtml, aliasHtml, "account-settings.html alias is out of sync with the route file");
});

for (const [name, html] of [
  ["route", routeHtml],
  ["alias", aliasHtml],
]) {
  test(`${name}: account email field comes before the billing email decoy`, () => {
    const accountIdx = html.indexOf('id="account-email"');
    const billingIdx = html.indexOf('id="billing-email"');
    assert.ok(accountIdx !== -1, "account-email field is missing");
    assert.ok(billingIdx !== -1, "billing-email field is missing");
    // Regression for the impatient-persona failure: the primary task field
    // (account email) must not be buried behind the billing email decoy.
    assert.ok(
      accountIdx < billingIdx,
      "account email field must render before the billing email field",
    );
  });

  test(`${name}: successful account-email update shows a clear confirmation`, () => {
    assert.match(
      html,
      /showSuccess\(\s*"Email updated successfully"/,
      'confirmation screen must read "Email updated successfully" after a successful update',
    );
  });

  test(`${name}: account email field keeps its accessibility label`, () => {
    assert.match(html, /aria-label="Account email"/, "account email aria-label must be preserved");
  });
}
