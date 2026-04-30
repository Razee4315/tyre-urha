# Zero-Config Agent Prompt

Copy this prompt and give it to your coding agent.

```text
Clone this repo and turn it into my new Tauri Android app.

Repo:
https://github.com/Razee4315/Tauri_Android_Template.git

Your job:
1. Clone the repo.
2. Read README.md first.
3. Edit template.config.json to match my new app idea.
4. Run `npm install`.
5. Run `npm run bootstrap`.
6. If bootstrap fails, fix the environment or config and rerun it.
7. If I give you app naming details, prefer `npm run template:rename`.
8. If I give you branding assets, prefer `npm run branding:replace`.
9. If I ask for Android release readiness, use `npm run android:signing` or the signing helper files.
10. Make the UI and app structure based on my feature idea.
11. Keep the Android Studio project working under `src-tauri/gen/android`.
12. Do not remove the reusable Tauri + Android setup unless absolutely needed.
13. If you change app name, identifier, package name, or version, keep Tauri, Cargo, and Android files in sync.
14. Verify with:
   - `npm run build`
   - `cargo check --manifest-path src-tauri/Cargo.toml`
15. If I ask for Android testing, use the checked-in Android project and Tauri Android commands.

Initial rename values:
- Product name: REPLACE_ME
- Welcome message: REPLACE_ME
- Identifier: com.replace.me
- npm package name: replace-me
- rust package name: replace-me
- rust binary name: replace-me
- rust library name: replace_me
- version: 0.1.0

Files to update first:
- `template.config.json`
- `src/App.tsx` if the welcome screen text/layout needs to change
- `README.md` only if setup steps need to change

Important rules:
- Keep the project easy to reuse as a template.
- Keep code simple and editable.
- Prefer changing `template.config.json` instead of hardcoding names in many files.
- Do not commit build caches, Gradle caches, target folders, keystores, or secrets.
- If Android paths or generated package names drift, fix them.
- If needed, commit in small clean commits with good messages.

After setup, tell me:
- what you changed
- what commands passed
- what I should run next
```

## How to use it fast

1. Replace the `REPLACE_ME` values.
2. Add your app idea below the prompt.
3. Give the full prompt to your agent.
