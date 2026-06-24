# PersonaProbe Autofix Prompt

You are fixing a UI-agent failure found by PersonaProbe.

## Failed task
Update account settings and save the notification email

## Persona
{
  "name": "Manual smoke-test persona",
  "goal": "Confirm the PersonaProbe autofix workflow can fetch and process context"
}

## Failure reason
Manual test context used to validate the GitHub Actions autofix path

## Oracle expected vs actual
Expected:
The workflow fetches context, generates a prompt and PR body, pushes a branch, and opens a draft PR.

Actual:
The smoke test should show this evidence in the generated draft PR.

Oracle details:
{
  "expected": "The workflow fetches context, generates a prompt and PR body, pushes a branch, and opens a draft PR.",
  "actual": "The smoke test should show this evidence in the generated draft PR."
}

## Target URL
https://example.com/demo-app/account-settings

## Browserbase replay/session link
https://browserbase.com/session/manual-test-placeholder

## Sentry evidence
Sentry event link:
https://sentry.io/organizations/example/issues/123/events/456/

Evidence:
{
  "eventUrl": "https://sentry.io/organizations/example/issues/123/events/456/",
  "message": "Manual PersonaProbe smoke-test context"
}

## Action trace
[
  {
    "step": 1,
    "action": "open",
    "target": "/demo-app/account-settings"
  },
  {
    "step": 2,
    "action": "click",
    "target": "Save changes"
  },
  {
    "step": 3,
    "action": "observe",
    "result": "Expected save confirmation"
  }
]

## Instructions
- Make the smallest safe change that fixes the UI-agent failure.
- Do not hardcode PersonaProbe-specific behavior.
- Do not bypass validation.
- Do not remove accessibility labels.
- Do not add unrelated changes.
- Add or update a regression test if practical.
- Use the failure reason, action trace, oracle, Sentry evidence, Browserbase replay link, and target URL to locate the issue.
- Keep this as a normal product fix that benefits real users.
- Do not auto-merge anything.
