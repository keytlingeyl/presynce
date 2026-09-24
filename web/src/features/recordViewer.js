const LOCAL_STORAGE_DB_KEY = "platform_attendance_records";
// const EXCLUSIONS_STORAGE_KEY_PREFIX = "attendance_record_exclusions_"; // Unique prefix for persistence
let activeInstantiatedRecordModel = null;
let activeSelectedExclusions = [];
let currentTargetRecordIndex = null; // Holds the active index reference
let activeGroupHostMap = new Map(); // Hosts/Observers isolated anywhere in this record's group (normalized name -> info)

function normalizeHostName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

// A name is an effective Host/Observer if it is isolated in THIS record, or in any other record of the same group.
function isEffectiveHost(name) {
  return activeSelectedExclusions.includes(name) || activeGroupHostMap.has(normalizeHostName(name));
}

function isInheritedHostOnly(name) {
  return !activeSelectedExclusions.includes(name) && activeGroupHostMap.has(normalizeHostName(name));
}

function getEffectiveHostNames() {
  const names = activeInstantiatedRecordModel && activeInstantiatedRecordModel.studentNames ? activeInstantiatedRecordModel.studentNames : [];
  return names.filter((name) => isEffectiveHost(name));
}

function refreshGroupHostContext() {
  const groupName = activeInstantiatedRecordModel ? activeInstantiatedRecordModel.assignedGroup : null;
  activeGroupHostMap = groupName && typeof GroupManager !== "undefined" ? GroupManager.getGroupIsolatedHosts(groupName) : new Map();
}

function updateIsolatedHostsLabel() {
  const label = document.getElementById("dropdownSelectedText");
  if (!label) return;
  const count = getEffectiveHostNames().length;
  label.innerText = count > 0 ? `${count} Isolated Hosts (Max 3)` : "Isolated Hosts";
}

document.addEventListener("DOMContentLoaded", () => {
  loadTargetRecordDataset();

  document.addEventListener("click", (e) => {
    const isolateWrapper = document.getElementById("multiDropdownOptionsWrapper");
    const exportWrapper = document.getElementById("exportDropdownOptionsWrapper");
    if (!e.target.closest(".relative")) {
      isolateWrapper.classList.add("hidden");
      exportWrapper.classList.add("hidden");
    }

    const warningTooltip = document.getElementById("groupAssignWarningTooltip");
    if (warningTooltip && !warningTooltip.classList.contains("hidden")) {
      if (!e.target.closest("#groupAssignWarningTooltip") && !e.target.closest("#viewerGroupAssignmentButton") && !e.target.closest("#findAbsenteesBtn")) {
        hideGroupAssignWarning();
      }
    }
  });
});

function loadTargetRecordDataset() {
  // 1. READ FROM HIDDEN STORAGE INSTEAD OF THE URL BAR
  const ACTIVE_RECORD_POINTER_KEY = "active_attendance_record_index";
  currentTargetRecordIndex = localStorage.getItem(ACTIVE_RECORD_POINTER_KEY);

  // Safety check updated to verify storage data integrity
  if (currentTargetRecordIndex === null) {
    alert("Runtime Navigation Error: Missing target data reference pointer.");
    navigateBackToDashboard();
    return;
  }

  const database = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];
  activeInstantiatedRecordModel = database[parseInt(currentTargetRecordIndex)];

  if (!activeInstantiatedRecordModel) {
    alert("Target record entry cannot be resolved within data storage contexts.");
    navigateBackToDashboard();
    return;
  }

  // LOAD SAVED EXCLUSIONS BEFORE RENDERING:
  // const savedExclusions = localStorage.getItem(EXCLUSIONS_STORAGE_KEY_PREFIX + currentTargetRecordIndex);
  // if (savedExclusions) {
  //   activeSelectedExclusions = JSON.parse(savedExclusions);
  //   document.getElementById("dropdownSelectedText").innerText = `${activeSelectedExclusions.length} Isolated Hosts (Max 3)`;
  // }

  // LOAD SAVED EXCLUSIONS DIRECTLY FROM THE RECORD ITSELF:
  activeSelectedExclusions = Array.isArray(activeInstantiatedRecordModel.isolatedHosts) ? activeInstantiatedRecordModel.isolatedHosts : [];
  refreshGroupHostContext();
  updateIsolatedHostsLabel();

  hydrateMetadataCards();
  initializeViewerGroupAssignmentButton();
  buildMultiSelectDropdownOptions();
  renderSplitDashboards();
}

function hydrateMetadataCards() {
  document.getElementById("metaMeetingName").innerText = activeInstantiatedRecordModel.meetingName || "Google Meet Session";
  document.getElementById("metaMeetingCode").innerText = activeInstantiatedRecordModel.meetingCode || "UNKNOWN-CODE";
  document.getElementById("metaSessionDate").innerText = activeInstantiatedRecordModel.date || "Undefined Date";
  document.getElementById("metaSessionTimeline").innerText = `${activeInstantiatedRecordModel.attendanceStartTime || "--"} to ${activeInstantiatedRecordModel.attendanceStopTime || "--"}`;
  document.getElementById("metaSessionDuration").innerText = formatToScratchDraftDuration(activeInstantiatedRecordModel.meetingDuration || 0);

  const count = activeInstantiatedRecordModel.studentNames ? activeInstantiatedRecordModel.studentNames.length : 0;
  document.getElementById("metaParticipantCount").innerText = `${count} Attendees`;
}

function toggleExportDropdown(e) {
  e.stopPropagation();
  const exportMenu = document.getElementById("exportDropdownOptionsWrapper");
  const isolateMenu = document.getElementById("multiDropdownOptionsWrapper");

  if (isolateMenu) isolateMenu.classList.add("hidden"); // Isara ang kabila
  if (exportMenu) exportMenu.classList.toggle("hidden");
}

function triggerExportAction(type) {
  const exportMenu = document.getElementById("exportDropdownOptionsWrapper");
  if (exportMenu) exportMenu.classList.add("hidden"); // Isara pagka-click

  if (type === "excel") {
    exportToExcel();
  } else if (type === "pdf") {
    exportToPDF();
  }
}

function toggleMultiSelectDropdown(e) {
  e.stopPropagation();
  const el = document.getElementById("multiDropdownOptionsWrapper");
  if (el) el.classList.toggle("hidden");
}

function buildMultiSelectDropdownOptions() {
  const container = document.getElementById("dropdownCheckboxesContainer");
  if (!container || !activeInstantiatedRecordModel.studentNames) return;
  container.innerHTML = "";

  activeInstantiatedRecordModel.studentNames.forEach((name) => {
    const label = document.createElement("label");
    label.className = "flex items-center gap-3 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors select-none font-medium";

    // Ticked if isolated in this record OR in any other record of the same group
    const isChecked = isEffectiveHost(name) ? "checked" : "";
    const groupBadge = isInheritedHostOnly(name) ? `<span class="ml-auto shrink-0 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5" title="Marked as Host/Observer in another record of this group">Group-wide</span>` : "";

    label.innerHTML = `
      <input type="checkbox" value="${escapeHtml(name)}" ${isChecked} onchange="handleCheckboxSelectionEvent(this)" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 transition-all">
      <span class="truncate">${escapeHtml(name)}</span>
      ${groupBadge}
    `;
    container.appendChild(label);
  });
}

function handleCheckboxSelectionEvent(checkboxElement) {
  const targetName = checkboxElement.value;
  const groupName = activeInstantiatedRecordModel.assignedGroup;

  if (checkboxElement.checked) {
    if (getEffectiveHostNames().length >= 3) {
      checkboxElement.checked = false;
      alert("Exclusion cap limit reached! You can choose a maximum of 3 hosts or observer to isolate.");
      return;
    }
    activeSelectedExclusions.push(targetName);

    // SAVE EXCLUSIONS DIRECTLY ONTO THE RECORD:
    persistIsolatedHostsToRecord();
  } else if (groupName && typeof GroupManager !== "undefined") {
    // Host/Observer status is shared across the group, so un-isolating removes it from every record in the group.
    const info = activeGroupHostMap.get(normalizeHostName(targetName));
    const otherRecordCount = info ? info.recordIndexes.filter((i) => i !== Number(currentTargetRecordIndex)).length : 0;

    if (otherRecordCount > 0) {
      const proceed = confirm(`"${targetName}" is also marked as a Host/Observer in ${otherRecordCount} other record${otherRecordCount === 1 ? "" : "s"} of "${groupName}".\n\nRemoving it here will remove it from all records in this group. Continue?`);
      if (!proceed) {
        checkboxElement.checked = true;
        return;
      }
    }

    GroupManager.removeIsolatedHostFromGroup(groupName, targetName);

    const database = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];
    activeInstantiatedRecordModel = database[parseInt(currentTargetRecordIndex)];
    activeSelectedExclusions = Array.isArray(activeInstantiatedRecordModel.isolatedHosts) ? activeInstantiatedRecordModel.isolatedHosts : [];
  } else {
    activeSelectedExclusions = activeSelectedExclusions.filter((item) => item !== targetName);
    persistIsolatedHostsToRecord();
  }

  refreshGroupHostContext();
  buildMultiSelectDropdownOptions();
  updateIsolatedHostsLabel();
  renderSplitDashboards();
}

function persistIsolatedHostsToRecord() {
  activeInstantiatedRecordModel.isolatedHosts = activeSelectedExclusions;

  const database = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];
  const index = parseInt(currentTargetRecordIndex);

  if (database[index]) {
    database[index].isolatedHosts = activeSelectedExclusions;
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(database));
  }
}

function renderSplitDashboards() {
  const participantBody = document.getElementById("participantRecordTableBody");
  const hostBody = document.getElementById("hostRecordTableBody");
  const hostContainer = document.getElementById("hostDashboardContainer");

  participantBody.innerHTML = "";
  hostBody.innerHTML = "";

  const model = activeInstantiatedRecordModel;
  if (!model.studentNames || model.studentNames.length === 0) return;

  const totalClassDuration = model.meetingDuration || 1;

  let currentParticipantIndex = 1;
  let currentHostIndex = 1;

  model.studentNames.forEach((name, index) => {
    const attendedTimeInSeconds = model.attendedDuration ? model.attendedDuration[index] : 0;
    const profileIcon = model.profileIcons ? model.profileIcons[index] : "";
    const coverageRatio = Math.min(Math.ceil((attendedTimeInSeconds / totalClassDuration) * 100), 100);

    const avatarImgTag = profileIcon && profileIcon.startsWith("http") ? `<img src="${profileIcon}" class="h-8 w-8 rounded-full border border-slate-200 mx-auto shadow-inner object-cover" alt="">` : `<div class="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center mx-auto border border-slate-200 uppercase">${name.charAt(0)}</div>`;

    const row = document.createElement("tr");
    row.className = "hover:bg-slate-50/80 transition-all duration-150 text-slate-600";

    const isHost = isEffectiveHost(name);
    const displayIndex = isHost ? currentHostIndex++ : currentParticipantIndex++;
    const inheritedBadge = isInheritedHostOnly(name) ? `<span class="ml-2 align-middle rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5" title="Marked as Host/Observer in another record of this group">Group-wide</span>` : "";

    row.innerHTML = `
      <td class="px-6 py-4 text-sm text-center font-bold text-slate-900">${displayIndex}</td>
      <td class="px-6 py-4 text-center">${avatarImgTag}</td>
      <td class="px-6 py-4 text-sm text-left font-semibold text-slate-900 tracking-tight">${escapeHtml(name)}${inheritedBadge}</td>
      <td class="px-6 py-4 text-sm text-slate-500 font-medium">${model.joiningTime ? model.joiningTime[index] : "N/A"}</td>
      <td class="px-6 py-4 text-sm font-mono text-slate-700 font-semibold">${formatToScratchDraftDuration(attendedTimeInSeconds)}</td>
      <td class="px-6 py-4 font-semibold">
          <div class="flex items-center justify-center gap-2">
              <div class="w-24 bg-slate-200 rounded-full h-2 overflow-hidden shrink-0">
                  <div class="bg-indigo-600 h-2 rounded-full" style="width: ${coverageRatio}%"></div>
              </div>
              <span class="text-xs font-mono text-slate-600 w-10 text-left shrink-0">${coverageRatio}%</span>
          </div>
      </td>
    `;

    if (isHost) {
      hostBody.appendChild(row);
    } else {
      participantBody.appendChild(row);
    }
  });

  if (hostBody.children.length > 0) {
    hostContainer.classList.remove("hidden");
  } else {
    hostContainer.classList.add("hidden");
  }
}

function exportToPDF() {
  window.print();
}

function exportToExcel() {
  if (!activeInstantiatedRecordModel) return;

  const model = activeInstantiatedRecordModel;
  const excelRows = [];

  excelRows.push(["SNo", "Participant Name", "Attendance Started at", "Joined at", "Attendance Stopped at", "Attended Duration", "Meeting Code"]);

  if (model.studentNames) {
    let trackingRowCounter = 1;

    model.studentNames.forEach((name, i) => {
      // Exclude isolated hosts/observers
      if (activeSelectedExclusions.includes(name)) {
        return;
      }

      const attendedTimeInSeconds = model.attendedDuration ? model.attendedDuration[i] : 0;

      excelRows.push([trackingRowCounter++, name, model.attendanceStartTime || "N/A", model.joiningTime ? model.joiningTime[i] : "N/A", model.attendanceStopTime || "N/A", formatToScratchDraftDuration(attendedTimeInSeconds), model.meetingCode]);
    });
  }

  // Create Excel worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(excelRows);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  // Download as Excel file
  XLSX.writeFile(workbook, `Presynce Attendance Record - ${model.meetingCode} (${model.date}).xlsx`);
}

function formatToScratchDraftDuration(timeInSeconds) {
  let hh = Math.floor(timeInSeconds / 3600);
  let mm = Math.floor((timeInSeconds % 3600) / 60);
  let ss = timeInSeconds % 60;

  if (hh === 0) {
    if (mm === 0) return `${ss}s`;
    return `${mm} min ${ss}s`;
  }
  return `${hh} hr ${mm} min ${ss}s`;
}

function navigateBackToDashboard() {
  window.location.href = "saveAttendance.html";
}

// =====================================================
// FIND ABSENTEES
// =====================================================

function handleFindAbsentees() {
  const model = activeInstantiatedRecordModel;

  if (!model || !model.assignedGroup) {
    showGroupAssignWarning();
    return;
  }

  hideGroupAssignWarning();

  if (typeof GroupManager === "undefined") {
    alert("Group Manager is unavailable. Please refresh the page and try again.");
    return;
  }

  // Session-scoped check: absentees are group members missing from THIS
  // session only — not from the group's history across other sessions.
  const result = GroupManager.generateSessionAbsentees(Number(currentTargetRecordIndex));
  renderAbsenteesSection(result);
}

function showGroupAssignWarning() {
  const tooltip = document.getElementById("groupAssignWarningTooltip");
  const groupButton = document.getElementById("viewerGroupAssignmentButton");
  if (!tooltip || !groupButton) return;

  tooltip.classList.remove("hidden");
  groupButton.classList.add("ring-2", "ring-rose-400", "ring-offset-1", "z-10");

  clearTimeout(window._groupAssignWarningTimeout);
  window._groupAssignWarningTimeout = setTimeout(hideGroupAssignWarning, 5000);
}

function hideGroupAssignWarning() {
  const tooltip = document.getElementById("groupAssignWarningTooltip");
  const groupButton = document.getElementById("viewerGroupAssignmentButton");

  if (tooltip) tooltip.classList.add("hidden");
  if (groupButton) groupButton.classList.remove("ring-2", "ring-rose-400", "ring-offset-1", "z-10");

  clearTimeout(window._groupAssignWarningTimeout);
}

function renderAbsenteesSection(result) {
  const container = document.getElementById("absenteesDashboardContainer");
  const tableBody = document.getElementById("absenteesTableBody");
  const emptyState = document.getElementById("absenteesEmptyState");

  if (!container || !tableBody || !emptyState) return;

  if (result.error) {
    if (result.error === "NO_GROUP") {
      showGroupAssignWarning();
    } else {
      alert("Unable to generate absentees list: " + result.error);
    }
    return;
  }

  // document.getElementById("absenteesGroupName").innerText = result.group;
  document.getElementById("absExpected").innerText = result.totalExpected;
  document.getElementById("absPresent").innerText = result.totalPresent;
  document.getElementById("absAbsentCount").innerText = result.totalAbsent;
  renderExcludedHostsNotice(result);

  tableBody.innerHTML = "";

  if (!result.absent || result.absent.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.classList.add("flex");
  } else {
    emptyState.classList.remove("flex");
    emptyState.classList.add("hidden");

    // const model = activeInstantiatedRecordModel;
    const database = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];

    result.absent.forEach((name, idx) => {
      const row = document.createElement("tr");
      row.className = "hover:bg-rose-50/60 transition-all duration-150";

      let profileIcon = "";
      for (const session of database) {
        if (session.assignedGroup === result.group && Array.isArray(session.studentNames) && Array.isArray(session.profileIcons)) {
          const matchingIndex = session.studentNames.findIndex((s) => s.trim().toLowerCase() === name.trim().toLowerCase());
          if (matchingIndex !== -1 && session.profileIcons[matchingIndex]) {
            profileIcon = session.profileIcons[matchingIndex];
            break; // Huminto kapag nahanap na ang tunay na profile image ng estudyante
          }
        }
      }

      const avatarImgTag = `<img src="${profileIcon}" class="h-8 w-8 rounded-full border border-slate-200 mx-auto shadow-inner object-cover" alt="${name}">`;

      // const avatarImgTag = profileIcon && profileIcon.startsWith("http") ? `<img src="${profileIcon}" class="h-8 w-8 rounded-full border border-slate-200 mx-auto shadow-inner object-cover" alt="">` : `<div class="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center mx-auto border border-slate-200 uppercase">${name.charAt(0)}</div>`;

      // const avatarCircle = `<div class="h-8 w-8 rounded-full bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center mx-auto border border-rose-200 uppercase">${name.charAt(0)}</div>`;

      // const indexCell = document.createElement("td");
      // indexCell.className = "px-6 py-3 text-sm text-center font-bold text-slate-900";
      // indexCell.innerText = idx + 1;

      // const nameCell = document.createElement("td");
      // nameCell.className = "px-6 py-3 text-sm text-left font-semibold text-slate-900";
      // nameCell.innerText = name;

      // row.appendChild(indexCell);
      // row.appendChild(nameCell);

      row.innerHTML = `
        <td class="px-6 py-4 text-sm text-center font-bold text-slate-900">${idx + 1}</td>
        <td class="px-6 py-4 text-center">${avatarImgTag}</td>
        <td class="px-6 py-4 text-sm text-left font-semibold text-slate-900 tracking-tight">${escapeHtml(name)}</td>
      `;

      tableBody.appendChild(row);
    });
  }

  container.classList.remove("hidden");
  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Explains why Expected / Present / Absent may be lower than the participant table above.
function renderExcludedHostsNotice(result) {
  const notice = document.getElementById("absExcludedNotice");
  const noticeText = document.getElementById("absExcludedNoticeText");
  if (!notice || !noticeText) return;

  const excluded = Array.isArray(result.excludedHosts) ? result.excludedHosts : [];

  if (excluded.length === 0) {
    notice.classList.add("hidden");
    notice.classList.remove("flex");
    return;
  }

  const details = excluded.map((e) => `${e.name} (${e.scope === "this" ? "this record" : "another record"})`).join(", ");
  const plural = excluded.length === 1 ? "participant is" : "participants are";

  noticeText.innerText = `${excluded.length} ${plural} excluded from these counts because they are marked as Host/Observer in this group: ${details}.`;
  notice.classList.remove("hidden");
  notice.classList.add("flex");
}

// Called by assignGroupModal.js right after a group tag is successfully saved,
// so this page's in-memory record + UI stay in sync without needing a reload.
window.onGroupAssignmentUpdated = function (updatedIndex) {
  if (Number(updatedIndex) !== Number(currentTargetRecordIndex)) return;

  const database = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];
  activeInstantiatedRecordModel = database[parseInt(currentTargetRecordIndex)];

  initializeViewerGroupAssignmentButton();
  hideGroupAssignWarning();
};

function initializeViewerGroupAssignmentButton() {
  const button = document.getElementById("viewerGroupAssignmentButton");
  const text = document.getElementById("viewerGroupAssignmentText");

  if (!button || !text) {
    console.warn("Viewer group assignment elements not found.");
    return;
  }

  const currentGroup = activeInstantiatedRecordModel.assignedGroup;

  text.innerText = currentGroup || "No Group Assigned";

  button.onclick = () => {
    openGroupSelectorModal(Number(currentTargetRecordIndex));
  };
}
