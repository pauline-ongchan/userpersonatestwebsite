import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const html = await readFile(join(here, "account-settings.html"), "utf8");

// Extracts the (title, message) the page renders when "Save preferences" is
// clicked, for a given account/billing email. Mirrors the inline handler so a
// regression in the confirmation copy is caught without a full DOM.
function confirmFor({ account = "", billing = "" } = {}) {
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const accountValue = account.trim();
  const billingValue = billing.trim();

  if (accountValue && !isValidEmail(accountValue)) return { error: true };
  if (billingValue && !isValidEmail(billingValue)) return { error: true };

  if (accountValue !== "test@example.com") {
    if (billingValue === "test@example.com") {
      return { title: "Billing address successfully changed" };
    }
    return { error: true };
  }

  // The title used by the account-email success path must match what the
  // inline handler renders. Keep this assertion in sync with the HTML.
  const accountSuccessTitle = "Email updated successfully";
  assert.ok(
    html.includes(`showSuccess(\n          "${accountSuccessTitle}",`),
    `account-settings.html must render the "${accountSuccessTitle}" confirmation heading`,
  );
  return { title: accountSuccessTitle };
}

test("changing the account email to test@example.com reaches a clear confirmation", () => {
  const result = confirmFor({ account: "test@example.com" });
  assert.equal(result.title, "Email updated successfully");
});

test("confirmation heading text is present in the page markup", () => {
  assert.ok(
    html.includes('"Email updated successfully"'),
    "expected the account-email success heading copy to exist in account-settings.html",
  );
});
