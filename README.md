# 🌟 Chatter Noor — AI Voice & Game Companion

[![Public Repository](https://img.shields.io/badge/Status-Public-brightgreen.svg)](#)
[![Android Compatible](https://img.shields.io/badge/Platform-Android%20%7C%20Web-blue.svg)](#)
[![AI Engine](https://img.shields.io/badge/Powered%20By-Google%20Gemini-orange.svg)](#)

**Chatter Noor** is an interactive AI voice companion and dynamic mini-game generator with a cyberpunk HUD interface, glowing 3D animated companion avatar, real-time Urdu & English voice interaction, and native Android APK support.

---

## ✨ Features

- **🎮 Game-Style Floating Subtitles (HUD):**
  - Noor's dialogue appears in a glowing transparent HUD subtitle style.
  - Smooth fade-in when speaking, automatic graceful fade-out after completion.
  - Hover or tap over dialogues pauses fade-out for comfortable reading.
- **⚡ Next-Gen Gemini AI Support:**
  - `gemini-2.5-flash` (Default & Super Fast)
  - `gemini-2.5-flash-lite` (Ultra-low Latency)
  - `gemini-2.5-pro` (Deep Reasoning)
  - `gemini-2.0-flash` & `gemini-2.0-flash-lite`
  - `gemini-1.5-flash` & `gemini-1.5-pro`
  - **Live Account Discovery:** One-click button (`🔍 DISCOVER ACCOUNT MODELS LIVE`) to scan eligible models available on your Google Gemini API key.
- **🕹️ Dynamic Fullscreen Mini-Game Engine:**
  - Ask Noor to create playable games (e.g. maze, arcade, space shooter, trivia) on the fly.
  - One-tap fullscreen game launcher.
- **🎙️ Urdu & English Voice Interaction:**
  - Real-time Speech-to-Text (STT) and expressive Text-to-Speech (TTS) with auto language detection.
- **📱 Standalone Android App (APK):**
  - Includes full native Android WebView wrapper with audio recording permissions, hardware acceleration, and keep-screen-on mode.
  - Pre-compiled ready-to-install `ChatterNoor.apk`.

---

## 🚀 Quick Start

### 1. Web Browser (Direct Play)
Simply open [`index.html`](index.html) in any modern web browser (Chrome, Edge, Firefox, Safari).

### 2. Install on Android
Download [`ChatterNoor.apk`](ChatterNoor.apk) directly to your Android device and install it.

---

## 🛠️ Building the APK (Termux / Android SDK)

To rebuild the APK from source:

```bash
cd android
./build_apk.sh
```

The script will automatically compile Java sources, package assets, convert to DEX with `d8`, align with `zipalign`, and sign the APK with `apksigner`.

---

## 📂 Project Structure

```text
ChatterNoor/
├── index.html                   # Web application & interactive companion HUD
├── ChatterNoor.apk              # Pre-built signed APK for Android devices
├── android/                     # Android native project wrapper
│   ├── AndroidManifest.xml      # App permissions and activity config
│   ├── build_apk.sh             # Automated APK compilation script
│   ├── res/                     # Android app resources (strings, styles)
│   ├── assets/                  # Bundled assets (index.html)
│   └── src/                     # Native Java source code (MainActivity.java)
├── .gitignore
└── README.md
```

---

## 🔑 Setup API Key

1. Launch **Chatter Noor**.
2. Click the **⚙️ Settings** icon in the header.
3. Enter your Google Gemini API Key.
4. Select your preferred model (e.g., `gemini-2.5-flash`) or tap **🔍 DISCOVER ACCOUNT MODELS LIVE**.
5. Save and start chatting with Noor!

---

## 🤝 Open for Edits & Contributions

This repository is **public** and open for forks, edits, pull requests, and enhancements!
