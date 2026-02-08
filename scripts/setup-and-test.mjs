#!/usr/bin/env node
/**
 * Setup and Test - Full Local E2E Environment
 *
 * Complete workflow:
 * 1. Cleanup: Stop Supabase Local, stop Colima
 * 2. Startup: Start Colima, start Supabase Local from scratch
 * 3. Verify: Probe endpoints
 * 4. Dev Server: Start Next.js with E2E config
 * 5. Test: Run UI tests (parallel), then E2E tests
 * 6. Cleanup: Stop dev server and background processes
 *
 * Usage:
 *   npm run setup:test
 */

import { spawn, spawnSync } from "node:child_process";
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

function printStep(step) {
  process.stdout.write(`\n→ ${step}\n`);
}

function fail(message) {
  process.stderr.write(`\n❌ ${message}\n`);
  process.exit(1);
}

async function main() {
  printHeader("═══════════════════════════════════════════════");
  printHeader("  Local E2E Environment - Full Reset & Test");
  printHeader("═══════════════════════════════════════════════");

  // ============================================================================
  // PHASE 1: CLEANUP
  // ============================================================================
  printHeader("\n[PHASE 1] Cleanup");

  printStep("Stopping Supabase Local...");
  const stopSupabase = run("npm", ["run", "supabase:stop"]);
  if (stopSupabase !== 0) {
    process.stdout.write("  (Supabase may not be running, continuing...)\n");
  } else {
    process.stdout.write("  ✓ Supabase Local stopped\n");
  }

  printStep("Stopping Colima...");
  const stopColima = runQuiet("colima", ["stop"]);
  if (!stopColima.ok) {
    process.stdout.write("  (Colima may not be running, continuing...)\n");
  } else {
    process.stdout.write("  ✓ Colima stopped\n");
  }

  // Wait a moment for cleanup to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // ============================================================================
  // PHASE 2: STARTUP
  // ============================================================================
  printHeader("\n[PHASE 2] Startup");

  printStep("Starting Colima (cpu=2, memory=4GB)...");
  const startColima = run("colima", ["start", "--cpu", "2", "--memory", "4"]);
  if (startColima !== 0) {
    fail("Failed to start Colima. Run `colima start` manually to diagnose.");
  }
  process.stdout.write("  ✓ Colima started\n");

  printStep("Ensuring Docker context is 'colima'...");
  const envWithColima = {
    ...process.env,
    DOCKER_HOST: DOCKER_HOST_FOR_COLIMA,
  };
  const useColimaContext = runQuiet("docker", ["context", "use", "colima"]);
  if (useColimaContext.ok) {
    process.stdout.write("  ✓ Docker context switched to 'colima'\n");
  } else {
    process.stdout.write("  ℹ Using DOCKER_HOST env var instead\n");
    process.env.DOCKER_HOST = DOCKER_HOST_FOR_COLIMA;
  }

  printStep("Starting Supabase Local...");
  const startSupabase = run("npm", ["run", "supabase:start"], {
    env: envWithColima,
  });
  if (startSupabase !== 0) {
    fail(
      [
        "Failed to start Supabase Local.",
        "Common fixes:",
        "- Ensure Docker is running",
        "- Ensure ports 54321-54326 are free",
        "- Run `npm run supabase:stop` and retry",
      ].join("\n")
    );
  }
  process.stdout.write("  ✓ Supabase Local started\n");

  printStep("Verifying Supabase status...");
  const statusExit = run("npm", ["run", "supabase:status"], {
    env: envWithColima,
  });
  if (statusExit !== 0) {
    fail("Failed to read Supabase status.");
  }

  // ============================================================================
  // PHASE 3: ENDPOINT VERIFICATION
  // ============================================================================
  printHeader("\n[PHASE 3] Endpoint Verification");

  const checks = [
    ["Supabase API", ENDPOINTS.supabaseApi],
    ["Studio", ENDPOINTS.studio],
    ["Mailpit UI", ENDPOINTS.mailpitUi],
    ["Mailpit API", ENDPOINTS.mailpitApiInfo],
  ];

  for (const [name, url] of checks) {
    const result = await probeUrl(url);
    const status = result.ok ? String(result.status) : "down";
    process.stdout.write(`  - ${name}: ${url} (${status})\n`);
  }

  // ============================================================================
  // PHASE 4: START DEV SERVER
  // ============================================================================
  printHeader("\n[PHASE 4] Starting Dev Server");

  printStep("Starting Next.js dev server with E2E config...");
  const devServerProcess = spawn("npm", ["run", "dev:e2e"], {
    stdio: "inherit",
    shell: false,
    detached: false,
  });
  process.stdout.write("  ✓ Dev server started (running in background)\n");

  printStep("Waiting for dev server to be ready...");
  let devServerReady = false;
  const maxRetries = 30; // 30 seconds max
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = await probeUrl("http://localhost:3000");
    if (result.ok) {
      devServerReady = true;
      process.stdout.write(`  ✓ Dev server ready at http://localhost:3000\n`);
      break;
    }
  }

  if (!devServerReady) {
    devServerProcess.kill();
    fail("Dev server failed to start within 30 seconds");
  }

  // ============================================================================
  // PHASE 5: TESTS
  // ============================================================================
  printHeader("\n[PHASE 5] Running Tests");

  printStep("Starting UI tests (parallel, non-blocking)...");
  const uiTestProcess = spawn("npm", ["run", "test:ui"], {
    stdio: "inherit",
    shell: false,
    detached: false,
  });
  process.stdout.write("  ✓ UI tests started (running in background)\n");

  // Wait a moment before starting E2E tests
  await new Promise((resolve) => setTimeout(resolve, 3000));

  printStep("Running E2E tests...");
  const e2eTestExit = run("npm", ["run", "test:e2e"]);

  // ============================================================================
  // PHASE 6: SUMMARY & CLEANUP
  // ============================================================================
  printHeader("\n[PHASE 6] Summary & Cleanup");

  if (e2eTestExit === 0) {
    process.stdout.write("  ✓ E2E tests passed\n");
  } else {
    process.stdout.write("  ✗ E2E tests failed (see output above)\n");
  }

  process.stdout.write("\n  ℹ UI tests are still running in the background\n");
  process.stdout.write("  ℹ Check the UI test output for results\n");

  printStep("Stopping dev server and background processes...");
  devServerProcess.kill();
  uiTestProcess.kill();
  process.stdout.write("  ✓ All processes stopped\n");

  printHeader("\n═══════════════════════════════════════════════");
  printHeader("  Setup and test complete!");
  printHeader("═══════════════════════════════════════════════\n");

  process.exit(e2eTestExit);
}

main().catch((error) => {
  fail(`Setup script failed: ${error.message}`);
});
