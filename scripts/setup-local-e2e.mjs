#!/usr/bin/env node
/**
 * Local E2E Setup
 *
 * Verifies prerequisites and starts Supabase Local for E2E testing.
 * Designed for macOS + Colima OR Docker Desktop.
 *
 * What it does:
 * - Checks Node/Docker/Supabase CLI availability
 * - Starts Colima if available and not running (optional)
 * - Starts Supabase local services via `npm run supabase:start`
 * - Prints `supabase status`
 * - Probes key endpoints (API, Studio, Mailpit)
 */

import { spawnSync } from "node:child_process";
import process from "node:process";

const DOCKER_HOST_FOR_COLIMA = `unix://${process.env.HOME}/.colima/default/docker.sock`;

const ENDPOINTS = {
  supabaseApi: "http://127.0.0.1:54321",
  studio: "http://127.0.0.1:54323",
  mailpitUi: "http://127.0.0.1:54324",
  mailpitApiInfo: "http://127.0.0.1:54324/api/v1/info",
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    env: options.env ?? process.env,
    ...options,
  });
  return result.status ?? 1;
}

function runQuiet(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    encoding: "utf8",
    env,
  });
  return {
    ok: (result.status ?? 1) === 0,
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

async function probeUrl(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    return { ok: true, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

function printHeader(text) {
  process.stdout.write(`\n${text}\n`);
}

function fail(message) {
  process.stderr.write(`\n❌ ${message}\n`);
  process.exit(1);
}

async function main() {
  printHeader("Local E2E setup (Supabase Local + Mailpit)");

  // Node sanity
  if (typeof fetch !== "function") {
    fail("Node 18+ is required (global fetch missing).");
  }

  // Colima (optional) - attempt to start if installed and not running
  const colimaInstalled = runQuiet("colima", ["version"]).ok;
  const envWithColimaDockerHost = {
    ...process.env,
    DOCKER_HOST: DOCKER_HOST_FOR_COLIMA,
  };

  if (colimaInstalled) {
    const colimaStatus = runQuiet("colima", ["status"]);
    if (!colimaStatus.ok) {
      printHeader("Starting Colima...");
      const status = run("colima", ["start", "--cpu", "2", "--memory", "4"]);
      if (status !== 0) {
        fail(
          "Failed to start Colima. Run `colima start` manually to see details."
        );
      }
    }

    // Ensure docker points at Colima even if the user's docker context is `default`.
    const useColimaContext = runQuiet("docker", ["context", "use", "colima"]);
    if (!useColimaContext.ok) {
      // Fall back to DOCKER_HOST when context switching isn't available.
      process.env.DOCKER_HOST = DOCKER_HOST_FOR_COLIMA;
    }
  }

  // Docker runtime (after Colima startup attempt)
  const dockerInfo = colimaInstalled
    ? runQuiet("docker", ["info"], envWithColimaDockerHost)
    : runQuiet("docker", ["info"]);

  if (!dockerInfo.ok) {
    fail(
      [
        "Docker is not available.",
        "If you use Colima: run `colima start`.",
        "If you use Docker Desktop: open Docker Desktop and wait until it says Running.",
      ].join("\n")
    );
  }

  // Supabase CLI
  const supabase = runQuiet("supabase", ["--version"]);
  if (!supabase.ok) {
    fail(
      [
        "Supabase CLI is not installed or not on PATH.",
        "Install: `brew install supabase/tap/supabase`",
      ].join("\n")
    );
  }

  // Start Supabase local
  printHeader("Starting Supabase Local...");
  const startStatus = run("npm", ["run", "supabase:start"], {
    env: colimaInstalled ? envWithColimaDockerHost : process.env,
  });
  if (startStatus !== 0) {
    fail(
      [
        "Failed to start Supabase Local.",
        "Common fixes:",
        "- Ensure Docker runtime is running",
        "- Ensure ports 54321-54326 are free",
        "- Run `npm run supabase:stop` and try again",
      ].join("\n")
    );
  }

  printHeader("Supabase status:");
  const statusExit = run("npm", ["run", "supabase:status"], {
    env: colimaInstalled ? envWithColimaDockerHost : process.env,
  });
  if (statusExit !== 0) {
    fail("Failed to read Supabase status.");
  }

  printHeader("Probing endpoints:");
  const checks = [
    ["Supabase API", ENDPOINTS.supabaseApi],
    ["Studio", ENDPOINTS.studio],
    ["Mailpit UI", ENDPOINTS.mailpitUi],
    ["Mailpit API", ENDPOINTS.mailpitApiInfo],
  ];

  for (const [name, url] of checks) {
    const result = await probeUrl(url);
    const status = result.ok ? String(result.status) : "down";
    process.stdout.write(`- ${name}: ${url} (${status})\n`);
  }

  printHeader("Next steps:");
  process.stdout.write("- Start app for E2E: `npm run dev:e2e`\n");
  process.stdout.write("- Run E2E tests: `npm run test:e2e`\n");
  process.stdout.write("- Stop Supabase: `npm run supabase:stop`\n");
}

main().catch(() => {
  fail("Setup script failed unexpectedly.");
});
