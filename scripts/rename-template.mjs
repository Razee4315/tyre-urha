import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const configPath = path.join(root, "template.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
  const ask = async (label, fallback) => {
    const answer = await rl.question(`${label} [${fallback}]: `);
    return answer.trim() || fallback;
  };

  const nextConfig = {
    productName: await ask("Product name", config.productName),
    welcomeMessage: await ask("Welcome message", config.welcomeMessage),
    identifier: await ask("Identifier", config.identifier),
    npmPackageName: await ask("npm package name", config.npmPackageName),
    rustPackageName: await ask("Rust package name", config.rustPackageName),
    rustBinaryName: await ask("Rust binary name", config.rustBinaryName),
    rustLibraryName: await ask("Rust library name", config.rustLibraryName),
    version: await ask("Version", config.version)
  };

  fs.writeFileSync(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`);
  console.log("\nSaved template.config.json");

  const syncResult = spawnSync(process.execPath, ["./scripts/sync-template-config.mjs"], {
    cwd: root,
    stdio: "inherit"
  });

  if (syncResult.status !== 0) {
    process.exit(syncResult.status ?? 1);
  }

  console.log("\nRename complete.");
  console.log("Next good commands:");
  console.log("- npm run bootstrap");
  console.log("- npm run tauri dev");
  } finally {
    rl.close();
  }
}
