import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const brandingDir = path.join(root, "branding");
const defaultIcon = path.join(brandingDir, "icon.png");
const defaultLogo = path.join(brandingDir, "logo.png");
const publicLogo = path.join(root, "public", "logo.png");
const duplicateAndroidColorFile = path.join(
  root,
  "src-tauri",
  "gen",
  "android",
  "app",
  "src",
  "main",
  "res",
  "values",
  "ic_launcher_background.xml"
);

fs.mkdirSync(brandingDir, { recursive: true });
fs.mkdirSync(path.dirname(publicLogo), { recursive: true });

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
  const askPath = async (label, fallback, optional = false) => {
    const suffix = optional ? " (press Enter to skip)" : "";
    const answer = await rl.question(`${label}${suffix} [${fallback}]: `);
    const value = answer.trim() || fallback;
    if (optional && !answer.trim() && !fs.existsSync(fallback)) {
      return "";
    }
    return path.resolve(value);
  };

  const iconPath = await askPath(
    "Path to the main app icon PNG (recommended 1024x1024)",
    defaultIcon
  );

  if (!fs.existsSync(iconPath)) {
    console.error(`Icon not found: ${iconPath}`);
    process.exit(1);
  }

  const iconArg = toTauriPath(iconPath);
  const tauriIconCommand = resolveCommand("npx", ["tauri", "icon", iconArg]);
  const tauriIconResult = spawnSync(tauriIconCommand.command, tauriIconCommand.args, {
    cwd: root,
    stdio: "inherit"
  });

  if (tauriIconResult.status !== 0) {
    process.exit(tauriIconResult.status ?? 1);
  }

  if (fs.existsSync(duplicateAndroidColorFile)) {
    fs.rmSync(duplicateAndroidColorFile, { force: true });
    console.log("Removed duplicate Android color resource: res/values/ic_launcher_background.xml");
  }

  const logoPath = await askPath(
    "Optional logo file to copy to public/logo.png",
    defaultLogo,
    true
  );

  if (logoPath && fs.existsSync(logoPath)) {
    fs.copyFileSync(logoPath, publicLogo);
    console.log(`Copied logo to ${relative(publicLogo)}`);
  }

  console.log("\nBranding update complete.");
  console.log("Generated Tauri icons under src-tauri/icons and Android resources.");
  } finally {
    rl.close();
  }
}

function relative(target) {
  return path.relative(root, target) || target;
}

function toTauriPath(target) {
  const relativePath = path.relative(root, target) || target;
  return relativePath.split(path.sep).join("/");
}

function resolveCommand(command, args) {
  if (process.platform !== "win32") {
    return { command, args };
  }

  const comspec = process.env.ComSpec || "cmd.exe";
  const commandLine = [command, ...args.map(quoteWindowsArg)].join(" ");
  return {
    command: comspec,
    args: ["/d", "/s", "/c", commandLine]
  };
}

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) {
    return arg;
  }
  return `"${arg.replace(/"/g, '\\"')}"`;
}
