# Store Compliance & Privacy Documentation

This guide provides the exact answers required for the **Apple App Store Privacy Nutrition Labels** and **Google Play Console Data Safety Form**.

---

## 1. Apple App Store Privacy Nutrition Labels

### Does this app collect data?
**Yes**, Esperanza collects user-provided and device data for authentication, communications, and app functionality.

### Data Types Collected:
1. **Contact Info**
   - **Name:** Collected for profile display and RSVP identification.
     - *Linked to User:* Yes.
     - *Used for Tracking:* No.
     - *Purposes:* App Functionality.
   - **Email Address:** Collected for authentication (`better-auth`) and notification updates.
     - *Linked to User:* Yes.
     - *Used for Tracking:* No.
     - *Purposes:* App Functionality, Account Management.
   - **Phone Number (Optional):** Collected only if provided by community providers for contact details.
     - *Linked to User:* Yes.
     - *Used for Tracking:* No.
     - *Purposes:* App Functionality.

2. **Identifiers**
   - **User ID:** Unique internal database ID.
     - *Linked to User:* Yes.
     - *Used for Tracking:* No.
     - *Purposes:* App Functionality.
   - **Device Token (Push Notification Token):** APNs device token for push reminders and alerts.
     - *Linked to User:* Yes.
     - *Used for Tracking:* No.
     - *Purposes:* App Functionality.

3. **User Content**
   - **Event RSVPs & Interests:** Event bookmarks and community category preferences.
     - *Linked to User:* Yes.
     - *Used for Tracking:* No.
     - *Purposes:* App Functionality.

4. **Diagnostics / Performance**
   - **Crash / Performance Data:** Error diagnostics generated only during active requests.
     - *Linked to User:* No.
     - *Used for Tracking:* No.
     - *Purposes:* Analytics / App Reliability.

### Apple Tracking Declaration
- **Does the app track users across other companies' apps or websites?**
  **NO.** (No IDFA requested, no third-party ad networks used).

---

## 2. Google Play Console Data Safety Form

### Data Collection & Sharing Summary
- **Data shared with third parties:** **No**. No user data is shared with third parties or advertisers.
- **Data encrypted in transit:** **Yes**. All communications use HTTPS/TLS.
- **Can users request data deletion?** **Yes**. Users can delete their profile or submit deletion requests at `privacy@npts.tech`.

### Detailed Data Types (Google Play):

| Category | Data Field | Collected? | Shared? | Required / Optional | Purpose |
|---|---|---|---|---|---|
| **Personal info** | Name | Yes | No | Required for RSVP/profile | App functionality, Account management |
| **Personal info** | Email address | Yes | No | Required | Account management, Authentication |
| **Personal info** | Phone number | Yes (Optional) | No | Optional (Providers only) | App functionality |
| **App activity** | App interactions | Yes | No | Automatic | App functionality (RSVPs, categories) |
| **Device or other IDs**| Push Device Token | Yes | No | Optional / Permission-based | App functionality (Push alerts) |

---

## 3. Age & Content Rating Classification (IARC / ESRB / PEGI)

- **Violence / Gore:** None.
- **Sexuality / Nudity:** None.
- **Language / Profanity:** None.
- **Controlled Substances:** None.
- **Gambling / Contests:** None.
- **User Interaction:** Users can view community service listings and post RSVPs.
- **Resulting Rating:**
  - Apple: **4+** (No objectionable content).
  - Google Play / IARC: **Everyone** / PEGI 3.
