import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const signingDir = path.join(root, "signing");
const keystorePropsPath = path.join(root, "src-tauri", "gen", "android", "keystore.properties");
// Gradle resolves `storeFile` via `file(...)` from the app module directory,
// not from the keystore.properties directory.
const appModuleDir = path.join(root, "src-tauri", "gen", "android", "app");

fs.mkdirSync(signingDir, { recursive: true });

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

  const defaultKeystorePath = path.join(signingDir, "release.keystore");
  const storeFile = await ask("Keystore path", defaultKeystorePath);
  const keyAlias = await ask("Key alias", "release");
  const storePassword = await ask("Store password", "changeit");
  const keyPassword = await ask("Key password", storePassword);

  const shouldGenerate =
    !fs.existsSync(storeFile) &&
    (await ask("Generate keystore with keytool now? (y/n)", "y")).toLowerCase() === "y";

  if (shouldGenerate) {
    const keytoolCommand = resolveCommand("keytool", [
        "-genkeypair",
        "-v",
        "-keystore",
        storeFile,
        "-alias",
        keyAlias,
        "-storepass",
        storePassword,
        "-keypass",
        keyPassword,
        "-keyalg",
        "RSA",
        "-keysize",
        "2048",
        "-validity",
        "10000",
        "-dname",
        "CN=Saqlain Template, OU=Android, O=Template, L=Lahore, ST=Punjab, C=PK"
      ]);
    const keytoolResult = spawnSync(keytoolCommand.command, keytoolCommand.args, {
      stdio: "inherit"
    });

    if (keytoolResult.status !== 0) {
      process.exit(keytoolResult.status ?? 1);
    }
  }

  const content = [
    `storeFile=${escapeBackslashes(path.relative(appModuleDir, storeFile))}`,
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`
  ].join("\n");

  fs.writeFileSync(keystorePropsPath, `${content}\n`);

  console.log(`\nWrote ${path.relative(root, keystorePropsPath)}`);
  console.log("This file is gitignored.");
  console.log("You can now use the Android release signing config in Gradle.");
  } finally {
    rl.close();
  }
}

function resolveCommand(command, args) {
  if (process.platform !== "win32") return { command, args };
  const comspec = process.env.ComSpec || "cmd.exe";
  const commandLine = [command, ...args.map(quoteWindowsArg)].join(" ");
  return {
    command: comspec,
    args: ["/d", "/s", "/c", commandLine]
  };
}

function escapeBackslashes(value) {
  return value.replaceAll("\\", "\\\\");
}

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) {
    return arg;
  }
  return `"${arg.replace(/"/g, '\\"')}"`;
}
