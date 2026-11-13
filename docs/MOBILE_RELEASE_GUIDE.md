# Mobile Build, Testing & Store Submission Guide

This guide details how to configure CI secrets, generate release signing credentials, and dispatch automated builds for **Google Play Console Internal Testing** and **Apple TestFlight**.

---

## 1. Overview of Automated Pipelines

| Platform | Workflow | Trigger | Output |
|---|---|---|---|
| **Android** | `.github/workflows/mobile-release-android.yml` | Tag (`v*.*.*-android` or `v*.*.*`) or `workflow_dispatch` | Signed `.aab` + Auto-upload to Play Console Internal Testing track |
| **iOS** | `.github/workflows/mobile-release-ios.yml` | Tag (`v*.*.*-ios` or `v*.*.*`) or `workflow_dispatch` | Signed `.ipa` + Auto-upload to Apple TestFlight via Fastlane |

---

## 2. Android: Release Keystore & Play Console Secrets

### Step 2.1: Generate Production Keystore (One-Time)
Run the following locally to generate the release signing key:
```bash
keytool -genkey -v -keystore esperanza-release.keystore \
  -alias esperanza \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

To encode the keystore for GitHub Secrets:
```bash
base64 -w 0 esperanza-release.keystore > keystore_base64.txt
# (On macOS, use: base64 -i esperanza-release.keystore | pbcopy)
```

### Step 2.2: Google Play Service Account (for Automated Uploads)
1. In **Google Cloud Console**, create a service account and grant it the **Service Account User** role.
2. In **Google Play Console** -> **API access**, link the Google Cloud project and grant the service account permissions to manage releases for `tech.npts.esperanza`.
3. Create and download a JSON key for the service account.

### Step 2.3: Configure GitHub Repository Secrets
Add these secrets in GitHub (`Settings` -> `Secrets and variables` -> `Actions`):
- `ANDROID_KEYSTORE_BASE64`: Contents of the base64-encoded keystore file.
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password.
- `ANDROID_KEY_ALIAS`: `esperanza` (or chosen alias).
- `ANDROID_KEY_PASSWORD`: Key password.
- `PLAY_STORE_JSON_KEY`: Entire plain text of the Google Play service account JSON key.

---

## 3. iOS: Apple Developer Portal & TestFlight Secrets

### Step 3.1: App Store Connect API Key
1. Go to **App Store Connect** -> **Users and Access** -> **Integrations** -> **App Store Connect API**.
2. Generate an API Key with **App Manager** or **Admin** access.
3. Download the `.p8` key file, note the **Key ID** and **Issuer ID**.

### Step 3.2: Export Apple Distribution Certificate & Provisioning Profile
1. In Apple Developer Portal, ensure an **App ID** (`tech.npts.esperanza`) exists.
2. Create an **Apple Distribution** certificate and download it.
3. Export it from Keychain Access as a `.p12` file with a password.
4. Base64-encode the `.p12` file:
   ```bash
   base64 -i distribution.p12 | pbcopy
   ```
5. Create an **App Store Provisioning Profile** for `tech.npts.esperanza`, download it, and base64-encode it:
   ```bash
   base64 -i profile.mobileprovision | pbcopy
   ```

### Step 3.3: Configure GitHub Repository Secrets
Add these secrets in GitHub (`Settings` -> `Secrets and variables` -> `Actions`):
- `APPLE_TEAM_ID`: 10-character Apple Team ID (e.g. `ABCDE12345`).
- `APPLE_ID`: Your Apple Developer account email.
- `APP_STORE_CONNECT_API_KEY_KEY_ID`: Key ID from App Store Connect.
- `APP_STORE_CONNECT_API_KEY_ISSUER_ID`: Issuer ID (UUID format).
- `APP_STORE_CONNECT_API_KEY_KEY`: Contents of the `.p8` key file (base64-encoded).
- `APPLE_CERTIFICATE_BASE64`: Contents of the `.p12` certificate (base64-encoded).
- `APPLE_CERTIFICATE_PASSWORD`: Password for the exported `.p12` certificate.
- `APPLE_PROVISIONING_PROFILE_BASE64`: Contents of `.mobileprovision` (base64-encoded).

---

## 4. Triggering Releases

### Option A: Via GitHub Tagging
```bash
# Release both Android and iOS
git tag v1.0.0
git push origin v1.0.0

# Release Android only
git tag v1.0.0-android
git push origin v1.0.0-android

# Release iOS only
git tag v1.0.0-ios
git push origin v1.0.0-ios
```

### Option B: Via GitHub Actions UI (Manual Dispatch)
1. Go to **Actions** in GitHub.
2. Select **Mobile Release - Android** or **Mobile Release - iOS (TestFlight)**.
3. Click **Run workflow**, choose the branch, and run.
