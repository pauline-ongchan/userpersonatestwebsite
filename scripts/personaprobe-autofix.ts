import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type AgentResult =
  | { mode: "stub" }
  | {
      mode: "agent";
      exitCode: number | null;
      signal: string | null;
      error?: string;
    };

type ContextSections = {
  failedTask: unknown;
  persona: unknown;
  failureReason: unknown;
  oracle: unknown;
  oracleExpected: unknown;
  oracleActual: unknown;
  targetUrl: unknown;
  browserbaseLink: unknown;
  sentryEvidence: unknown;
  sentryEventLink: unknown;
  actionTrace: unknown;
};

const PROMPT_PATH = "personaprobe-autofix-prompt.md";
const PR_BODY_PATH = "pr-body.md";

const SECRET_KEY_PATTERN =
  /(authorization|api[_-]?key|client[_-]?secret|cookie|credential|jwt|password|secret|session|signature|token)/i;

const SIGNED_URL_PARAM_PATTERN =
  /(access[_-]?key|authorization|client[_-]?secret|credential|expires|key|policy|secret|session|signature|signed|token|x-amz-|x-goog-)/i;

const URL_KEY_PATTERN = /(link|uri|url)$/i;

function getPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (current === null || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, value);
}

function pickFirst(source: unknown, paths: string[]): unknown {
  for (const path of paths) {
    const value = getPath(source, path);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function redactUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);

    for (const key of Array.from(url.searchParams.keys())) {
      if (SIGNED_URL_PARAM_PATTERN.test(key)) {
        url.searchParams.set(key, "[REDACTED]");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

function redactString(value: string): string {
  const withRedactedUrls = value.replace(/https?:\/\/[^\s<>)"']+/g, (match) => {
    const trailingPunctuation = match.match(/[.,;:!?]+$/)?.[0] ?? "";
    const url = trailingPunctuation ? match.slice(0, -trailingPunctuation.length) : match;

    return `${redactUrl(url)}${trailingPunctuation}`;
  });

  return withRedactedUrls
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, "[REDACTED]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]")
    .replace(/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g, "[REDACTED]")
    .replace(
      /\b(authorization|api[_-]?key|client[_-]?secret|cookie|password|secret|session|token)\s*[:=]\s*["']?[^"',\s)]+["']?/gi,
      "$1=[REDACTED]",
    )
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/gi, "Bearer [REDACTED]");
}

function sanitizeJson(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (SECRET_KEY_PATTERN.test(key) && !(URL_KEY_PATTERN.test(key) && typeof value === "string")) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item, key));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeJson(entryValue, entryKey),
      ]),
    );
  }

  return String(value);
}

function formatValue(value: unknown, maxLength = 4000): string {
  if (value === undefined || value === null || value === "") {
    return "Not provided.";
  }

  const sanitized = sanitizeJson(value);
  const formatted =
    typeof sanitized === "string" ? sanitized : JSON.stringify(sanitized, null, 2);

  if (formatted.length <= maxLength) {
    return formatted;
  }

  return `${formatted.slice(0, maxLength)}\n\n[Truncated for length]`;
}

function extractSections(context: unknown): ContextSections {
  return {
    failedTask: pickFirst(context, [
      "failed_task",
      "failedTask",
      "task",
      "task.description",
      "task.name",
      "scenario.task",
      "scenario.goal",
      "user_task",
      "goal",
      "prompt",
    ]),
    persona: pickFirst(context, [
      "persona",
      "user_persona",
      "userPersona",
      "test_persona",
      "testPersona",
      "scenario.persona",
    ]),
    failureReason: pickFirst(context, [
      "failure_reason",
      "failureReason",
      "reason",
      "error",
      "failure.message",
      "result.failure_reason",
      "result.reason",
      "evaluation.failure_reason",
      "evaluation.reason",
    ]),
    oracle: pickFirst(context, [
      "oracle",
      "expected_vs_actual",
      "expectedActual",
      "assertion",
      "evaluation.oracle",
      "result.oracle",
    ]),
    oracleExpected: pickFirst(context, [
      "oracle.expected",
      "expected",
      "evaluation.expected",
      "result.expected",
    ]),
    oracleActual: pickFirst(context, [
      "oracle.actual",
      "actual",
      "evaluation.actual",
      "result.actual",
    ]),
    targetUrl: pickFirst(context, [
      "target_url",
      "targetUrl",
      "url",
      "page_url",
      "pageUrl",
      "target.url",
      "run.target_url",
    ]),
    browserbaseLink: pickFirst(context, [
      "browserbase_replay_url",
      "browserbaseReplayUrl",
      "replay_url",
      "replayUrl",
      "browserbase.replay_url",
      "browserbase.replayUrl",
      "browserbase.session_url",
      "browserbase.sessionUrl",
      "browserbaseSessionUrl",
      "session_url",
      "sessionUrl",
    ]),
    sentryEvidence: pickFirst(context, [
      "sentry",
      "sentry_evidence",
      "sentryEvidence",
      "sentry.events",
      "evidence.sentry",
    ]),
    sentryEventLink: pickFirst(context, [
      "sentry_event_url",
      "sentryEventUrl",
      "sentry.url",
      "sentry.event_url",
      "sentry.eventUrl",
      "sentry.issue_url",
      "sentry.issueUrl",
      "sentryIssueUrl",
    ]),
    actionTrace: pickFirst(context, [
      "action_trace",
      "actionTrace",
      "trace",
      "actions",
      "steps",
      "events",
      "browser_actions",
      "browserActions",
    ]),
  };
}

function buildPrompt(sections: ContextSections): string {
  return `# PersonaProbe Autofix Prompt

You are fixing a UI-agent failure found by PersonaProbe.

## Failed task
${formatValue(sections.failedTask)}

## Persona
${formatValue(sections.persona)}

## Failure reason
${formatValue(sections.failureReason)}

## Oracle expected vs actual
Expected:
${formatValue(sections.oracleExpected)}

Actual:
${formatValue(sections.oracleActual)}

Oracle details:
${formatValue(sections.oracle)}

## Target URL
${formatValue(sections.targetUrl)}

## Browserbase replay/session link
${formatValue(sections.browserbaseLink)}

## Sentry evidence
Sentry event link:
${formatValue(sections.sentryEventLink)}

Evidence:
${formatValue(sections.sentryEvidence, 8000)}

## Action trace
${formatValue(sections.actionTrace, 12000)}

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
`;
}

function describeAgentResult(result: AgentResult): string {
  if (result.mode === "stub") {
    return "Stub mode. PERSONAPROBE_AGENT_COMMAND was not configured, so no coding agent ran and app code was not modified by this script.";
  }

  if (result.error) {
    return `Coding agent attempted to run, but the command could not start: ${redactString(result.error)}`;
  }

  if (result.exitCode === 0) {
    return "Coding agent ran via PERSONAPROBE_AGENT_COMMAND.";
  }

  return `Coding agent ran via PERSONAPROBE_AGENT_COMMAND and exited with ${
    result.signal ? `signal ${result.signal}` : `code ${result.exitCode ?? "unknown"}`
  }. Review the workflow logs before merging.`;
}

function buildPrBody(sections: ContextSections, agentResult: AgentResult): string {
  const fixAttemptId = process.env.PERSONAPROBE_FIX_ATTEMPT_ID
    ? redactString(process.env.PERSONAPROBE_FIX_ATTEMPT_ID)
    : undefined;

  return `## PersonaProbe Autofix

This is an automatically generated draft PR and must be reviewed before merging. It will not be auto-merged.

${fixAttemptId ? `Fix attempt: ${fixAttemptId}\n\n` : ""}### Failed task
${formatValue(sections.failedTask, 2500)}

### Persona
${formatValue(sections.persona, 2500)}

### Failure reason
${formatValue(sections.failureReason, 2500)}

### Browserbase replay link
${formatValue(sections.browserbaseLink, 1000)}

### Sentry event link
${formatValue(sections.sentryEventLink, 1000)}

### Autofix status
${describeAgentResult(agentResult)}

Generated prompt: \`${PROMPT_PATH}\`
`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function runAgentCommand(command: string, promptPath: string, contextPath: string): AgentResult {
  const commandLine = `${command} ${shellQuote(promptPath)} ${shellQuote(contextPath)}`;
  const result = spawnSync(commandLine, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    shell: true,
  });

  if (result.stdout) {
    process.stdout.write(redactString(result.stdout));
  }

  if (result.stderr) {
    process.stderr.write(redactString(result.stderr));
  }

  if (result.error) {
    return {
      mode: "agent",
      exitCode: result.status,
      signal: result.signal,
      error: result.error.message,
    };
  }

  return {
    mode: "agent",
    exitCode: result.status,
    signal: result.signal,
  };
}

async function main(): Promise<void> {
  const contextArg = process.argv[2];

  if (!contextArg) {
    throw new Error("Usage: npm run personaprobe:autofix -- <fix-context.json>");
  }

  const contextPath = resolve(contextArg);
  const rawContext = await readFile(contextPath, "utf8");
  const context = JSON.parse(rawContext) as JsonValue;
  const safeContext = sanitizeJson(context);
  const sections = extractSections(safeContext);
  const prompt = buildPrompt(sections);

  await writeFile(PROMPT_PATH, prompt);

  const agentCommand = process.env.PERSONAPROBE_AGENT_COMMAND?.trim();
  const agentResult = agentCommand
    ? runAgentCommand(agentCommand, resolve(PROMPT_PATH), contextPath)
    : { mode: "stub" as const };

  await writeFile(PR_BODY_PATH, buildPrBody(sections, agentResult));

  console.log(`Wrote ${PROMPT_PATH} and ${PR_BODY_PATH}.`);

  if (agentResult.mode === "stub") {
    console.log("PERSONAPROBE_AGENT_COMMAND is not configured; stub mode completed.");
  }
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const safeMessage = redactString(message);

  await writeFile(
    PROMPT_PATH,
    `# PersonaProbe Autofix Prompt

The autofix script could not parse the provided fix context.

Error:
${safeMessage}
`,
  );
  await writeFile(
    PR_BODY_PATH,
    `## PersonaProbe Autofix

This is an automatically generated draft PR and must be reviewed before merging. It will not be auto-merged.

### Autofix status
The autofix script failed before it could process the fix context.

Error:
${safeMessage}

Generated prompt: \`${PROMPT_PATH}\`
`,
  );

  console.error(`PersonaProbe autofix failed: ${safeMessage}`);
  process.exitCode = 1;
});
