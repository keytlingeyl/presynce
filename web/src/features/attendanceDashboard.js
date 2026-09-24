const ALLOWED_EXTENSION_ORIGIN = "https://meet.google.com";
const LOCAL_STORAGE_DB_KEY = "platform_attendance_records";
const LOCAL_STORAGE_GROUPS_KEY = "platform_attendance_groups";
const ACTIVE_RECORD_POINTER_KEY = "active_attendance_record_index";
const AUTO_BACKUP_ENABLED_KEY = "platform_auto_backup_enabled";
const LAST_BACKUP_TIMESTAMP_KEY = "platform_last_backup_timestamp";
const BACKUP_CAUTION_THRESHOLD_DAYS = 7;

let currentPage = 1;
const ITEMS_PER_PAGE = 50;
const MAX_TOTAL_MEETINGS = 500;

let activeSearchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  enforceDataRetentionCeiling();
  renderDashboardTable();
  initiateExtensionHandshake();
  initAutoBackupControls();
});

// FROM EXTENSION
function initiateExtensionHandshake() {
  if (sessionStorage.getItem("attendance_payload_processed") === "true") {
    console.log("Attendance already processed for this session. Skipping handshake banner.");
    return;
  }

  if (window.opener) {
    showProcessingBanner("Connecting to extension framework... Requesting session data payload.", "info");

    const urlParams = new URLSearchParams(window.location.search);
    const isPreviousRecord = urlParams.get("isPreviousRecord") === "true";

    const actionType = isPreviousRecord ? "sendPreviousRecord" : "sendCurrentRecord";
    window.opener.postMessage(JSON.stringify({ action: actionType }), ALLOWED_EXTENSION_ORIGIN);
  } else {
    console.log("Portal launched independently. Bypassing extension payload injection sequence.");
  }
}

window.addEventListener("message", (event) => {
  if (event.origin !== ALLOWED_EXTENSION_ORIGIN) {
    console.warn("Rejected incoming messaging transaction from illegal origin footprint:", event.origin);
    return;
  }

  // Chine-check kung na-process na ang record sa kasalukuyang session para hindi paulit-ulit kapag binabalikan ang Records page
  if (sessionStorage.getItem("attendance_payload_processed") === "true") {
    console.log("Payload already processed for this tab session. Skipping handshake re-evaluation.");
    return;
  }

  try {
    const dataPayload = JSON.parse(event.data);
    if (dataPayload && dataPayload.meetingCode) {
      saveRecordToSandboxDatabase(dataPayload);
      showProcessingBanner("Attendance metric successfully integrated and committed to database.", "success");

      sessionStorage.setItem("attendance_payload_processed", "true");

      // Linisin ang query parameter sa URL (aalisin ang ?isPreviousRecord=... sa address bar)
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, "", cleanUrl);
      }

      if (window.opener) {
        window.opener.postMessage(
          JSON.stringify({
            action: "removePreviousRecord",
          }),
          ALLOWED_EXTENSION_ORIGIN,
        );
      }
    } else {
      showProcessingBanner("Received data frame missing required schema definitions.", "error");
    }
  } catch (err) {
    console.error("Failed handling pipeline processing execution data frame structures:", err);
    showProcessingBanner("Critical exception executing data capture frameworks.", "error");
  }
});

function showProcessingBanner(text, type) {
  const banner = document.getElementById("statusBanner");
  const icon = document.getElementById("statusIcon");
  const textContainer = document.getElementById("statusText");

  banner.classList.remove("hidden", "bg-blue-50", "border-blue-200", "text-blue-700", "bg-emerald-50", "border-emerald-200", "text-emerald-700", "bg-rose-50", "border-rose-200", "text-rose-700");

  if (type === "info") {
    banner.classList.add("flex", "bg-blue-50", "border-blue-200", "text-blue-700");
    icon.innerText = "info";
  } else if (type === "success") {
    banner.classList.add("flex", "bg-emerald-50", "border-emerald-200", "text-emerald-700");
    icon.innerText = "check_box";
  } else {
    banner.classList.add("flex", "bg-rose-50", "border-rose-200", "text-rose-700");
    icon.innerText = "warning";
  }

  textContainer.innerText = text;
}

// CHECKS AND REMOVE BASED ON TOTAL MEETINGS ALLOWED
function enforceDataRetentionCeiling() {
  let existingDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];
  if (existingDb.length > MAX_TOTAL_MEETINGS) {
    existingDb = existingDb.slice(-MAX_TOTAL_MEETINGS);
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(existingDb));
  }
}

// SAVE TO LOCAL STORAGE
function saveRecordToSandboxDatabase(record) {
  let existingDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];

  const isDuplicate = existingDb.some((item) => item.meetingCode === record.meetingCode && item.date === record.date && item.attendanceStartTime === record.attendanceStartTime);

  if (isDuplicate) {
    console.log("Duplicate meeting record detected. Skipping save.");
    return;
  }

  record.platformSavedTimestamp = new Date().toLocaleTimeString();
  record.assignedGroup = "";

  existingDb.push(record);
  localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(existingDb));

  enforceDataRetentionCeiling();
  currentPage = 1;
  renderDashboardTable();

  // If Auto Backup is enabled and the user is authenticated, keep the cloud copy fresh.
  maybeRunAutoBackup();
}

// TABLEEEEEE

function renderDashboardTable() {
  const tableBody = document.getElementById("tableRecordBody");
  const emptyState = document.getElementById("emptyStateFallback");
  const paginationHeader = document.getElementById("pageControlHeader");
  const records = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];

  tableBody.innerHTML = "";

  if (records.length === 0) {
    emptyState.classList.remove("hidden");
    paginationHeader.classList.add("hidden");
    return;
  } else {
    emptyState.classList.add("hidden");
    paginationHeader.classList.remove("hidden");
  }

  let mappedRecords = records.map((record, originalIndex) => ({
    ...record,
    trueIndex: originalIndex,
  }));

  mappedRecords.reverse();

  // SEARCH FILTER
  if (activeSearchQuery) {
    mappedRecords = mappedRecords.filter((record) => {
      const nameMatch = (record.meetingName || "").toLowerCase().includes(activeSearchQuery);
      const codeMatch = (record.meetingCode || "").toLowerCase().includes(activeSearchQuery);
      const tagMatch = (record.assignedGroup || "").toLowerCase().includes(activeSearchQuery);
      return nameMatch || codeMatch || tagMatch;
    });
  }

  const totalItems = mappedRecords.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const paginatedItems = mappedRecords.slice(startIndex, endIndex);

  document.getElementById("pageInfoStart").innerText = startIndex + 1;
  document.getElementById("pageInfoEnd").innerText = endIndex;
  document.getElementById("pageInfoTotal").innerText = totalItems;

  document.getElementById("btnPrevPage").disabled = currentPage === 1;
  document.getElementById("btnNextPage").disabled = currentPage === totalPages;

  paginatedItems.forEach((record, displayLoopIndex) => {
    const row = document.createElement("tr");

    const visualRowNumber = startIndex + displayLoopIndex + 1;

    const borderClass = visualRowNumber % 2 !== 0 ? "border-alt-blue" : "border-alt-red";

    row.className = `hover:bg-green-50/80 transition-colors text-slate-600 align-middle text-center ${borderClass}`;

    const participantCount = record.studentNames ? record.studentNames.length : 0;
    const runtimeTitle = record.meetingName || "Google Meet Session";
    const displaySavedTimestamp = record.platformSavedTimestamp || record.attendanceStopTime || "N/A";

    let groupMarkup = "";
    if (record.assignedGroup) {
      groupMarkup = `<button onclick="openGroupSelectorModal(${record.trueIndex})" class="cursor-pointer inline-flex items-center justify-center h-6.5 px-2.5 rounded-full text-[11px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 mx-auto max-w-140px truncate" title="Click to change or remove group assignment">${escapeHtml(record.assignedGroup)}</button>`;
    } else {
      groupMarkup = `<button onclick="openGroupSelectorModal(${record.trueIndex})" class="cursor-pointer inline-flex items-center justify-center gap-1 h-6.5 px-2 rounded-full text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all mx-auto"><span class="material-symbols-outlined text-lg leading-none">add</span>Tag Group</button>`;
    }

    row.innerHTML = `
                    <td class="px-2 py-2.5 font-bold text-black text-center whitespace-nowrap">${visualRowNumber}</td>
                    <td class="px-4 py-2.5 font-bold text-slate-900 text-center max-w-xs mx-auto">
                      <div
                        contenteditable="true"
                        spellcheck="false"
                        data-record-index="${record.trueIndex}"
                        onblur="handleMeetingNameEdit(this)"
                        onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                          title="Click to rename"
                          class="line-clamp-2 wrap-break-word outline-none rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-slate-50 focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 transition-colors cursor-text">
                        ${escapeHtml(runtimeTitle)}
                      </div>
                    </td>
                    <td class="px-4 py-2.5 text-center whitespace-nowrap"><span class="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[11px] rounded border border-slate-200">${record.meetingCode}</span></td>
                    <td class="px-4 py-2.5 text-center whitespace-nowrap">${record.date}</td>
                    <td class="px-4 py-2.5 text-slate-500 text-center whitespace-nowrap">${displaySavedTimestamp}</td>
                    <td class="px-4 py-2.5 font-mono text-center whitespace-nowrap">${formatDuration(record.meetingDuration || 0)}</td>
                    <td class="py-2.5 text-center whitespace-nowrap"><span class="text-blue-600 font-bold text-xs">${participantCount}</span></td>
                    <td class="px-4 py-2.5 text-center whitespace-nowrap">
                        <button onclick="viewDetailedRecord(${record.trueIndex})" class="inline-flex items-center justify-center px-2 py-1 gap-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-50 focus:outline-none transition-all mx-auto cursor-pointer"><span class="material-symbols-outlined text-xl leading-none">frame_inspect</span>Inspect</button>
                    </td>
                    <td class="px-4 py-2.5 text-center whitespace-nowrap">
                        ${groupMarkup}
                    </td>
                    <td class="px-4 py-2.5 text-center whitespace-nowrap">
                        <button onclick="deleteRecordIndex(${record.trueIndex})" class="inline-flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md transition-colors mx-auto cursor-pointer" title="Delete Record"><span class="material-symbols-outlined text-[18px]!">delete</span></button>
                    </td>
                `;
    tableBody.appendChild(row);
  });
}

function changePage(direction) {
  currentPage += direction;
  renderDashboardTable();
}

function handleRecordSearch() {
  const input = document.getElementById("recordSearchInput");
  activeSearchQuery = (input.value || "").trim().toLowerCase();
  currentPage = 1;
  renderDashboardTable();
}

// NASA UTILS NATO
// INLINE MEETING NAME RENAME (contenteditable cell)
// function escapeHtml(unsafe) {
//   return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
// }

function handleMeetingNameEdit(element) {
  const index = Number(element.dataset.recordIndex);
  let existingDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];

  if (!existingDb[index]) return;

  const cleanedName = element.innerText.replace(/\s+/g, " ").trim();
  const finalName = cleanedName || "Google Meet Session";

  existingDb[index].meetingName = finalName;
  localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(existingDb));

  element.innerText = finalName;
}

// RECOVER PAST MEETING (placeholder - wiring TBD; unrelated to cloud backup, this recovers
// an interrupted extension-side tracking session via window.opener postMessage)
function recoverPastMeeting() {
  alert("Recover Past Meeting is coming soon.");
}

// AUTO BACKUP TOGGLE
async function initAutoBackupControls() {
  // Wait for Firebase Auth to resolve the existing session (if any) before deciding what the toggle/banner should show, so we never flash a wrong state.
  if (window.AuthManager) {
    await AuthManager.whenReady();
  }

  // const stored = localStorage.getItem(AUTO_BACKUP_ENABLED_KEY);
  // // Defaults to OFF: Auto Backup requires an authenticated account, so it should never silently turn itself on for a brand-new, signed-out visitor.
  // const isEnabled = stored === null ? false : stored === "true";
  // localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, isEnabled);
  // applyAutoBackupUI(isEnabled);

  reconcileAutoBackupWithAuthState();
  refreshBackupCautionBanner();

  // Keep everything in sync if the user signs in/out in this tab (e.g. afterfollowing the "Sign in now" link from the auth modal and coming back, or after clicking Sign Out on signin.html in another tab).
  if (window.AuthManager) {
    AuthManager.onAuthChange(() => {
      reconcileAutoBackupWithAuthState();
      refreshBackupCautionBanner();
    });
  }
}

function reconcileAutoBackupWithAuthState() {
  const isAuthed = window.AuthManager ? AuthManager.isAuthenticated() : false;
  const storedOn = localStorage.getItem(AUTO_BACKUP_ENABLED_KEY) === "true";

  if (storedOn && !isAuthed) {
    localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, "false");
    applyAutoBackupUI(false);
    return;
  }

  applyAutoBackupUI(storedOn && isAuthed);
}

function toggleAutoBackup() {
  const currentlyEnabled = localStorage.getItem(AUTO_BACKUP_ENABLED_KEY) === "true";
  const turningOn = !currentlyEnabled;

  if (turningOn && window.AuthManager && !AuthManager.isAuthenticated()) {
    // It's a toggle - it must visually (and in storage) flip ON the moment the
    // user clicks it, same as it would if they were authenticated. The auth
    // gate decides what happens AFTER that, it doesn't block the click itself.
    localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, "true");
    applyAutoBackupUI(true);
    refreshBackupCautionBanner(); // shows State A immediately: "Conflict: Please sign in..."

    if (window.AuthGate) {
      AuthGate.requireAuth("Auto Backup", () => {
        // Cancel / "Turn off Auto Backup" / backdrop click: revert both storage and UI to OFF.
        localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, "false");
        applyAutoBackupUI(false);
        refreshBackupCautionBanner();
      });
      // "Sign in now" inside the modal navigates to signin.html. The "true" we just
      // persisted survives that redirect, so on return - once actually authenticated -
      // initAutoBackupControls() picks it up and stays ON with no modal (State C/B).
    } else {
      alert("Please sign in with your Google Account to use Auto Backup.");
      localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, "false");
      applyAutoBackupUI(false);
      refreshBackupCautionBanner();
    }
    return;
  }

  localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, turningOn);
  applyAutoBackupUI(turningOn);
  refreshBackupCautionBanner();

  if (turningOn) {
    maybeRunAutoBackup();
  }
}

function applyAutoBackupUI(isEnabled) {
  const track = document.getElementById("autoBackupTrack");
  const knob = document.getElementById("autoBackupKnob");
  const label = document.getElementById("autoBackupLabel");

  if (!track || !knob || !label) return;

  if (isEnabled) {
    track.classList.remove("bg-slate-300");
    track.classList.add("bg-emerald-500");
    knob.classList.remove("translate-x-0");
    knob.classList.add("translate-x-5");
    label.innerText = "Auto Backup (enabled)";
  } else {
    track.classList.remove("bg-emerald-500");
    track.classList.add("bg-slate-300");
    knob.classList.remove("translate-x-5");
    knob.classList.add("translate-x-0");
    label.innerText = "Auto Backup (disabled)";
  }
}

// Fires a backup whenever new data lands locally, but only if the user
// actually opted in (Auto Backup ON) and is authenticated.
function maybeRunAutoBackup() {
  const isEnabled = localStorage.getItem(AUTO_BACKUP_ENABLED_KEY) === "true";
  if (!isEnabled || !window.AuthManager || !AuthManager.isAuthenticated() || !window.BackupManager) return;

  const user = AuthManager.getCurrentUser();
  BackupManager.backupNow(user.uid)
    .then(() => refreshBackupCautionBanner())
    .catch((err) => {
      console.error("Auto backup failed:", err);
      refreshBackupCautionBanner();
    });
}

// =====================================================
// BACKUP STATUS / CAUTION LABEL
// States:
//   D - Auto Backup OFF                      -> neutral, "disabled"
//   A - Auto Backup ON but NOT signed in       -> conflict warning
//   C - Signed in + ON, but no/outdated backup -> amber warning
//   B - Signed in + ON + cloud in sync         -> success
// =====================================================
async function refreshBackupCautionBanner() {
  const banner = document.getElementById("backupCautionBanner");
  const icon = document.getElementById("backupCautionIcon");
  const text = document.getElementById("backupCautionText");
  if (!banner || !icon || !text) return;

  const isAutoBackupOn = localStorage.getItem(AUTO_BACKUP_ENABLED_KEY) === "true";
  const isAuthed = window.AuthManager ? AuthManager.isAuthenticated() : false;

  const clearColorClasses = () => {
    banner.classList.remove("bg-rose-50", "text-rose-600", "bg-emerald-50", "text-emerald-700", "bg-amber-50", "text-amber-700", "bg-slate-50", "text-slate-500");
  };

  // STATE D: Auto Backup disabled — always accurate regardless of auth/backup history
  if (!isAutoBackupOn) {
    clearColorClasses();
    banner.classList.add("text-slate-500");
    icon.innerText = "cloud_off";
    text.innerText = "Auto Backup is currently disabled.";
    return;
  }

  // STATE A: user wants Auto Backup ON, but there's no authenticated session backing it
  if (!isAuthed) {
    clearColorClasses();
    banner.classList.add("text-rose-600");
    icon.innerText = "error";
    text.innerText = "Conflict: Please sign in to use the Auto Backup feature.";
    return;
  }

  // Authenticated + Auto Backup ON — determine real sync status against Firestore
  const user = window.AuthManager ? AuthManager.getCurrentUser() : null;
  const lastBackupMs = window.BackupManager ? BackupManager.getLastBackupTimestampMs() : null;

  let inSync = false;
  try {
    if (window.BackupManager && user) {
      const cloud = await BackupManager.getCloudSnapshot(user.uid);
      const device = BackupManager.getDeviceSnapshot();
      inSync = cloud.exists && cloud.records === device.records && cloud.groups === device.groups;
    }
  } catch (err) {
    console.error("Could not verify cloud sync status:", err);
  }

  if (lastBackupMs && inSync) {
    // STATE B
    clearColorClasses();
    banner.classList.add("text-emerald-700");
    icon.innerText = "cloud_done";
    text.innerText = "Great! Data backed up and in sync with the cloud.";
    return;
  }

  // STATE C: signed in + Auto Backup ON, but backup is missing or outdated
  clearColorClasses();
  banner.classList.add("text-amber-700");
  icon.innerText = "cloud_sync";

  if (!lastBackupMs) {
    text.innerText = "Auto Backup is on, but no backup has been made yet.";
  } else {
    const daysElapsed = Math.floor((Date.now() - lastBackupMs) / (24 * 60 * 60 * 1000));
    if (daysElapsed >= BACKUP_CAUTION_THRESHOLD_DAYS) {
      text.innerText = `Caution: Your last backup was made ${daysElapsed} day${daysElapsed === 1 ? "" : "s"} ago and is out of sync.`;
    } else {
      text.innerText = "Auto Backup is on, but the cloud copy is out of sync with this device.";
    }
  }
}

function viewDetailedRecord(index) {
  localStorage.setItem(ACTIVE_RECORD_POINTER_KEY, index);
  window.location.href = "recordViewer.html";
}

// function deleteRecordIndex(index) {
//   if (confirm("Are you sure you want to permanently delete this attendance record? This action cannot be undone.")) {
//     let existingDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];
//     existingDb.splice(index, 1);
//     localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(existingDb));

//     const totalItems = existingDb.length;
//     const maxAvailablePagesCalculated = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
//     if (currentPage > maxAvailablePagesCalculated) {
//       currentPage = maxAvailablePagesCalculated;
//     }

//     renderDashboardTable();
//     maybeRunAutoBackup();
//   }
// }

function deleteRecordIndex(index) {
  showConfirmModal({
    title: "Delete Attendance Record",
    message: "Are you sure you want to permanently delete this attendance record? This action cannot be undone.",
    type: "danger",
    onConfirm: () => {
      let existingDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];

      existingDb.splice(index, 1);

      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(existingDb));

      const totalItems = existingDb.length;

      const maxAvailablePagesCalculated = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

      if (currentPage > maxAvailablePagesCalculated) {
        currentPage = maxAvailablePagesCalculated;
      }

      renderDashboardTable();
      maybeRunAutoBackup();
    },
  });
}

// function formatDuration(timeInSeconds) {
//   let hh = Math.floor(timeInSeconds / 3600);
//   let mm = Math.floor((timeInSeconds % 3600) / 60);
//   let ss = timeInSeconds % 60;
//   if (hh === 0) return `${mm}m ${ss}s`;
//   return `${hh}h ${mm}m ${ss}s`;
// }
