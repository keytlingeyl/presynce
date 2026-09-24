// =====================================================
// TUTORIAL LIBRARY — Guide & FAQs (howToTutorials.html)
// Visual Tutorial Library: browsable shelves + searchable
// flat results + a single-tutorial detail view. Supports
// deep links from other pages via ?feature=<tutorial-id>.
// =====================================================

// ---- CATEGORY METADATA (order = shelf order) -------------------------
// headerIconClass  -> used for shelf-title icon/text sitting directly on the blue page background
// thumbClass/thumbIconClass -> used inside white cards (thumbnail area)
// badgeClass -> used inside white cards (small icon badge, e.g. detail view header)
const TUTORIAL_CATEGORIES = [
  { id: "extension", label: "Chrome Extension", icon: "videocam", headerIconClass: "text-emerald-300", thumbClass: "bg-gradient-to-br from-emerald-50 to-emerald-100", thumbIconClass: "text-emerald-500", badgeClass: "bg-emerald-50 text-emerald-600" },
  { id: "records", label: "My Records", icon: "folder_open", headerIconClass: "text-amber-300", thumbClass: "bg-gradient-to-br from-amber-50 to-amber-100", thumbIconClass: "text-amber-500", badgeClass: "bg-amber-50 text-amber-600" },
  { id: "viewer", label: "Detailed Viewer", icon: "frame_inspect", headerIconClass: "text-rose-300", thumbClass: "bg-gradient-to-br from-rose-50 to-rose-100", thumbIconClass: "text-rose-500", badgeClass: "bg-rose-50 text-rose-600" },
  { id: "groups", label: "Groups", icon: "groups", headerIconClass: "text-orange-300", thumbClass: "bg-gradient-to-br from-orange-50 to-orange-100", thumbIconClass: "text-orange-500", badgeClass: "bg-orange-50 text-orange-600" },
  { id: "matrix", label: "Matrix Viewer", icon: "grid_view", headerIconClass: "text-slate-200", thumbClass: "bg-gradient-to-br from-slate-100 to-slate-200", thumbIconClass: "text-slate-500", badgeClass: "bg-slate-100 text-slate-600" },
  { id: "account", label: "Account & Cloud Backup", icon: "account_circle", headerIconClass: "text-violet-300", thumbClass: "bg-gradient-to-br from-violet-50 to-violet-100", thumbIconClass: "text-violet-500", badgeClass: "bg-violet-50 text-violet-600" },
];

function getCategoryMeta(categoryId) {
  return TUTORIAL_CATEGORIES.find((c) => c.id === categoryId) || TUTORIAL_CATEGORIES[0];
}

// ---- TUTORIAL DATA -----------------------------------------------------
const TUTORIALS = [
  {
    id: "track-attendance",
    category: "extension",
    icon: "videocam",
    title: "Track Attendance",
    desc: "Capture attendance live from a Google Meet call.",
    overview: "The Presynce Chrome Extension runs inside a live Google Meet session and captures attendance automatically. Once activated, it detects every participant visible in the meeting, along with their join time and how long they stay present — including rejoins. Use this feature at the start of any Google Meet session you need attendance data for.",
    steps: [
      {
        text: 'Install Chrome Extension <a href="" target="_blank" class="font-semibold text-blue-600">here</a>. Join your Google Meet session as usual, in Google Chrome, with the Presynce extension installed and enabled.',
      },
      {
        text: "Once you're in the meeting view, a floating <b>Track Attendance</b> button appears near the bottom-left of the window.",
        image: "../assets/tutorial/Track_2.png",
        note: "If you don't see the button, try opening the participants panel list or refresh the page.",
      },
      {
        text: 'Click <b>Track Attendance</b> to begin. The extension automatically opens the meeting\'s Participants panel, and the button briefly reads "Starting...Please wait" while this happens.',
        image: "../assets/tutorial/Track_3.png",
        note: "Remember: Attendance tracking will start only after you click the <b>Track Attendance</b> button. If you don't see the button, try opening the <b>Participants</b> tab or refreshing the page.",
      },
      {
        text: 'Once tracking starts, the same button label updates to show the running duration (e.g., "Tracking Attendance for 4 min 19s · Click To Generate Report").',
        image: "../assets/tutorial/Track_4.png",
        note: "You should click the same button again to stop tracking attendance and generate the report.",
      },
      {
        text: "Attendance continues recording automatically in the background for as long as the meeting runs. No further action is needed until you're ready to stop tracking.",
        note: "Remember: You may lose the attendance report if you close the tab before generating the report.",
      },
      {
        text: "When you're ready to stop, click the <b>Tracking Attendance</b> button again to stop tracking and generate the report. Presynce compiles the session into a report and opens the <b>My Records</b> dashboard in a new tab with the record already saved.",
      },
    ],
    note: "If Presynce can't detect participants, a warning banner appears with an option to recover the report. See Background &amp; System Concepts for details.",
  },
  {
    id: "viewing-searching",
    category: "records",
    icon: "search",
    title: "Viewing &amp; Searching Records",
    desc: "Browse, filter, and page through every tracked session.",
    overview: "The My Records dashboard is the home base for every attendance session Presynce has captured. From here you can browse, search, and manage all previously tracked sessions.",
    steps: [
      { text: "Open the <b>Records</b> tab in the top navigation bar.", image: "../assets/tutorial/View_1.png" },
      { text: "All saved sessions appear in a table, newest first, showing Report No., Meeting Name, Meeting Code, Report Date, Generated Time, Duration, Total Participants, and Group Tag.", image: "../assets/tutorial/View_2.png" },
      { text: "To find a specific record, type into the <b>Search by name, code or tag...</b> field. Results filter as you type, matching meeting name, meeting code, or assigned group tag.", image: "../assets/tutorial/View_3.png" },
      { text: "Use the ◀ ▶ arrows in the top-right of the control panel to page through records when there are more than 50 in the list.", image: "../assets/tutorial/View_4.png" },
    ],
  },
  {
    id: "renaming-meeting",
    category: "records",
    icon: "edit",
    title: "Renaming a Meeting",
    desc: "Give a generic meeting link a name you'll recognize.",
    overview: "Meeting names pulled from Google Meet are sometimes generic or reused across recurring links. This feature lets you rename a session directly in the records table for easier identification later.",
    steps: [{ text: "In the My Records table, locate the <b>Meeting Name</b> cell for the record you want to rename." }, { text: "Click directly on the name — the field becomes editable in place.", image: "../assets/tutorial/RenameInDashboard_2.png" }, { text: "Type the new name." }, { text: "Press <b>Enter</b>, or click elsewhere on the page, to save it.", image: "../assets/tutorial/RenameInDashboard_4.png" }],
    note: 'If you leave the field blank, the system automatically reverts it to "Google Meet Session."',
  },
  // {
  //   id: "recovering-past-meeting",
  //   category: "records",
  //   icon: "restore",
  //   title: "Recovering a Past Meeting",
  //   desc: "Restore an older meeting's attendance data.",
  //   overview: "A shortcut intended for restoring an older meeting's attendance data that isn't currently listed on the dashboard.",
  //   steps: [{ text: "Click <b>Recover Past Meeting</b> in the records control panel.", placeholder: true }],
  //   note: 'Current status: this feature is marked "coming soon." Clicking the button currently shows an informational message only — no recovery action is performed yet.',
  // },
  {
    id: "auto-backup",
    category: "records",
    icon: "cloud_sync",
    title: "Auto Backup Toggle",
    desc: "Turn automatic backups on or off.",
    overview: "A toggle switch indicating whether attendance records should be automatically kept backed up. When enabled, the switch and label turn green; when disabled, they appear grey.",
    steps: [
      { text: "Locate the <b>Auto Backup</b> toggle in the records control panel.", image: "../assets/tutorial/AutoBackupToggle_1.png" },
      { text: "Click the toggle to switch between <b>enabled</b> and <b>disabled</b>." },
      {
        text: "The label and color update immediately to reflect the new state.",
        image: "../assets/tutorial/AutoBackupToggle_3.png",
        note: "If you turn this on while signed out, a Sign-in Required prompt appears — Auto Backup needs a linked Google Account. See Signing in with Google.",
      },
      { text: "Here's the look for signed in state.", image: "../assets/tutorial/AutoBackupToggle_4.png" },
    ],
  },
  {
    id: "group-tag",
    category: "records",
    icon: "sell",
    title: "Assigning a Group Tag",
    desc: "Tag a session to a class or group for reporting.",
    overview: 'Group Tags let you organize individual attendance sessions into named groups (e.g., "BSIT 4-1") so they can be viewed together later in the Matrix Viewer. A record can only belong to one group at a time. This feature is accessible from both the My Records table and the Detailed Record Viewer.',
    steps: [
      {
        text: "From My Records, click the <b>Tag Group</b> button (or the existing tag badge) in the Group Tag column. From the Detailed Record Viewer, click the group icon box at the top-right instead.",
        image: "../assets/tutorial/GroupTagInDashboard_1.png",
      },
      {
        text: "The <b>Manage Group Assignment Tag</b> modal opens and shows the meeting details.",
        note: 'You can also tag records into a group in the Session Viewer. <a href="howToTutorials.html?feature=group-record" class="font-semibold text-blue-600">See How</a>',
        image: "../assets/tutorial/GroupTagInDashboard_2.png",
      },
      { text: "Use the <b>Save this record to</b> dropdown to choose an existing group.", image: "../assets/tutorial/GroupTagInDashboard_3.png" },
      { text: "Click <b>Update Group Tag</b> to save.", image: "../assets/tutorial/GroupTagInDashboard_4.png" },
      { text: "Click the × in the top-right corner, or click outside the modal, to close it without saving." },
    ],
    note: "If no groups exist yet, create one first — click Manage groups here active link to see the Groups page.",
  },
  {
    id: "deleting-record",
    category: "records",
    icon: "delete",
    title: "Deleting a Record",
    desc: "Permanently remove a session from the system.",
    overview: "Permanently removes an attendance record from the system.",
    steps: [{ text: "In the My Records table, locate the record you want to remove." }, { text: "Click the trash icon in the <b>Delete</b> column.", image: "../assets/tutorial/DeleteRecord_2.png" }, { text: "Confirm the deletion in the prompt that appears.", image: "../assets/tutorial/DeleteRecord_3.png" }],
    note: "Warning: this action is permanent and cannot be undone.",
  },
  {
    id: "inspecting-report",
    category: "records",
    icon: "frame_inspect",
    title: "Inspecting a Detailed Report",
    desc: "Open the full participant breakdown of a session.",
    overview: "Opens the full breakdown of a single attendance record, listing every participant with their join time, attendance duration, and attendance percentage.",
    steps: [
      {
        text: "In the My Records table, click <b>Inspect</b> in the View Report column for the record you want to open.",
        image: "../assets/tutorial/InspectRecord.png",
      },
      {
        text: 'The Session Viewer will open, displaying the detailed attendance report for the selected session. Notice that names are standardized in <code class="bg-slate-100 px-1.5 py-0.5 rounded text-brand-board font-semibold">Last Name, First Name M.</code> format and arranged alphabetically.',
        image: "../assets/tutorial/SessionViewer.png",
      },
    ],
  },
  {
    id: "meeting-details-overview",
    category: "viewer",
    icon: "info",
    title: "Meeting Details Overview",
    desc: "Read a session's summary metadata at a glance.",
    overview: "The top panel of the Detailed Record Viewer summarizes the key metadata for a session: meeting name, code, participant count, date, time range, and total duration.",
    steps: [{ text: "Open any record via <b>Inspect</b> from My Records." }, { text: "Review the summary panel at the top of the page.", image: "../assets/tutorial/RecordDetails_2.png" }, { text: "Use the <b>← Records List</b> button at the top-left at any time to return to the My Records dashboard.", image: "../assets/tutorial/RecordDetails_3.png" }],
  },
  {
    id: "group-record",
    category: "viewer",
    icon: "groups",
    title: "Assign a Record to a Group",
    desc: "Tag a session to a class or group for reporting.",
    overview: 'Group Tags let you organize individual attendance sessions into named groups (e.g., "BSIT 4-1") so they can be viewed together later in the Matrix Viewer. A record can only belong to one group at a time. This feature is accessible from both the My Records table and the Session Viewer.',
    steps: [
      { text: "From <b>My Records</b>, click <b>Inspect</b> on a record to open the <b>Session Viewer</b>." },
      {
        text: "In the <b>Session Viewer</b>, click the group icon box at the top-right.",
        note: 'You can also tag records into a group in the My Records table. <a href="howToTutorials.html?feature=group-tag" class="font-semibold text-blue-600">See How</a>',
        image: "../assets/tutorial/GroupRecord_2.png",
      },
      { text: "The <b>Manage Group Assignment Tag</b> modal opens and shows the meeting details.", image: "../assets/tutorial/GroupRecord_3.png" },
      { text: "Use the <b>Save this record to</b> dropdown to select an existing group.", image: "../assets/tutorial/GroupRecord_4.png" },
      { text: "Click <b>Update Group Tag</b> to save the group assignment.", image: "../assets/tutorial/GroupRecord_5.png" },
      { text: "To close the modal without making changes, click the <b>×</b> in the top-right corner or click outside the modal." },
    ],
    note: "If no groups exist yet, create one first by clicking the <b>Manage custom groups here</b> link to open the Groups page.",
  },
  {
    id: "find-absentees",
    category: "viewer",
    icon: "person_search",
    title: "Finding Absentees",
    desc: "See which members of a group's roster were absent from a session.",
    overview: "Find Absentees compares the members assigned to a session's group with the participants recorded for that session, making it easier to identify who was absent without manually checking the roster.",
    steps: [
      {
        text: "From <b>My Records</b>, click <b>Inspect</b> on a record to open the <b>Session Viewer</b>.",
      },
      {
        text: "If the record does not have a <b>Group Tag</b> assigned, click <b>Find Absentees</b> to see the warning that a group must be assigned first.",
        image: "../assets/tutorial/FindAbsentees_2.png",
      },
      {
        text: "Assign a <b>Group Tag</b> to the record.",
      },
      {
        text: "Click <b>Find Absentees</b> in the meeting details panel.",
        image: "../assets/tutorial/FindAbsentees_3.png",
      },
      {
        text: "The <b>Absentees List</b> appears below the participants table, showing the members who were expected but were not recorded as present for that session.",
        image: "../assets/tutorial/FindAbsentees_5.png",
      },
    ],
    note: "Find Absentees requires a <b>Group Tag</b> because the assigned group determines the expected roster for the session.",
  },
  {
    id: "exporting-data",
    category: "viewer",
    icon: "download",
    title: "Exporting Attendance Data",
    desc: "Download as Excel or print out a PDF.",
    overview: "Lets you export a session's attendance data for use outside Presynce — as a Excel spreadsheet or a printable PDF.",
    steps: [
      { text: "From <b>My Records</b>, click <b>Inspect</b> on a record to open the <b>Session Viewer</b>." },
      {
        text: "Click the <b>Export options...</b> dropdown at the top-right.",
        image: "../assets/tutorial/ExportRecord_2.png",
      },
      {
        text: "Choose <b>Export as Excel</b> for a spreadsheet-ready file. Isolated hosts/observers are automatically excluded.",
        image: "../assets/tutorial/ExportRecord_3.png",
      },
      { text: "Choose <b>Export as PDF</b> to open your browser's print dialog and save or print the view.", image: "../assets/tutorial/ExportRecord_4.png" },
    ],
  },
  {
    id: "isolating-hosts",
    category: "viewer",
    icon: "shield_person",
    title: "Isolating Hosts/Observers",
    desc: "Exclude hosts from the attendee count and exports.",
    overview: 'Some participants — the meeting host, a teaching assistant, an observer — shouldn\'t be counted as regular attendees. This feature lets you flag up to 3 names per session as "hosts/observers," separating them into their own table. <br><br> Isolated hosts/observers are left out of the Matrix Attendance, the Find Absentees counts, and Excel exports. <br><br> If the record is tagged to a Group, the isolation applies to that person in every record of the same group. You only need to isolate them once.',
    steps: [
      {
        text: "From <b>My Records</b>, click <b>Inspect</b> on a record to open the <b>Session Viewer</b>.",
      },
      {
        text: "Assign the record to a Group (recommended). Click the Group Tag button so the isolation carries over to the group's other records. Without a group, it applies to this record only.",
        note: "Isolation only applies within a group. Someone isolated in one group is not affected in another.",
      },
      {
        text: "Open the Isolated Hosts dropdown at the top-right and check each participant you want to isolate (maximum of 3 per record).",
        content: [
          {
            type: "note",
            text: "Your selections are saved automatically per record and applied again the next time you open that same report.",
          },
          {
            type: "image",
            src: "../assets/tutorial/IsolateHosts_3.png",
          },
        ],
      },
      {
        text: "Selected names move into a separate excluded-hosts table above the main participants table.",
        content: [
          {
            type: "image",
            src: "../assets/tutorial/IsolateHosts_4.png",
          },
          {
            type: "note",
            text: 'A "Group-wide" badge marks anyone isolated from another record of the group.',
          },
          {
            type: "image",
            src: "../assets/tutorial/IsolateHosts_4-1.png",
          },
        ],
      },
      { text: "Uncheck a name at any time to move it back into the regular Participants table." },
      {
        text: "<strong>Behavior with Find Absentees:</strong> The selected participant is excluded from the regular attendee count.",
        content: [
          {
            type: "note",
            text: "Find Absentees shows a notice listing who was excluded, so the counts always add up.",
          },
          {
            type: "image",
            src: "../assets/tutorial/IsolateHosts_6.png",
          },
        ],
      },
    ],
    note: "If a participant changes their display name between meetings, they are treated as a different person.",
  },
  {
    id: "creating-group",
    category: "groups",
    icon: "create_new_folder",
    title: "Creating a Group",
    desc: "Set up a folder to organize sessions by class.",
    overview: 'Groups (also shown as "Classes" or folders) let you organize multiple attendance sessions under a shared label — such as a class section — so they can be viewed together in the Matrix Viewer.',
    steps: [
      {
        text: "Open the <b>My Groups</b> tab in the top navigation bar.",
        image: "../assets/tutorial/CreateGroup_1.png",
      },
      { text: "Click <b>+ Create New Group</b>.", image: "../assets/tutorial/CreateGroup_2.png" },
      { text: "Enter a <b>Group Name</b> (required) — a class, section, block, or any naming convention that fits your workflow." },
      { text: "Optionally, enter the <b>Teacher / Handler</b> name." },
      { text: "Click <b>Save Group Profile</b> to create the group.", image: "../assets/tutorial/CreateGroup_5.png" },
    ],
  },
  {
    id: "opening-matrix",
    category: "groups",
    icon: "folder_open",
    title: "Opening a Group's Matrix",
    desc: "Jump into a group's longitudinal attendance view.",
    overview: "Opens the Matrix Viewer for a specific group, showing a consolidated attendance record across every session tagged to that group.",
    steps: [
      { text: "On the <b>My Groups</b> page, click over the folder for the group you want to open.", image: "../assets/tutorial/OpenFolder_1.png" },
      { text: "Want to open in new tab instead? Click the ⋮ (more options) icon on the folder. Then select <b>Open in new tab</b>.", image: "../assets/tutorial/OpenFolder_2.png" },
      { text: "The Matrix Viewer opens for that group.", image: "../assets/tutorial/OpenFolder_3.png" },
    ],
  },
  {
    id: "renaming-group",
    category: "groups",
    icon: "edit_note",
    title: "Renaming a Group",
    desc: "Update a group's display name across the system.",
    overview: "Updates a group's display name across the system.",
    steps: [{ text: "On the <b>My Groups</b> page, click the ⋮ icon on the group folder you want to rename." }, { text: "Select <b>Rename</b>.", image: "../assets/tutorial/RenameGroup_2.png" }, { text: "Enter the new name in the prompt and confirm.", image: "../assets/tutorial/RenameGroup_3.png" }],
    note: "All records currently tagged to the old group name are automatically updated to the new name.",
  },
  {
    id: "deleting-group",
    category: "groups",
    icon: "folder_delete",
    title: "Deleting a Group",
    desc: "Remove a group from the system.",
    overview: "Removes a group from the system.",
    steps: [{ text: "On the <b>My Groups</b> page, click the ⋮ icon on the group folder you want to delete." }, { text: "Select <b>Delete</b>.", image: "../assets/tutorial/DeleteGroup_2.png" }, { text: "Confirm the deletion.", image: "../assets/tutorial/DeleteGroup_3.png" }],
    note: "Warning: Deleting a group does not delete its attendance records — they remain in My Records but become untagged. Download and Share on the group menu are currently placeholders.",
  },
  {
    id: "matrix-viewer",
    category: "matrix",
    icon: "grid_view",
    title: "Reading the Attendance Matrix",
    desc: "See attendance across every session in a group.",
    overview: "The Matrix Viewer provides a consolidated, spreadsheet-style view of attendance across every session tagged to a group — one row per participant, one column per session — so you can spot attendance patterns at a glance.",
    steps: [
      { text: "Open a group's <b>Matrix Viewer</b> from the <b>My Groups</b> page." },
      {
        text: "Review the summary cards at the top: Tracked Sessions, Unique Members Found, and the group name.",
        content: [
          {
            type: "image",
            src: "../assets/tutorial/MatrixView.png",
          },
          {
            type: "note",
            text: "If no sessions have been tagged to a group yet, the Matrix Viewer shows an empty state instead of a table. To turn on the Late status, see Configuring Attendance Rules.",
          },
          {
            type: "image",
            src: "../assets/tutorial/MatrixEmpty.png",
          },
        ],
      },
      { text: "Scroll through the matrix table: each row is a participant, each column is a tracked session. A green check marks present, an amber alert marks late (only if Attendance Rules are enabled for this group), and a red X marks absent." },
      { text: "Use the scrollbars to navigate large matrices — names and row numbers stay frozen on the left." },
      { text: "Click <b>← Groups List</b> at any time to return to the Groups page." },
    ],
  },
  {
    id: "attendance-rules",
    category: "matrix",
    icon: "tune",
    title: "Configuring Attendance Rules",
    desc: "Define what counts as Present, Late, or Absent.",
    overview: "By default, the Matrix Viewer only tracks simple Present/Absent. Attendance Rules let a group additionally mark participants Late based on join time or how much of the session they attended, and let you decide whether Late should count as Present or Absent in the Total column.",
    steps: [{ text: "Open a group's Matrix Viewer." }, { text: "Click the <b>Attendance Rules</b> card in the summary row.", image: "../assets/tutorial/AttendanceRules_2.png" }, { text: "Choose <b>Enable Attendance Rules</b> to turn on Present/Late/Absent logic, or leave <b>No Attendance Rules</b> for the simple present/absent default.", image: "../assets/tutorial/AttendanceRules_3.png" }, { text: "Set the <b>Rule Basis</b> (By Join Time, By Duration Coverage, or Both), the Late threshold in minutes, and the Absent threshold percentage.", image: "../assets/tutorial/AttendanceRules_4.png" }, { text: "Choose whether Late should count as Present or Absent in the Total column, then click <b>Save Rules</b>.", image: "../assets/tutorial/AttendanceRules_5.png" }],
    note: "The Absent threshold always overrides Late/Present, no matter which Rule Basis you choose.",
  },
  {
    id: "exporting-matrix",
    category: "matrix",
    icon: "download",
    title: "Exporting the Attendance Matrix",
    desc: "Download the full matrix as a spreadsheet or PDF.",
    overview: "Just like individual session reports, the full attendance matrix for a group can be exported too — as a formatted spreadsheet or a printable PDF — so you can share or archive the group's whole longitudinal record outside Presynce.",
    steps: [{ text: "Open a group's Matrix Viewer." }, { text: "Click the <b>Export Options</b> card in the summary row.", image: "../assets/tutorial/ExportGroup_2.png" }, { text: "Choose <b>Export as Excel</b> to download a formatted spreadsheet with the same present/late/absent color-coding shown on screen.", image: "../assets/tutorial/ExportGroup_3.png" }, { text: "Choose <b>Export as PDF</b> to open your browser's print dialog and save or print the matrix.", image: "../assets/tutorial/ExportGroup_4.png" }],
    note: "The exported file mirrors your current Total Display setting (numbers, percentages, or both) and reflects whichever Attendance Rules are active for the group.",
  },
  {
    id: "signing-in",
    category: "account",
    icon: "login",
    title: "Signing in with Google",
    desc: "Link your Google Account to unlock cloud backup.",
    overview: "Signing in links a Google Account to Presynce so your records and groups can be backed up to the cloud and restored on another device. Presynce uses Google Sign-In — there's no separate Presynce password to manage.",
    steps: [{ text: "Open the <b>Sign in</b> tab in the top navigation bar." }, { text: "Click <b>Sign in with Google</b>.", image: "../assets/tutorial/Signin_2.png" }, { text: "Choose your Google Account in the popup window that appears." }, { text: "Once signed in, the page switches to your account view, showing your name, email, profile photo, and the date you first signed in.", image: "../assets/tutorial/Signin_4.png" }],
    note: "If the Google sign-in popup is blocked or closed before finishing, Presynce shows an error so you can try again.",
  },
  {
    id: "manual-backup",
    category: "account",
    icon: "backup",
    title: "Backing Up to the Cloud",
    desc: "Manually push this device's records and groups to the cloud.",
    overview: "Backup manually saves everything currently on this device — records and groups — to your signed-in Google Account's cloud storage, separate from the Auto Backup toggle on the Records page.",
    steps: [{ text: 'Sign in with your Google Account (see <a href="howToTutorials.html?feature=signing-in" class="font-semibold text-blue-600">Signing in with Google</a>).' }, { text: "On your account page, click <b>Backup Data</b>.", image: "../assets/tutorial/Backup_2.png" }, { text: "Review the comparison shown: how many records and groups are on this device versus what's already in the cloud.", image: "../assets/tutorial/Backup_3.png" }, { text: "Click <b>Confirm Backup</b> to upload this device's current records and groups.", image: "../assets/tutorial/Backup_4.png" }],
    note: "Backing up replaces the cloud copy with what's on this device — it does not merge with older cloud data.",
  },
  {
    id: "restore-backup",
    category: "account",
    icon: "cloud_download",
    title: "Restoring from a Cloud Backup",
    desc: "Bring your records and groups back from the cloud.",
    overview: "Restore pulls your previously backed-up records and groups from the cloud onto this device — useful when setting up Presynce on a new computer or browser.",
    steps: [{ text: "Sign in with your Google Account." }, { text: "On your account page, click <b>Restore</b>.", image: "../assets/tutorial/Restore_2.png" }, { text: "Review your last backup date and how many records/groups are stored in the cloud.", image: "../assets/tutorial/Restore_3.png" }, { text: "Optionally check <b>Merge with existing data</b> to combine the cloud data with what's already on this device, instead of replacing it." }, { text: "Click <b>Confirm Restore</b>.", image: "../assets/tutorial/Restore_5.png" }],
    note: "If no cloud backup exists yet for your account, Restore shows an empty state instead.",
  },
];

// ---- BACKGROUND & SYSTEM CONCEPTS (special, non-step detail entry) ----
const BACKGROUND_ENTRY = {
  id: "background",
  isBackground: true,
  icon: "psychology",
  title: "Background &amp; System Concepts",
  category: null,
  badgeClass: "bg-blue-100 text-blue-950",
  desc: "Storage, sync, and the logic behind the scenes.",
  sections: [
    { heading: "Data Storage Model", body: "All Presynce data — attendance records, groups, the auto-backup preference, and per-record host/observer exclusions — is currently stored client-side in the browser's localStorage. Because storage is local to the browser, records will not appear if you switch browsers, computers, or clear your browsing data. The system also enforces a retention ceiling of 500 total records; once exceeded, the oldest records are automatically trimmed." },
    { heading: "Chrome Extension ↔ Web Dashboard Communication", body: "The Chrome Extension and the web dashboard communicate through the browser's native cross-tab messaging API, not a server. The dashboard only accepts incoming attendance data from https://meet.google.com, and the extension only responds to its own configured dashboard origin — this prevents unauthorized scripts from injecting or requesting attendance data." },
    { heading: "Unsaved Report Recovery", body: "If the extension can't complete a report normally, it saves a temporary backup of the in-progress report to local storage. The next time the Track Attendance button becomes available, the extension automatically checks for this backup and offers to recover it before starting a new session." },
    { heading: "Automatic Name Standardization", body: "Names captured live from Google Meet aren't stored as typed. Before saving, the extension automatically reformats every participant name into a standardized \"Last Name, First Name M.\" structure, then sorts the full list alphabetically. Because this relies on the display name a participant chose, incomplete or altered names can't be corrected automatically." },
    { heading: "Record–Group Relationship", body: "Each record can be assigned to at most one group at a time. Deleting a group does not delete its records — it clears the group tag on any record that referenced it. The Matrix Viewer is generated fresh every time it's opened, by filtering all records for the current group and sorting chronologically." },
    { heading: "Attendance Status Logic", body: "By default, a group has no Attendance Rules, so the Matrix Viewer treats every session as a simple present/absent check. Once a group turns on Attendance Rules, a third \"Late\" status becomes possible: a participant is flagged Late based on their join time, how much of the session's duration they attended, or both, depending on the group's chosen Rule Basis — and the Absent threshold always overrides Late/Present regardless of basis. In the Detailed Record Viewer, the Attended Percentage bar is the recorded attended duration divided by total meeting duration, capped at 100%." },
    { heading: "Attendance Rules Are Per Group, Not Per Record", body: "Attendance Rules (enabled/disabled, Rule Basis, Late threshold, Absent threshold, and whether Late counts as Present or Absent) are stored on the group itself, so changing them affects how every session tagged to that group is evaluated in the Matrix Viewer going forward — you don't set rules per individual record." },
    { heading: "Auto Backup vs. Manual Backup/Restore", body: "There are two related but separate backup mechanisms. Auto Backup (on the Records page) is a toggle that, once turned on for a signed-in account, silently re-backs-up automatically whenever a record is added or deleted. Backup and Restore (on the Sign In / Account page) are manual, on-demand actions you trigger yourself. Turning on Auto Backup while signed out shows a Sign-in Required prompt, since both features need an authenticated Google Account to know where to save your data." },
    { heading: "How Cloud Backup Is Structured", body: "When signed in, a backup stores your device's full records array and groups array together as one document tied to your account. Restoring can either replace what's on this device with the cloud copy, or merge the two — combining record lists and de-duplicating groups by name — if you choose the merge option." },
    { heading: "Isolated Hosts/Observers Scope", body: "Host/observer isolation selections are stored per individual record, not per group, so the same person must be re-isolated separately on each session they appear as a host in. A maximum of 3 isolated names is enforced per record." },
    { heading: "Planned Features Not Yet Wired", body: "Download/Share (on each group's options menu) and Recover Past Meeting (My Records) are visible in the interface but currently only show a placeholder message rather than performing a real action." },
  ],
  terms: [
    ["Record", "A single tracked Google Meet session, including its metadata and full participant list."],
    ["Group / Class / Folder", "A user-defined label used to organize multiple records together for longitudinal reporting."],
    ["Assigned Group", "The group tag currently applied to a specific record."],
    ["Isolated Host/Observer", "A participant manually flagged, per record, to be excluded from the regular attendance count and Excel export."],
    ["Matrix", "The grid view showing every unique participant against every session in a group, with presence/absence markers."],
    ["Longitudinal Report", "Another term for the Matrix Viewer's cross-session attendance view."],
    ["Attendance Rules", "A group-level setting that turns on Present/Late/Absent grading in the Matrix Viewer, instead of the simple present/absent default."],
    ["Rule Basis", "Which measurement Attendance Rules use to flag someone Late: join time, duration coverage, or both."],
    ["Auto Backup", "A toggle on the Records page that automatically re-backs-up a signed-in account's data whenever records change."],
    ["Manual Backup / Restore", "On-demand actions from the Sign In / Account page to push this device's data to the cloud, or pull the cloud's data back down."],
  ],
};

// ---- STATE --------------------------------------------------------------
let activeCategory = "all";
let activeSearchQuery = "";
let activeSort = "default";
let deepLinkedId = null; // id the user was routed to directly (e.g. from an info box)

// ---- DOM READY ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  populateCategoryDropdown();
  wireLibraryControls();
  wireDetailControls();
  wireImageLightbox();

  renderLibrary();
  handleIncomingDeepLink();

  window.addEventListener("popstate", () => {
    handleIncomingDeepLink(true);
  });
});

function populateCategoryDropdown() {
  const select = document.getElementById("categoryFilterSelect");
  TUTORIAL_CATEGORIES.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.innerText = cat.label;
    select.appendChild(opt);
  });
}

function wireLibraryControls() {
  document.getElementById("tutorialSearchInput").addEventListener("input", (e) => {
    activeSearchQuery = e.target.value.trim().toLowerCase();
    renderLibrary();
  });
  document.getElementById("categoryFilterSelect").addEventListener("change", (e) => {
    activeCategory = e.target.value;
    renderLibrary();
  });
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    activeSort = e.target.value;
    renderLibrary();
  });
}

function wireDetailControls() {
  document.getElementById("backToLibraryBtn").addEventListener("click", () => goToLibrary());
  document.getElementById("backToLibraryBreadcrumb").addEventListener("click", () => goToLibrary());
}

// ---- DEEP LINK HANDLING (?feature=<id>) ---------------------------------
function handleIncomingDeepLink(isPopState) {
  const params = new URLSearchParams(window.location.search);
  const featureId = params.get("feature");

  if (featureId && (TUTORIALS.some((t) => t.id === featureId) || featureId === "background")) {
    deepLinkedId = isPopState ? deepLinkedId : featureId;
    openTutorial(featureId, { fromDeepLink: !isPopState });
  } else {
    goToLibrary(true);
  }
}

// ---- SORTING / FILTERING --------------------------------------------------
function sortTutorials(list) {
  const copy = [...list];
  if (activeSort === "steps-asc") {
    copy.sort((a, b) => (a.steps ? a.steps.length : 0) - (b.steps ? b.steps.length : 0));
  } else if (activeSort === "alpha") {
    copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  return copy;
}

function matchesSearch(tutorial) {
  if (!activeSearchQuery) return true;
  const cat = getCategoryMeta(tutorial.category).label.toLowerCase();
  const haystack = (tutorial.title + " " + tutorial.desc + " " + cat).toLowerCase();
  return haystack.includes(activeSearchQuery);
}

function matchesCategory(tutorial) {
  return activeCategory === "all" || tutorial.category === activeCategory;
}

// ---- RENDER: LIBRARY -------------------------------------------------------
function renderLibrary() {
  const shelvesContainer = document.getElementById("shelvesContainer");
  const noResults = document.getElementById("noResultsState");
  shelvesContainer.innerHTML = "";

  const filtered = TUTORIALS.filter((t) => matchesSearch(t) && matchesCategory(t));

  if (filtered.length === 0) {
    noResults.classList.remove("hidden");
    noResults.classList.add("flex");
    updateDeepLinkBanner();
    return;
  }
  noResults.classList.add("hidden");
  noResults.classList.remove("flex");

  // Flat filtered grid whenever the person is actively searching or has
  // picked a specific category — shelved browsing is for the "explore
  // everything" default state only.
  if (activeSearchQuery || activeCategory !== "all") {
    const heading = document.createElement("div");
    heading.className = "flex items-center justify-between mb-4";
    heading.innerHTML = `<h2 class="text-lg font-bold text-white">${activeSearchQuery ? `Results for &ldquo;${escapeHtml(activeSearchQuery)}&rdquo;` : getCategoryMeta(activeCategory).label}</h2>
      <span class="text-xs font-semibold text-blue-100">${filtered.length} tutorial${filtered.length === 1 ? "" : "s"}</span>`;
    shelvesContainer.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5";
    sortTutorials(filtered).forEach((t) => grid.appendChild(buildCard(t)));
    if (activeCategory === "all" && activeSearchQuery && backgroundMatchesSearch()) {
      grid.appendChild(buildBackgroundCard());
    }
    shelvesContainer.appendChild(grid);
  } else {
    TUTORIAL_CATEGORIES.forEach((cat) => {
      const items = sortTutorials(filtered.filter((t) => t.category === cat.id));
      if (items.length === 0) return;
      shelvesContainer.appendChild(buildShelf(cat, items));
    });

    // Background & System Concepts always appears last as its own tile
    const bgSection = document.createElement("section");
    bgSection.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-white flex items-center gap-2"><span class="material-symbols-outlined text-amber-300">psychology</span> Background &amp; System Concepts</h2>
      </div>`;
    const bgCard = document.createElement("div");
    bgCard.className = "bg-blue-950 rounded-2xl shadow-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white cursor-pointer hover:bg-[#0a1830] transition-colors max-w-md";
    bgCard.innerHTML = `
      <div>
        <h3 class="font-bold leading-tight mb-1">How Presynce Works</h3>
        <p class="text-sm text-blue-100">Storage, sync, and the logic behind every feature.</p>
      </div>
      <span class="inline-flex items-center gap-1 text-xs font-bold shrink-0 text-amber-300">Read More <span class="material-symbols-outlined text-base">arrow_forward</span></span>`;
    bgCard.addEventListener("click", () => openTutorial("background"));
    bgSection.appendChild(bgCard);
    shelvesContainer.appendChild(bgSection);
  }

  updateDeepLinkBanner();
}

function buildShelf(cat, items) {
  const section = document.createElement("section");
  section.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <span class="material-symbols-outlined ${cat.headerIconClass}">${cat.icon}</span> ${cat.label}
      </h2>
    </div>`;
  const row = document.createElement("div");
  row.className = "flex flex-wrap gap-5 pb-2";
  items.forEach((t) => row.appendChild(buildCard(t, cat)));
  section.appendChild(row);
  return section;
}

function buildCard(tutorial, catOverride) {
  const cat = catOverride || getCategoryMeta(tutorial.category);
  const isDeepLinked = deepLinkedId === tutorial.id;
  const stepCount = tutorial.steps ? tutorial.steps.length : 0;
  const readMins = Math.max(1, Math.round(stepCount / 3));

  const card = document.createElement("a");
  card.href = `?feature=${tutorial.id}`;
  card.className = `w-64 shrink-0 bg-white rounded-2xl overflow-hidden transition-all block ${isDeepLinked ? "shadow-xl border-2 border-amber-400 ring-4 ring-amber-200" : "shadow-md border border-transparent hover:shadow-xl hover:-translate-y-0.5"}`;
  card.innerHTML = `
    <div class="h-32 ${cat.thumbClass} flex items-center justify-center relative">
      <span class="material-symbols-outlined text-5xl ${cat.thumbIconClass}">${tutorial.icon}</span>
      ${isDeepLinked ? `<span class="absolute top-2 right-2 bg-amber-400 text-blue-950 text-[9px] font-bold px-2 py-0.5 rounded-full">Suggested for you</span>` : ""}
    </div>
    <div class="p-4">
      <h3 class="font-bold text-blue-950 text-sm mb-1">${tutorial.title}</h3>
      <p class="text-xs text-slate-500 mb-3">${tutorial.desc}</p>
      <div class="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
        <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-sm">checklist</span>${stepCount} steps</span>
        <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-sm">schedule</span>${readMins} min</span>
      </div>
    </div>`;

  card.addEventListener("click", (e) => {
    e.preventDefault();
    openTutorial(tutorial.id);
  });

  return card;
}

function backgroundMatchesSearch() {
  const haystack = (BACKGROUND_ENTRY.title + " " + BACKGROUND_ENTRY.desc + " " + BACKGROUND_ENTRY.sections.map((s) => s.heading + " " + s.body).join(" ")).toLowerCase();
  return haystack.includes(activeSearchQuery);
}

function buildBackgroundCard() {
  const card = document.createElement("a");
  card.href = "?feature=background";
  card.className = "bg-blue-950 rounded-2xl shadow-md p-5 flex flex-col justify-between text-white cursor-pointer hover:bg-[#0a1830] transition-colors";
  card.innerHTML = `
    <div>
      <div class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-3"><span class="material-symbols-outlined text-amber-300">psychology</span></div>
      <h3 class="font-bold leading-tight mb-1">Background &amp; System Concepts</h3>
      <p class="text-sm text-blue-100">Storage, sync, and the logic behind the scenes.</p>
    </div>
    <span class="inline-flex items-center gap-1 text-xs font-bold mt-4 text-amber-300">Read More <span class="material-symbols-outlined text-base">arrow_forward</span></span>`;
  card.addEventListener("click", (e) => {
    e.preventDefault();
    openTutorial("background");
  });
  return card;
}

function updateDeepLinkBanner() {
  const banner = document.getElementById("deepLinkBanner");
  const text = document.getElementById("deepLinkBannerText");
  if (deepLinkedId) {
    const t = TUTORIALS.find((x) => x.id === deepLinkedId);
    if (t) {
      text.innerText = `You were sent here from a related page — its tutorial (${stripHtml(t.title)}) is highlighted below.`;
      banner.className = "flex items-center gap-2 text-xs font-bold text-blue-950 bg-white border border-amber-300 rounded-xl px-4 py-2.5 mb-6 w-fit shadow-md";
      return;
    }
  }
  banner.classList.add("hidden");
  banner.classList.remove("flex");
}

// ---- RENDER: DETAIL --------------------------------------------------------
function openTutorial(id, opts) {
  opts = opts || {};
  const tutorial = id === "background" ? BACKGROUND_ENTRY : TUTORIALS.find((t) => t.id === id);
  if (!tutorial) return goToLibrary();

  document.getElementById("libraryView").classList.add("hidden");
  const detailView = document.getElementById("detailView");
  detailView.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  const catMeta = tutorial.isBackground ? null : getCategoryMeta(tutorial.category);

  document.getElementById("detailBreadcrumbCategory").innerText = tutorial.isBackground ? "Background" : catMeta.label;
  document.getElementById("detailBreadcrumbTitle").innerHTML = stripHtml(tutorial.title);

  document.getElementById("detailIcon").innerText = tutorial.icon;
  document.getElementById("detailIconBox").className = "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 " + (tutorial.isBackground ? BACKGROUND_ENTRY.badgeClass : catMeta.badgeClass);
  document.getElementById("detailTitle").innerHTML = tutorial.title;

  const stepCount = tutorial.steps ? tutorial.steps.length : 0;
  document.getElementById("detailMeta").innerText = tutorial.isBackground ? "Read this to understand how Presynce works behind the scenes." : `${catMeta.label} \u00b7 ${stepCount} steps \u00b7 ~${Math.max(1, Math.round(stepCount / 3))} min read`;

  const deepBanner = document.getElementById("detailDeepLinkBanner");
  if (opts.fromDeepLink) {
    deepBanner.classList.remove("hidden");
    deepBanner.classList.add("flex");
  } else {
    deepBanner.classList.add("hidden");
    deepBanner.classList.remove("flex");
  }

  const overviewBlock = document.getElementById("detailOverviewBlock");
  const stepsBlock = document.getElementById("detailStepsBlock");
  const bgBlock = document.getElementById("backgroundSections");

  if (tutorial.isBackground) {
    overviewBlock.classList.add("hidden");
    stepsBlock.classList.add("hidden");
    bgBlock.classList.remove("hidden");
    renderBackgroundSections(tutorial);
    document.getElementById("relatedTutorialsBlock").classList.add("hidden");
  } else {
    overviewBlock.classList.remove("hidden");
    stepsBlock.classList.remove("hidden");
    bgBlock.classList.add("hidden");
    document.getElementById("detailOverview").innerHTML = tutorial.overview;
    renderSteps(tutorial);
    renderNote(tutorial);
    renderRelated(tutorial);
  }

  renderPrevNext(tutorial);

  if (!opts.skipHistory) {
    const url = `${window.location.pathname}?feature=${tutorial.id}`;
    if (window.location.search !== `?feature=${tutorial.id}`) {
      window.history.pushState({ feature: tutorial.id }, "", url);
    }
  }
}

function renderSteps(tutorial) {
  const list = document.getElementById("detailStepsList");
  list.innerHTML = "";

  tutorial.steps.forEach((step, idx) => {
    const li = document.createElement("li");
    li.className = "flex gap-4";

    // Build additional content
    let additionalContent = "";

    if (step.content?.length) {
      additionalContent = step.content
        .map((item) => {
          if (item.type === "image") {
            return `
              <img
                src="${item.src}"
                alt="Step ${idx + 1} screenshot"
                class="w-full rounded-xl border border-slate-200 mt-3 cursor-zoom-in hover:opacity-90 transition-opacity"
                data-lightbox-image="${item.src}"
              >
            `;
          }

          if (item.type === "note") {
            return `
              <div class="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                <span class="material-symbols-outlined text-base mt-0.5 shrink-0">
                  info
                </span>

                <span class="min-w-0">${item.text}</span>
              </div>
            `;
          }

          return "";
        })
        .join("");
    }

    li.innerHTML = `
      <span class="w-7 h-7 rounded-full bg-blue-950 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        ${idx + 1}
      </span>

      <div class="flex-1">

        <p class="text-slate-700 ${step.placeholder ? "mb-3" : ""}">
          ${step.text}
        </p>

        ${
          step.placeholder
            ? `
              <div class="border-2 border-dashed border-slate-300 rounded-xl h-28 flex items-center justify-center text-slate-400 text-xs gap-2 bg-slate-50">
                <span class="material-symbols-outlined">image</span>
                Screenshot Placeholder — Step ${idx + 1}
              </div>
            `
            : ""
        }

        ${
          step.content?.length
            ? additionalContent
            : `
              ${
                step.image
                  ? `
                    <img
                      src="${step.image}"
                      alt="Step ${idx + 1} screenshot"
                      class="w-full rounded-xl border border-slate-200 mt-3 cursor-zoom-in hover:opacity-90 transition-opacity"
                      data-lightbox-image="${step.image}"
                    >
                  `
                  : ""
              }

              ${
                step.note
                  ? `
                    <div class="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                      <span class="material-symbols-outlined text-base mt-0.5 shrink-0">
                        info
                      </span>

                      <span class="min-w-0">${step.note}</span>
                    </div>
                  `
                  : ""
              }
            `
        }

      </div>
    `;

    list.appendChild(li);
  });
}

function renderNote(tutorial) {
  const noteBox = document.getElementById("detailNote");
  if (tutorial.note) {
    noteBox.classList.remove("hidden");
    noteBox.classList.add("flex");
    noteBox.innerHTML = `<span class="material-symbols-outlined text-base mt-0.5 shrink-0">info</span><span>${tutorial.note}</span>`;
  } else {
    noteBox.classList.add("hidden");
    noteBox.classList.remove("flex");
  }
}

function renderRelated(tutorial) {
  const block = document.getElementById("relatedTutorialsBlock");
  const grid = document.getElementById("relatedTutorialsGrid");
  const related = TUTORIALS.filter((t) => t.category === tutorial.category && t.id !== tutorial.id).slice(0, 3);

  if (related.length === 0) {
    block.classList.add("hidden");
    return;
  }
  block.classList.remove("hidden");
  grid.innerHTML = "";
  related.forEach((t) => {
    const a = document.createElement("a");
    a.href = `?feature=${t.id}`;
    a.className = "bg-slate-50 border border-slate-200 rounded-xl p-3 hover:bg-blue-50 hover:border-brand-blueline/40 transition-colors block";
    a.innerHTML = `<span class="material-symbols-outlined text-slate-500 text-lg mb-1 block">${t.icon}</span><p class="text-xs font-bold text-blue-950">${t.title}</p>`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      openTutorial(t.id);
    });
    grid.appendChild(a);
  });
}

function renderPrevNext(tutorial) {
  const prevBtn = document.getElementById("prevTutorialBtn");
  const nextBtn = document.getElementById("nextTutorialBtn");
  const prevLabel = document.getElementById("prevTutorialLabel");
  const nextLabel = document.getElementById("nextTutorialLabel");

  if (tutorial.isBackground) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    prevLabel.innerText = "";
    nextLabel.innerText = "";
    prevBtn.onclick = null;
    nextBtn.onclick = null;
    return;
  }

  const idx = TUTORIALS.findIndex((t) => t.id === tutorial.id);
  const prev = idx > 0 ? TUTORIALS[idx - 1] : null;
  const next = idx < TUTORIALS.length - 1 ? TUTORIALS[idx + 1] : null;

  prevBtn.disabled = !prev;
  nextBtn.disabled = !next;
  prevLabel.innerHTML = prev ? stripHtml(prev.title) : "";
  nextLabel.innerHTML = next ? stripHtml(next.title) : "";
  prevBtn.onclick = prev ? () => openTutorial(prev.id) : null;
  nextBtn.onclick = next ? () => openTutorial(next.id) : null;
}

function renderBackgroundSections(entry) {
  const container = document.getElementById("backgroundSections");
  container.innerHTML = "";

  entry.sections.forEach((sec) => {
    const div = document.createElement("div");
    div.innerHTML = `<h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">${sec.heading}</h2>
      <p class="text-slate-700 leading-relaxed">${sec.body}</p>`;
    container.appendChild(div);
  });

  const termsWrap = document.createElement("div");
  termsWrap.innerHTML = `<h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Terminology</h2>`;
  const table = document.createElement("div");
  table.className = "divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden";
  entry.terms.forEach(([term, def]) => {
    const row = document.createElement("div");
    row.className = "flex flex-col sm:flex-row gap-1 sm:gap-4 px-4 py-3 bg-white";
    row.innerHTML = `<span class="w-48 shrink-0 font-bold text-blue-950 text-sm">${term}</span><span class="text-slate-600 text-sm">${def}</span>`;
    table.appendChild(row);
  });
  termsWrap.appendChild(table);
  container.appendChild(termsWrap);
}

function wireImageLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  const lightboxImage = document.getElementById("imageLightboxImage");
  const closeBtn = document.getElementById("imageLightboxClose");

  function openLightbox(src, alt = "") {
    lightboxImage.src = src;
    lightboxImage.alt = alt;

    lightbox.classList.remove("hidden");
    lightbox.classList.add("flex");

    document.body.classList.add("overflow-hidden");
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightbox.classList.remove("flex");

    lightboxImage.src = "";
    document.body.classList.remove("overflow-hidden");
  }

  // Event delegation — works even for dynamically rendered tutorial images
  document.addEventListener("click", (e) => {
    const image = e.target.closest("[data-lightbox-image]");

    if (image) {
      openLightbox(image.dataset.lightboxImage, image.alt);
      return;
    }

    // Close when clicking the dark background
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  closeBtn.addEventListener("click", closeLightbox);

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  });

  // Clicking the large image also closes it
  lightboxImage.addEventListener("click", closeLightbox);
}

// ---- NAVIGATION HELPERS -----------------------------------------------------
function goToLibrary(skipHistory) {
  document.getElementById("detailView").classList.add("hidden");
  document.getElementById("libraryView").classList.remove("hidden");
  renderLibrary();
  if (!skipHistory) {
    window.history.pushState({}, "", window.location.pathname);
  }
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, "");
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
