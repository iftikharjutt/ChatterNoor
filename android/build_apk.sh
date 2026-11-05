#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Ensure assets are up-to-date from root if available
if [ -f "$DIR/../index.html" ]; then
  mkdir -p "$DIR/assets"
  cp "$DIR/../index.html" "$DIR/assets/index.html"
fi

ANDROID_SDK="${ANDROID_SDK:-$HOME/android-sdk}"
ANDROID_JAR="${ANDROID_JAR:-$ANDROID_SDK/platforms/android-34/android.jar}"
D8_BIN="${D8_BIN:-$ANDROID_SDK/build-tools/36.0.0/d8}"
KEYSTORE="${KEYSTORE:-$HOME/.android/debug.keystore}"

mkdir -p gen bin

echo "1. Generating R.java with aapt..."
aapt package -f -m -J gen -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

echo "2. Compiling Java sources with javac (Java 8 bytecode)..."
javac -source 8 -target 8 -Xlint:-options -d bin -cp "$ANDROID_JAR:gen" \
  src/com/antigravity/chatternoor/*.java gen/com/antigravity/chatternoor/*.java

echo "3. Converting bytecode to DEX with d8..."
bash "$D8_BIN" bin/com/antigravity/chatternoor/*.class --output bin/ --lib "$ANDROID_JAR"

echo "4. Packaging APK resources with aapt..."
aapt package -f -M AndroidManifest.xml -S res -A assets -I "$ANDROID_JAR" -F bin/unaligned.apk

echo "5. Adding classes.dex to APK..."
cd bin
zip -u -0 unaligned.apk classes.dex
cd "$DIR"

echo "6. Aligning APK with zipalign..."
zipalign -f -p 4 bin/unaligned.apk bin/aligned.apk

echo "7. Signing APK with apksigner..."
apksigner sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android --out bin/ChatterNoor.apk bin/aligned.apk

echo "8. Verifying APK..."
apksigner verify bin/ChatterNoor.apk

cp -f bin/ChatterNoor.apk "$DIR/../ChatterNoor.apk"

echo ""
echo "🎉 Build Complete! ChatterNoor.apk successfully created in bin/ and repo root!"
