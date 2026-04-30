# Branding Helpers

Put your branding files here for the helper scripts.

Recommended files:

- `branding/icon.png`
  Use a square PNG, ideally `1024x1024`.
- `branding/logo.png`
  Optional app logo that will be copied to `public/logo.png`.

Then run:

```bash
npm run branding:replace
```

That will:

- regenerate Tauri icons
- refresh Android launcher assets through the Tauri icon generator
- optionally copy a logo into the web app public folder
