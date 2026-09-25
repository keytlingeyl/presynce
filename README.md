# Presynce

**Design and Implementation of a Google Meet Attendance System with Standardized Alphabetical Name Formatting and Periodic Reporting**

Presynce is a serverless, dual-component attendance management system for Google Meet. A Chrome Extension captures live attendance data from the meeting interface, and a companion web dashboard standardizes participant names, organizes records into groups, and generates longitudinal attendance reports.

> Capstone research project — BS Computer Science.

---

## 🚀 Live Access and Downloads

- 🧩 **Chrome Extension**: [Install from Chrome Web Store](https://chrome.google.com/webstore)
- 📊 **Web Dashboard**: [https://presynce.vercel.app](https://presynce.vercel.app/)

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

## 📖 How It Works

1. **Install Extension**: Add the Presynce Chrome Extension to your browser.
2. **Track Meeting**: Join a Google Meet call and click the floating **Track Attendance** button.
3. **Automatic Redirect**: Ending the call compiles the session and opens your **My Records** dashboard.
4. **Organize & Export**: Assign sessions to Group Folders, inspect matrix reports, and export as CSV or PDF.

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

## ⚠️ Known Limitations

- **Local storage:** Records and groups are stored in the browser's `localStorage` by default. Clearing site data or switching browsers or devices removes locally stored records unless they have been backed up to the cloud.
- **Record retention:** A maximum of 500 attendance records is retained locally. Older records are automatically trimmed when the limit is exceeded.
- **Name standardization:** Name formatting depends on the participant display name reported by Google Meet and cannot independently verify a participant's identity.
- **Google Meet dependency:** Attendance capture depends on information exposed through the Google Meet meeting interface and may be affected by changes to Google Meet.
- **Desktop browser requirement:** The Chrome Extension requires Google Chrome on a desktop environment and is not designed for mobile browsers.
- **Cloud backup:** Cloud backup is optional and requires Google Sign-In. Local attendance tracking does not require an account.

---

## 📄 License

**All Rights Reserved.** This repository is made publicly viewable for academic evaluation, thesis documentation, and portfolio purposes only. No part of this code may be copied, reproduced, modified, or redistributed without the author's prior written permission. See [`LICENSE`](./LICENSE) for the full statement.

---

## 👤 Author

**Caitlin Gail D. Abizar**
BS Computer Science
