#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const TARGETS = ["data/dramas.json", "public/posters"];

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf-8",
    ...options,
  });

  if (result.status !== 0) {
    if (options.capture && result.stderr) {
      process.stderr.write(result.stderr);
    }
    process.exit(result.status ?? 1);
  }

  return result;
}

function gitOutput(args) {
  return run("git", args, { capture: true }).stdout.trim();
}

function hasChangesForTarget(path) {
  const out = gitOutput(["status", "--porcelain=v1", "--", path]);
  return out.length > 0;
}

function hasUncommittedChanges() {
  return gitOutput(["status", "--porcelain=v1"]).length > 0;
}

const shouldPush = process.argv.includes("--push");
const messageArgIndex = process.argv.indexOf("--message");
const customMessage =
  messageArgIndex >= 0 && process.argv[messageArgIndex + 1]
    ? process.argv[messageArgIndex + 1]
    : process.env.POSTER_COMMIT_MESSAGE;

const defaultMessage = `chore(data): publish posters (${new Date().toISOString().slice(0, 10)})`;
const commitMessage = customMessage || defaultMessage;

const changedTargets = TARGETS.filter(hasChangesForTarget);

if (changedTargets.length === 0) {
  console.log("No poster-related changes found in data/dramas.json or public/posters.");
  process.exit(0);
}

console.log("Staging:", changedTargets.join(", "));
run("git", ["add", ...TARGETS]);

// Guard: abort if git add didn't stage anything (rare but safe)
if (gitOutput(["diff", "--cached", "--name-only", "--", ...TARGETS]).length === 0) {
  console.log("Nothing staged for poster publish.");
  process.exit(0);
}

run("git", ["commit", "-m", commitMessage]);
console.log("Committed:", commitMessage);

if (shouldPush) {
  run("git", ["push", "origin", "main"]);
  console.log("Pushed to origin/main");
} else {
  console.log("Skip push. Run with --push to publish to GitHub.");
}

if (hasUncommittedChanges()) {
  console.log("Note: there are still unstaged/uncommitted changes outside poster targets.");
}
