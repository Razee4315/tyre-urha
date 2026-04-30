# Android Signing Helpers

To create local Android release signing files:

```bash
npm run android:signing
```

This can:

- create a keystore with `keytool` if needed
- write `src-tauri/gen/android/keystore.properties`

Files created by that flow are gitignored.

If you prefer manual setup, copy:

```text
src-tauri/gen/android/keystore.properties.example
```

to:

```text
src-tauri/gen/android/keystore.properties
```

and fill in your real values.
