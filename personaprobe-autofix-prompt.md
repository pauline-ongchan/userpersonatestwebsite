# PersonaProbe Autofix Prompt

You are fixing a UI-agent failure found by PersonaProbe.

## Failed task
Not provided.

## Persona
Mobile-First User (mobile-first)

## Failure reason
Page text did not contain "Email updated successfully".

## Oracle expected vs actual
Expected:
Not provided.

Actual:
Not provided.

Oracle details:
Not provided.

## Target URL
https://userpersonatestwebsite.vercel.app/demo-app

## Browserbase replay/session link
https://browserbase.com/sessions/2af3b97c-d375-4ee9-9bca-c3a4a7834d9f

## Sentry evidence
Sentry event link:
https://sentry.io/performance/trace/2a7d7d5ae24f4c66889e6f9bf7002378

Evidence:
{
  "tags": {
    "run_id": "cmqny3k8f0001k104pay02k5l",
    "persona_key": "mobile-first",
    "test_case_id": "cmqny3k8f0005k104s4yzl3f2"
  },
  "traceId": "2a7d7d5ae24f4c66889e6f9bf7002378",
  "eventUrl": "https://sentry.io/performance/trace/2a7d7d5ae24f4c66889e6f9bf7002378"
}

## Action trace
[]

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
