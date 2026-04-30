import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const checks = [
  checkCommand("node", ["--version"], "Node.js"),
  checkCommand("npm", ["--version"], "npm"),
  checkCommand("rustc", ["--version"], "Rust"),
  checkCommand("cargo", ["--version"], "Cargo"),
  checkCommand("npx", ["tauri", "--version"], "Tauri CLI (npm)"),
  // Gradle's Rust plugin invokes `cargo tauri ...`, which requires the
  // cargo-tauri subcommand binary on PATH. The npm Tauri CLI is not enough.
  checkCargoTauri()
];

const androidHome = process.env.ANDROID_HOME || "";
const ndkHome = process.env.NDK_HOME || process.env.ANDROID_NDK_HOME || "";
const javaHome = process.env.JAVA_HOME || "";

const envChecks = [
  checkPathEnv("ANDROID_HOME", androidHome),
  checkPathEnv("NDK_HOME / ANDROID_NDK_HOME", ndkHome),
  checkPathEnv("JAVA_HOME", javaHome)
];

const androidStudioPaths = [
  "C:\\Program Files\\Android\\Android Studio",
  "C:\\Program Files (x86)\\Android\\Android Studio"
];
const androidStudioInstalled = androidStudioPaths.some((entry) => fs.existsSync(entry));

const androidResourceChecks = checkAndroidResources();

const failedCore = [...checks, ...androidResourceChecks].filter(
  (item) => item.required && !item.ok
);

console.log("");
console.log("Template doctor");
console.log("================");
for (const item of checks) {
  printCheck(item);
}
for (const item of envChecks) {
  printCheck(item);
}
printCheck({
  label: "Android Studio",
  ok: androidStudioInstalled,
  detail: androidStudioInstalled ? "Detected" : "Not detected in the common Windows install path",
  required: false
});
for (const item of androidResourceChecks) {
  printCheck(item);
}

console.log("");
if (failedCore.length > 0) {
  console.log("Missing required tools:");
  for (const item of failedCore) {
    console.log(`- ${item.label}`);
  }
  process.exit(1);
}

console.log("Suggested next steps:");
console.log("- Run `npm run bootstrap` after editing `template.config.json`.");
if (!androidHome || !ndkHome || !javaHome) {
  console.log("- Set Android environment variables from `.env.example` before Android builds.");
}
if (!androidStudioInstalled) {
  console.log("- Install Android Studio if you want Android emulator / Android Studio workflows.");
}

function checkCommand(command, args, label) {
  const result = runCommand(command, args, { encoding: "utf8" });
  return {
    label,
    ok: result.status === 0,
    detail: result.status === 0 ? firstLine(result.stdout || result.stderr) : "Not available",
    required: true
  };
}

function runCommand(command, args, options = {}) {
  if (process.platform !== "win32") {
    return spawnSync(command, args, options);
  }

  const comspec = process.env.ComSpec || "cmd.exe";
  const commandLine = [command, ...args.map(quoteWindowsArg)].join(" ");
  return spawnSync(comspec, ["/d", "/s", "/c", commandLine], options);
}

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) {
    return arg;
  }
  return `"${arg.replace(/"/g, '\\"')}"`;
}

function checkPathEnv(label, value) {
  return {
    label,
    ok: Boolean(value) && fs.existsSync(value),
    detail: value ? (fs.existsSync(value) ? value : `${value} (path not found)`) : "Not set",
    required: false
  };
}

function printCheck(item) {
  const prefix = item.ok ? "[ok]" : item.required ? "[missing]" : "[warn]";
  console.log(`${prefix} ${item.label}: ${item.detail}`);
}

function firstLine(value) {
  return value.trim().split(/\r?\n/)[0] || "Detected";
}

function checkCargoTauri() {
  const result = runCommand("cargo", ["tauri", "--version"], { encoding: "utf8" });
  return {
    label: "cargo-tauri (cargo subcommand, needed for Android builds)",
    ok: result.status === 0,
    detail:
      result.status === 0
        ? firstLine(result.stdout || result.stderr)
        : "Not installed. Run `cargo install tauri-cli --locked` before `npm run android:build`",
    // Warning only — desktop-only / web-only flows don't need this. Android
    // builds will fail loudly without it, and CI installs it explicitly.
    required: false
  };
}

// Catches the two template-sync bugs we hit in CI before they reach a
// build: a self-referential <style parent="..."> wedged into themes.xml
// and unescaped apostrophes (&apos;) in strings.xml that aapt2 rejects.
function checkAndroidResources() {
  const results = [];
  const androidResDir = path.join("src-tauri", "gen", "android", "app", "src", "main", "res");
  if (!fs.existsSync(androidResDir)) return results;

  for (const themeRel of ["values/themes.xml", "values-night/themes.xml"]) {
    const file = path.join(androidResDir, themeRel);
    if (!fs.existsSync(file)) continue;
    const xml = fs.readFileSync(file, "utf8");
    const styleMatch = xml.match(/<style\s+name="([^"]+)"\s+parent="([^"]+)"/);
    const ok = !styleMatch || styleMatch[1] !== styleMatch[2];
    results.push({
      label: `Android theme parent (${themeRel})`,
      ok,
      detail: ok
        ? "Parent differs from name"
        : `Style ${styleMatch[1]} references itself as parent — Gradle will fail`,
      required: true
    });
  }

  const stringsFile = path.join(androidResDir, "values", "strings.xml");
  if (fs.existsSync(stringsFile)) {
    const xml = fs.readFileSync(stringsFile, "utf8");
    const ok = !xml.includes("&apos;");
    results.push({
      label: "Android strings.xml apostrophe escaping",
      ok,
      detail: ok
        ? "No bare &apos; entities"
        : "Contains &apos; — aapt2 rejects this. Use \\' instead.",
      required: true
    });
  }

  return results;
}
