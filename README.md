# Presynce

**Design and Implementation of a Google Meet Attendance System with Standardized Alphabetical Name Formatting and Periodic Reporting**

Presynce is a serverless, dual-component attendance management system for Google Meet. A Chrome Extension captures live attendance data from the meeting interface, and a companion web dashboard standardizes participant names, organizes records into groups, and generates longitudinal attendance reports.

> Capstone research project — BS Computer Science.

---

## ✨ Features

- **Live attendance capture** — tracks participant join times and total duration present directly from the Google Meet UI, including rejoins.
- **Standardized name formatting** — automatically reformats participant display names into `Last Name, First Name M.` and sorts alphabetically.
- **Session records** — view, search, rename, and manage individual attendance sessions.
- **Groups & Matrix Viewer** — tag sessions to a group (class, section, team) and view consolidated, spreadsheet-style attendance across every session in that group.
- **Attendance Rules** — optional Present / Late / Absent logic based on join time, duration coverage, or both.
- **Find Absentees** — compares a group's roster against a session's participants to instantly list who was missing.
- **Host/Observer isolation** — exclude up to 3 non-attendee participants (hosts, TAs, observers) per record from counts and exports.
- **Exports** — Excel (`.xlsx`) and printable PDF, for both single sessions and full group matrices.
- **Cloud backup & restore** — optional Google Sign-In with Firebase to back up and restore records/groups across devices.
- **Local-first** — all data is stored in the browser by default; cloud sync is opt-in.

---

## 🛠 Tech Stack

| Layer                  | Technology                                                 |
| ---------------------- | ---------------------------------------------------------- |
| Extension              | Chrome Extension, Manifest V3                              |
| Frontend               | Vanilla HTML / CSS / JavaScript                            |
| Styling                | Tailwind CSS v4, Material Symbols, Quicksand               |
| Data (local)           | Browser `localStorage`                                     |
| Data (cloud, optional) | Firebase Authentication (Google Sign-In) + Cloud Firestore |
| Exports                | SheetJS (`xlsx-js-style`), browser print-to-PDF            |
| Hosting                | Vercel                                                     |

---

## 📁 Project Structure

This is a monorepo containing two independently-deployed components: the **web dashboard** (deployed to Vercel) and the **Chrome Extension** (packaged and submitted to the Chrome Web Store). They are not the same platform and do not share a build/deploy pipeline — they're kept in one repository for thesis documentation and source-code presentation purposes.

```
presynce/
├── web/                          # → deployed to Vercel
│   ├── index.html                # Landing page
│   ├── pages/
│   │   ├── saveAttendance.html   # My Records dashboard
│   │   ├── recordViewer.html     # Session Viewer (single record)
│   │   ├── matrixViewer.html     # Group Matrix Viewer
│   │   ├── classesPage.html      # Groups / folders
│   │   ├── howToTutorials.html   # Guide & FAQs
│   │   ├── signin.html           # Sign-in + cloud backup/restore
│   │   ├── contactUs.html
│   │   ├── privacyPolicy.html
│   │   └── termsOfService.html
│   ├── src/
│   │   ├── features/             # Page-specific controllers
│   │   │   ├── attendanceDashboard.js
│   │   │   ├── recordViewer.js
│   │   │   ├── matrixViewer.js
│   │   │   ├── groupManager.js
│   │   │   ├── createGroupFolder.js
│   │   │   ├── tutorialLibrary.js
│   │   │   └── email.js
│   │   ├── shared/                # Cross-page utilities
│   │   │   ├── firebaseConfig.js
│   │   │   ├── authManager.js
│   │   │   ├── backupManager.js
│   │   │   ├── authRequiredModal.js
│   │   │   ├── assignGroupModal.js
│   │   │   ├── reusableModal.js
│   │   │   ├── navAuth.js
│   │   │   ├── loadComponents.js
│   │   │   ├── page.js
│   │   │   ├── tocSpy.js
│   │   │   ├── trapezoid-engine.js
│   │   │   └── utils.js
│   │   └── css/
│   │       └── input.css
│   ├── components/                # Reusable HTML fragments (loaded via fetch)
│   │   ├── assignGroupModal.html
│   │   └── reusableModal.html
│   ├── dist/output.css            # Compiled Tailwind (generated)
│   └── package.json
│
└── extension/                     # → packaged and submitted to the Chrome Web Store
    ├── content.js
    ├── popup.html
    └── manifest.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Google Chrome

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/presynce.git
cd presynce/web
npm install
```

### 2. Build Tailwind CSS

```bash
npm run dev     # watch mode
npm run build   # production build (minified)
```

### 3. Configure Firebase (optional — required only for cloud backup)

Create a Firebase project (Spark/free plan is enough) and enable:

- **Authentication → Sign-in method → Google**
- **Firestore Database** (production mode), with rules:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{uid} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
  ```
- **Authentication → Settings → Authorized domains** — add your deployed domain.

Paste your web app config into `src/shared/firebaseConfig.js`.

### 4. Run locally

Serve the project root with any static server (e.g. `npx serve .`) and open `index.html`.

### 5. Load the Chrome Extension (local testing)

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` folder
4. In `extension/content.js`, set `DEV_MODE` and `PROD_URL` to match your environment

The extension is submitted to the **Chrome Web Store** separately as a packaged `.zip` of the `extension/` folder — it is not auto-deployed from this repo.

---

## 🌐 Deployment

| Component    | Where            | How                                                                                                                                                              |
| ------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web/`       | Vercel           | Set Vercel's **Root Directory** to `web/` in project settings; deploys on push.                                                                                  |
| `extension/` | Chrome Web Store | Manually zipped and uploaded via the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) — not connected to this repo's CI/CD. |

Before deploying to production:

- Set `DEV_MODE = false` and `PROD_URL` to the live Vercel domain in `extension/content.js`, then repackage and re-upload the extension.
- Confirm the Vercel domain is added to Firebase Authorized Domains.
- Confirm Firestore rules are locked per-account (see above).

---

## ⚠️ Known Limitations

- Records and groups are stored in the browser's `localStorage`; clearing site data or switching browsers/devices will remove local data (cloud backup is the recovery path for this).
- A retention ceiling of 500 records is enforced — older records are trimmed automatically past that.
- Name standardization depends on the display name Google Meet reports; it cannot correct or verify a participant's identity.
- Requires the Google Chrome desktop browser; not built for mobile.

---

## 📄 License

**All Rights Reserved.** This repository is made publicly viewable for academic evaluation, thesis documentation, and portfolio purposes only. No part of this code may be copied, reproduced, modified, or redistributed without the author's prior written permission. See [`LICENSE`](./LICENSE) for the full statement.

---

## 👤 Author

**Caitlin Gail D. Abizar**
BS Computer Science
