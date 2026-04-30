import { spawnSync } from "node:child_process";

const steps = [
  { label: "Sync template config", command: "npm", args: ["run", "template:sync"] },
  { label: "Check local setup", command: "npm", args: ["run", "doctor"] },
  { label: "Prepare Android Rust crates", command: "npm", args: ["run", "android:prepare"] }
];

for (const step of steps) {
  console.log(`\n== ${step.label} ==`);
  const resolved = resolveCommand(step.command, step.args);
  const result = spawnSync(resolved.command, resolved.args, {
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nBootstrap complete.");
console.log("Next good commands:");
console.log("- npm run tauri dev");
console.log("- npm run android:dev");

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
