# Tyre Launch

A first-person mobile game where you pick up a chunky tyre, load it into the
roller machine, watch the rollers charge, and release it down the lane to
smash a tower at the far end. Built on **Tauri 2 + React + Three.js +
cannon-es**, packaged for Android out of the box.

## Highlights

- **Five screens**: animated splash, real loading bar, main menu with stats,
  themes picker, settings, in-game HUD, pause + win overlays
- **Four themes**: Desert · Sunset · Night Neon · Snow (instant swap)
- **Mobile-first controls**: virtual joystick + drag-to-look + big action and
  release buttons with an animated charge ring
- **Three difficulties** that tune charge rate and aim assist
- **Synthesised audio**: WebAudio engine rumble, release whoosh, tower thud,
  confetti pop. No sample assets, mute-respecting
- **Adaptive renderer**: pixel ratio drops automatically when FPS slips
  below 50 and restores when comfortably above 58
- **Persistent stats**: best speed, total hits, total launches in
  `localStorage`
- **Procedural branding**: deterministic icon + logo generated from a single
  Node script. No image deps; CI gets bit-exact assets

## Run on web (dev preview)

```bash
npm install
npm run dev
```

Open [http://localhost:1420](http://localhost:1420).

## Run on Android (real device or emulator)

You need Rust, JDK 17+, the Android SDK, NDK r25+, and `ANDROID_HOME` on the
PATH. Then:

```bash
npm install
npm run bootstrap   # template sync + cargo fetch + sanity checks
npm run android:dev # opens on a connected device or running emulator
```

## Build a release APK locally

```bash
npm install
npm run android:signing   # one-time keystore wiring
npm run android:build
```

The artifact is written to
`src-tauri/gen/android/app/build/outputs/apk/universal/release/`.

## CI / Release

The repo ships with two GitHub Actions workflows:

- `.github/workflows/ci.yml` runs on every push and PR and verifies build +
  cargo check
- `.github/workflows/android-release.yml` runs on `v*` tag pushes (or manual
  dispatch). It installs the Android toolchain, builds the APK + AAB, uploads
  them as workflow artifacts, and attaches them to the GitHub release if
  triggered by a tag. Optional secrets for real signing:
  `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`,
  `ANDROID_STORE_PASSWORD`

Tag flow:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Controls

| Action            | Mobile                                    |
| ----------------- | ----------------------------------------- |
| Move              | Left thumb joystick                       |
| Look              | Drag the right side of the screen         |
| Pick / Place      | Big circular button (bottom right, top)   |
| Release           | Big circular button (bottom right, lower) |
| Pause             | Top-right                                 |

## Repo layout

```
src/
├── App.tsx              # screen state machine
├── main.tsx             # React entry
├── index.css            # globals
├── components/          # Logo, Joystick, HudActions
├── lib/                 # storage, themes, audio, types
├── engine/              # game loop, scene, tyre, roller, tower, particles
└── screens/             # splash, loading, menu, settings, themes, game,
                         #  pause, win + screens.css + hud.css

scripts/
├── generate-branding.mjs   # write branding/icon.png + logo.png
├── replace-branding.mjs    # fan icon out to Android + iOS + Tauri sets
├── sync-template-config.mjs
├── rename-template.mjs
├── setup-android-signing.mjs
├── bootstrap.mjs
└── doctor.mjs

src-tauri/
├── Cargo.toml
├── tauri.conf.json
├── capabilities/main.json
└── gen/android/           # checked-in Android Studio project
```

## Original

This project started as Khurram Bhutto's
[`tyre-urha`](https://github.com/khurrambhutto/tyre-urha) browser toy and
was rebuilt as a Tauri 2 mobile game by Saqlain.
