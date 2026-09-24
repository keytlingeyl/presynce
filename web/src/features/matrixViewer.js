const LOCAL_STORAGE_DB_KEY = "platform_attendance_records";
const LOCAL_STORAGE_GROUPS_KEY = "platform_attendance_groups";
const LOCAL_STORAGE_TOTAL_MODE_KEY = "presynce_matrix_global_total_display_mode";

let activeMatrixGroupName = null;
let activeAttendanceRules = null;

// Cached from the last render so Export Options doesn't need to recompute the matrix
let lastTargetedSessions = [];
let lastUniqueStudentsList = [];
let currentSearchQuery = "";
let currentTotalDisplayMode = localStorage.getItem(LOCAL_STORAGE_TOTAL_MODE_KEY) || "number";

// UI Total Label Mappings
const TOTAL_MODE_LABELS = {
  number: "Numbers Only",
  percent: "Percentages Only",
  both: "Numbers & Percentages",
};

document.addEventListener("DOMContentLoaded", () => {
  generateAttendanceMatrix();

  // Close the Export Options floating panel when clicking outside of it
  document.addEventListener("click", (e) => {
    const exportWrapper = document.getElementById("matrixExportDropdownWrapper");
    if (exportWrapper && !exportWrapper.classList.contains("hidden") && !e.target.closest("#matrixExportDropdownWrapper") && !e.target.closest("#openExportOptionsBtn")) {
      exportWrapper.classList.add("hidden");
    }

    const totalDropdownWrapper = document.getElementById("totalDisplayDropdownWrapper");
    if (totalDropdownWrapper && !totalDropdownWrapper.classList.contains("hidden") && !e.target.closest("#totalDisplayDropdownWrapper") && !e.target.closest("#openTotalDisplayBtn")) {
      totalDropdownWrapper.classList.add("hidden");
      const chevron = document.getElementById("totalDisplayChevron");
      if (chevron) chevron.classList.remove("rotate-180");
    }
  });

  window.addEventListener("scroll", () => {
    const table = document.querySelector("#matrixWrapper table");
    if (!table) return;

    const thead = table.querySelector("thead");
    const rect = table.getBoundingClientRect();

    // Kung ang taas ng table ay umabot na sa itaas ng screen habang nagse-scroll ang body
    if (rect.top <= 0 && rect.bottom > 100) {
      // Pwede nating i-apply ang fixed o sticky class dynamically kung kinakailangan
      // Pero kadalasang kaya na ito ng CSS kapag malinis ang overflow ng mga magulang.
      // sticky header behavior if itatransfer dito instead na sa html
    }
  });
});

function handleMatrixSearch() {
  const searchInput = document.getElementById("matrixSearchInput");
  currentSearchQuery = searchInput ? searchInput.value.trim().toLowerCase() : "";
  renderMatrixTableBody();
}

function toggleTotalDisplayDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById("totalDisplayDropdownWrapper");
  const chevron = document.getElementById("totalDisplayChevron");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
    if (chevron) chevron.classList.toggle("rotate-180");
  }
}

function selectTotalDisplayFormat(mode, labelText) {
  currentTotalDisplayMode = mode;
  localStorage.setItem(LOCAL_STORAGE_TOTAL_MODE_KEY, mode);

  const label = document.getElementById("selectedTotalLabel");
  if (label) label.innerText = labelText;

  const dropdown = document.getElementById("totalDisplayDropdownWrapper");
  const chevron = document.getElementById("totalDisplayChevron");
  if (dropdown) dropdown.classList.add("hidden");
  if (chevron) chevron.classList.remove("rotate-180");

  renderMatrixTableBody();
}

function generateAttendanceMatrix() {
  // 1. Extract Group Target parameters out of active window request string
  const urlParams = new URLSearchParams(window.location.search);
  const targetGroupName = urlParams.get("group");

  if (!targetGroupName) {
    alert("Error: No designated target group parameter recognized.");
    window.location.href = "classesPage.html";
    return;
  }

  // 2. Set Header Elements text contents and load total display mode
  activeMatrixGroupName = targetGroupName;
  activeAttendanceRules = GroupManager.getAttendanceRules(targetGroupName);
  refreshAttendanceRulesSummary();

  const savedGlobalTotalMode = localStorage.getItem(LOCAL_STORAGE_TOTAL_MODE_KEY);
  if (savedGlobalTotalMode && TOTAL_MODE_LABELS[savedGlobalTotalMode]) {
    currentTotalDisplayMode = savedGlobalTotalMode;
  } else {
    currentTotalDisplayMode = "number"; // Baseline default
  }

  const labelEl = document.getElementById("selectedTotalLabel");
  if (labelEl) {
    labelEl.innerText = TOTAL_MODE_LABELS[currentTotalDisplayMode];
  }

  activeAttendanceRules = GroupManager.getAttendanceRules(targetGroupName);
  refreshAttendanceRulesSummary();

  document.getElementById("displayGroupNameHeader").innerText = targetGroupName;

  // 3. Look up and sync the assigned teacher subhead profile metadata
  const systemGroups = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY)) || [];
  const matchingGroupMeta = systemGroups.find((g) => g.name === targetGroupName);
  if (matchingGroupMeta && matchingGroupMeta.teacher) {
    document.getElementById("displayTeacherSubhead").innerText = `Class Teacher / Handler: ${matchingGroupMeta.teacher}`;
  } else {
    document.getElementById("displayTeacherSubhead").innerText = "Class Teacher / Handler: N/A";
  }

  // 4. Query Master Datastore Array filter matching elements trace tags
  const masterRecords = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY)) || [];

  // Filter and sort chronologically (oldest sessions first so matrix grows rightwards)
  const targetedSessions = masterRecords.filter((record) => record.assignedGroup === targetGroupName).sort((a, b) => new Date(a.date + " " + (a.platformSavedTimestamp || "00:00")) - new Date(b.date + " " + (b.platformSavedTimestamp || "00:00")));

  const emptyState = document.getElementById("matrixEmptyState");
  const matrixWrapper = document.getElementById("matrixWrapper");
  const statsPanel = document.getElementById("statsSummaryPanel");
  const matrixLegend = document.getElementById("matrixLegend");

  if (targetedSessions.length === 0) {
    emptyState.classList.remove("hidden");
    matrixWrapper.classList.add("hidden");
    statsPanel.classList.add("hidden");
    statsPanel.classList.remove("grid");
    matrixLegend.classList.add("hidden");
    matrixLegend.classList.remove("flex");
    lastTargetedSessions = [];
    lastUniqueStudentsList = [];
    return;
  }

  emptyState.classList.add("hidden");
  matrixWrapper.classList.remove("hidden");
  statsPanel.classList.remove("hidden");
  statsPanel.classList.add("grid");
  matrixLegend.classList.remove("hidden");
  matrixLegend.classList.add("flex");

  const legendLateItem = document.getElementById("legendLateItem");
  if (legendLateItem) {
    legendLateItem.classList.toggle("hidden", !(activeAttendanceRules && activeAttendanceRules.enabled));
  }

  // 5. Compile unique roster map array list sets cleanly
  // First, gather every name that has been isolated as a host/observer in ANY session
  // within this group, so they stay consistently excluded across the whole matrix.
  let globalIsolatedHostNames = new Set();
  targetedSessions.forEach((session) => {
    if (Array.isArray(session.isolatedHosts)) {
      session.isolatedHosts.forEach((name) => {
        if (name && name.trim() !== "") {
          globalIsolatedHostNames.add(name.trim());
        }
      });
    }
  });

  let studentRosterSet = new Set();
  targetedSessions.forEach((session) => {
    if (session.studentNames && Array.isArray(session.studentNames)) {
      session.studentNames.forEach((name) => {
        const trimmedName = name ? name.trim() : "";
        if (trimmedName !== "" && !globalIsolatedHostNames.has(trimmedName)) {
          studentRosterSet.add(trimmedName);
        }
        // if (name && name.trim() !== "") {
        //   studentRosterSet.add(name.trim());
        // }
      });
    }
  });

  // Convert to clean sorted array checklist roster alpha
  const uniqueStudentsList = Array.from(studentRosterSet).sort((a, b) => a.localeCompare(b));

  lastTargetedSessions = targetedSessions;
  lastUniqueStudentsList = uniqueStudentsList;

  // Sync structural dashboard stat components counter
  document.getElementById("statTotalSessions").innerText = targetedSessions.length;
  document.getElementById("statTotalStudents").innerText = uniqueStudentsList.length;

  // 6. Inject dynamic two-row Table Matrix Grid Headers
  //    Row 1: "#" and "Participant Name" (rowspan 2) + merged Month group cells (colspan per month)
  //    Row 2: plain day-of-month numbers under each month group
  const headerRow = document.getElementById("matrixTableHeaderRow");
  const headerRow2 = document.getElementById("matrixTableHeaderRow2");

  headerRow.innerHTML = `
    <th rowspan="2" class="sticky left-0 top-0 z-40 bg-slate-50 px-4 py-3.5 text-center text-[11px] font-bold tracking-wider text-slate-400 uppercase w-12 shadow-[1px_0_0_0_rgba(226,232,240,1)] align-middle">#</th>
    <th rowspan="2" class="sticky left-12 top-0 z-40 bg-slate-50 px-5 py-3.5 text-left text-[11px] font-bold tracking-wider text-slate-400 uppercase min-w-50 shadow-[2px_0_0_0_rgba(226,232,240,1)] align-middle">Participant Name</th>
  `;
  headerRow2.innerHTML = "";

  const MONTH_ABBREV_TO_FULL = {
    Jan: "January",
    Feb: "February",
    Mar: "March",
    Apr: "April",
    May: "May",
    Jun: "June",
    Jul: "July",
    Aug: "August",
    Sep: "September",
    Oct: "October",
    Nov: "November",
    Dec: "December",
  };

  // Parses "dd-MMM-yyyy" (e.g. "19-Jul-2026") into a month label (year-agnostic) and a day label.
  // Falls back to a generic "Session N" grouping if the date string is missing or malformed.
  function parseSessionMonthDay(session, fallbackIdx) {
    if (session.date) {
      const parts = session.date.split("-");
      if (parts.length === 3) {
        const day = parts[0];
        const monthAbbrev = parts[1];
        const monthLabel = MONTH_ABBREV_TO_FULL[monthAbbrev] || monthAbbrev.toUpperCase();
        return { monthLabel, dayLabel: day };
      }
    }
    return { monthLabel: "Session", dayLabel: `${fallbackIdx + 1}` };
  }

  // Group consecutive sessions that share the same month label (chronological order,
  // year-agnostic — e.g. Nov, Dec, Jan of the following year stay as separate groups
  // in sequence rather than being merged back with an earlier same-named month).
  let monthGroups = [];
  targetedSessions.forEach((session, idx) => {
    const { monthLabel, dayLabel } = parseSessionMonthDay(session, idx);
    const lastGroup = monthGroups[monthGroups.length - 1];

    if (lastGroup && lastGroup.monthLabel === monthLabel) {
      lastGroup.days.push(dayLabel);
    } else {
      monthGroups.push({ monthLabel, days: [dayLabel] });
    }
  });

  monthGroups.forEach((group) => {
    const monthTh = document.createElement("th");
    monthTh.colSpan = group.days.length;
    monthTh.className = "px-2 py-2 text-center text-[11px] font-bold tracking-wider text-slate-600 uppercase border-l border-slate-200/60 bg-slate-100";
    monthTh.innerText = group.monthLabel;
    headerRow.appendChild(monthTh);

    group.days.forEach((dayLabel) => {
      const dayTh = document.createElement("th");
      dayTh.className = "px-3 py-2.5 text-center text-[11px] font-bold tracking-wider text-slate-500 border-l border-slate-200/60 min-w-[64px]";
      dayTh.innerText = dayLabel;
      headerRow2.appendChild(dayTh);
    });
  });

  // Append Single Total Header at the end of the first row
  const totalTh = document.createElement("th");
  totalTh.rowSpan = 2;
  totalTh.className = "px-4 py-3.5 text-center text-[11px] font-bold tracking-wider text-slate-600 uppercase border-l border-slate-200 bg-slate-100 align-middle min-w-[120px]";
  totalTh.innerText = "Total";
  headerRow.appendChild(totalTh);

  renderMatrixTableBody();
}

function renderMatrixTableBody() {
  // Render matching data matrix nodes cross reference map grids loops
  const tableBody = document.getElementById("matrixTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  const countLateAsPresent = !(activeAttendanceRules && activeAttendanceRules.countLateAs === "absent");

  const filteredStudents = lastUniqueStudentsList.filter((name) => {
    if (!currentSearchQuery) return true;
    return name.toLowerCase().includes(currentSearchQuery);
  });

  if (filteredStudents.length === 0) {
    const colCount = 3 + lastTargetedSessions.length;
    tableBody.innerHTML = `
      <tr>
        <td colspan="${colCount}" class="py-12 text-center text-slate-400 font-medium">
          No participants match "${currentSearchQuery}"
        </td>
      </tr>`;
    return;
  }

  filteredStudents.forEach((studentName, sIdx) => {
    const row = document.createElement("tr");
    const isLastRow = sIdx === filteredStudents.length - 1;
    const lastRowClasses = isLastRow ? "[&>td:first-child]:rounded-bl-2xl [&>td:last-child]:rounded-br-2xl" : "";

    row.className = `hover:bg-slate-50/85 transition-colors text-slate-600 align-middle text-center ${lastRowClasses}`;

    let presentCount = 0;
    const totalSessionsCount = lastTargetedSessions.length;
    let sessionCellsHTML = "";

    lastTargetedSessions.forEach((session) => {
      const status = resolveAttendanceStatus(session, studentName, activeAttendanceRules);

      if (status === "present") {
        presentCount++;
        sessionCellsHTML += `
          <td class="px-4 text-center whitespace-nowrap border-l border-slate-100 text-sm leading-none bg-emerald-50 translate-y-[0.5px]">
            <span class="inline-flex items-center justify-center w-full h-full text-emerald-600 rounded-full mx-auto" title="Present">
              <span class="material-symbols-outlined text-2xl leading-none font-extrabold">check</span>
            </span>
          </td>`;
      } else if (status === "late") {
        if (countLateAsPresent) {
          presentCount++;
        }
        sessionCellsHTML += `
          <td class="px-4 text-center whitespace-nowrap border-l border-slate-100 text-sm leading-none bg-amber-100 translate-y-[0.5px]">
            <span class="inline-flex items-center justify-center text-amber-600 rounded-full font-bold text-[11px]" title="Late">
              <span class="material-symbols-outlined text-2xl leading-none font-extrabold">warning</span>
            </span>
          </td>`;
      } else {
        sessionCellsHTML += `
          <td class="px-4 text-center whitespace-nowrap border-l border-slate-100 text-sm leading-none bg-rose-50 translate-y-[0.5px]">
            <span class="inline-flex items-center justify-center text-rose-500 rounded-full font-bold text-[11px]" title="Absent">
              <span class="material-symbols-outlined text-2xl leading-none font-extrabold">close</span>
            </span>
          </td>`;
      }
    });

    const percent = totalSessionsCount > 0 ? Math.round((presentCount / totalSessionsCount) * 100) : 0;

    let totalFormattedStr = "";
    if (currentTotalDisplayMode === "number") {
      totalFormattedStr = `${presentCount}/${totalSessionsCount}`;
    } else if (currentTotalDisplayMode === "percent") {
      totalFormattedStr = `${percent}%`;
    } else {
      totalFormattedStr = `${presentCount}/${totalSessionsCount} (${percent}%)`;
    }

    row.innerHTML = `
      <td class="sticky left-0 z-20 bg-white group-hover:bg-slate-50 font-bold text-slate-900 px-4 py-2 leading-none text-center shadow-[1px_0_0_0_rgba(226,232,240,1)]">${sIdx + 1}</td>
      <td class="sticky left-12 z-20 bg-white group-hover:bg-slate-50 font-bold text-slate-800 px-5 py-2 leading-none text-left truncate shadow-[2px_0_0_0_rgba(226,232,240,1)] max-w-50" title="${escapeHtml(studentName)}">${escapeHtml(studentName)}</td>
      ${sessionCellsHTML}
      <td class="px-4 py-2 font-bold text-slate-800 text-center whitespace-nowrap border-l border-slate-200 bg-slate-50/50">${totalFormattedStr}</td>
    `;

    tableBody.appendChild(row);

    // uniqueStudentsList.forEach((studentName, sIdx) => {
    //   const row = document.createElement("tr");
    //   const isLastRow = sIdx === uniqueStudentsList.length - 1;

    //   const lastRowClasses = isLastRow ? "[&>td:first-child]:rounded-bl-2xl [&>td:last-child]:rounded-br-2xl" : "";

    //   row.className = `hover:bg-slate-50/85 transition-colors text-slate-600 align-middle text-center ${lastRowClasses}`;

    //   // Index and Name column frozen horizontally utilizing css parameters styles hooks
    //   row.innerHTML = `
    //     <td class="sticky left-0 z-20 bg-white group-hover:bg-slate-50 font-bold text-slate-900 px-4 py-2 leading-none text-center shadow-[1px_0_0_0_rgba(226,232,240,1)]">${sIdx + 1}</td>
    //     <td class="sticky left-12 z-20 bg-white group-hover:bg-slate-50 font-bold text-slate-800 px-5 py-2 leading-none text-left truncate shadow-[2px_0_0_0_rgba(226,232,240,1)] max-w-50" title="${studentName}">${studentName}</td>
    //   `;

    //   // Run a horizontal evaluation mapping check column by column for this individual student profile
    //   targetedSessions.forEach((session) => {
    //     const td = document.createElement("td");

    //     const status = resolveAttendanceStatus(session, studentName, activeAttendanceRules);

    //     if (status === "present") {
    //       td.className = "px-4 text-center whitespace-nowrap border-l border-slate-100 text-sm leading-none bg-emerald-50 translate-y-[0.5px]";
    //       td.innerHTML = `
    //         <span class="inline-flex items-center justify-center w-full h-full text-emerald-600 rounded-full mx-auto" title="Present">
    //           <span class="material-symbols-outlined text-2xl leading-none font-extrabold">check</span>
    //         </span>`;
    //     } else if (status === "late") {
    //       td.className = "px-4 text-center whitespace-nowrap border-l border-slate-100 text-sm leading-none bg-amber-100 translate-y-[0.5px]";
    //       td.innerHTML = `
    //         <span class="inline-flex items-center justify-center text-amber-600 rounded-full font-bold text-[11px]" title="Late">
    //           <span class="material-symbols-outlined text-2xl leading-none font-extrabold">warning</span>
    //         </span>`;
    //     } else {
    //       td.className = "px-4 text-center whitespace-nowrap border-l border-slate-100 text-sm leading-none bg-rose-50 translate-y-[0.5px]";
    //       td.innerHTML = `
    //         <span class="inline-flex items-center justify-center text-rose-500 rounded-full font-bold text-[11px]" title="Absent">
    //           <span class="material-symbols-outlined text-2xl leading-none font-extrabold">close</span>
    //         </span>`;
    //     }

    //     row.appendChild(td);
    //   });

    //   tableBody.appendChild(row);
  });
}

// =====================================================
// ATTENDANCE STATUS RESOLUTION (Present / Late / Absent)
// =====================================================

// Converts a display time string like "5:32:56 PM" into minutes-since-midnight.
// Returns null if it can't be parsed (e.g. missing/malformed data), so callers
// can gracefully fall back to a different rule basis instead of crashing.
function timeStringToMinutes(timeStr) {
  if (!timeStr) return null;

  const parsed = new Date(`01/01/2000 ${timeStr}`);

  if (isNaN(parsed.getTime())) return null;

  return parsed.getHours() * 60 + parsed.getMinutes() + parsed.getSeconds() / 60;
}

function resolveAttendanceStatus(session, studentName, rules) {
  const activeRules = rules || { enabled: false, ruleBasis: "joinTime", lateThresholdMinutes: 10, absentThresholdPercent: 50 };

  const studentIndex = session.studentNames ? session.studentNames.findIndex((s) => s.trim() === studentName) : -1;

  if (studentIndex === -1) return "absent";

  // NO ATTENDANCE RULES: fall back to a simple Present / Absent check (legacy behavior).
  // This is the default state for any group that hasn't explicitly enabled rules.
  if (!activeRules.enabled) {
    return "present";
  }

  const attendedSeconds = session.attendedDuration ? session.attendedDuration[studentIndex] : 0;
  const totalDuration = session.meetingDuration || 1;
  const coveragePercent = Math.min((attendedSeconds / totalDuration) * 100, 100);

  // The absent floor always wins, regardless of rule basis.
  if (coveragePercent < activeRules.absentThresholdPercent) return "absent";

  let isLate = false;

  if (activeRules.ruleBasis === "joinTime" || activeRules.ruleBasis === "both") {
    const sessionStartMinutes = timeStringToMinutes(session.attendanceStartTime);
    const studentJoinMinutes = session.joiningTime ? timeStringToMinutes(session.joiningTime[studentIndex]) : null;

    if (sessionStartMinutes !== null && studentJoinMinutes !== null) {
      const minutesLate = studentJoinMinutes - sessionStartMinutes;
      if (minutesLate > activeRules.lateThresholdMinutes) isLate = true;
    }
  }

  if (!isLate && (activeRules.ruleBasis === "coverage" || activeRules.ruleBasis === "both")) {
    // Between the absent floor and full coverage counts as Late under this basis.
    if (coveragePercent < 100) isLate = true;
  }

  return isLate ? "late" : "present";
}

// =====================================================
// ATTENDANCE RULES MODAL
// =====================================================

function ruleBasisLabel(basis) {
  if (basis === "coverage") return "By Duration Coverage";
  if (basis === "both") return "Join Time + Coverage";
  return "By Join Time";
}

function refreshAttendanceRulesSummary() {
  const summaryEl = document.getElementById("statAttendanceRulesSummary");
  if (!summaryEl || !activeAttendanceRules) return;

  if (!activeAttendanceRules.enabled) {
    summaryEl.innerText = "No Attendance Rules";
    return;
  }

  const lateAsStr = activeAttendanceRules.countLateAs === "absent" ? "Late=Absent" : "Late=Present";
  summaryEl.innerText = `${ruleBasisLabel(activeAttendanceRules.ruleBasis)} • Late >${activeAttendanceRules.lateThresholdMinutes}m • Absent <${activeAttendanceRules.absentThresholdPercent}%`;
}

function openAttendanceRulesModal() {
  const modal = document.getElementById("attendanceRulesModal");
  if (!modal || !activeAttendanceRules) return;

  const modeDisabled = document.getElementById("ruleModeDisabled");
  const modeEnabled = document.getElementById("ruleModeEnabled");

  if (activeAttendanceRules.enabled) {
    modeEnabled.checked = true;
  } else {
    modeDisabled.checked = true;
  }

  document.getElementById("ruleBasisSelect").value = activeAttendanceRules.ruleBasis;
  document.getElementById("lateThresholdInput").value = activeAttendanceRules.lateThresholdMinutes;
  document.getElementById("absentThresholdInput").value = activeAttendanceRules.absentThresholdPercent;

  if (activeAttendanceRules.countLateAs === "absent") {
    document.getElementById("lateCountAbsent").checked = true;
  } else {
    document.getElementById("lateCountPresent").checked = true;
  }

  handleAttendanceRuleModeChange();

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function handleAttendanceRuleModeChange() {
  const modeEnabled = document.getElementById("ruleModeEnabled");
  const settingsBlock = document.getElementById("attendanceRuleSettingsBlock");
  if (!modeEnabled || !settingsBlock) return;

  if (modeEnabled.checked) {
    settingsBlock.classList.remove("hidden");
  } else {
    settingsBlock.classList.add("hidden");
  }
}

function closeAttendanceRulesModal() {
  const modal = document.getElementById("attendanceRulesModal");
  if (modal) modal.classList.add("hidden");
  if (modal) modal.classList.remove("flex");
}

function saveAttendanceRules() {
  if (!activeMatrixGroupName) return;

  const enabled = document.getElementById("ruleModeEnabled").checked;
  const ruleBasis = document.getElementById("ruleBasisSelect").value;
  const lateThresholdMinutes = Math.max(0, Number(document.getElementById("lateThresholdInput").value) || 0);
  const absentThresholdPercent = Math.min(100, Math.max(0, Number(document.getElementById("absentThresholdInput").value) || 0));
  const countLateAs = document.getElementById("lateCountAbsent").checked ? "absent" : "present";

  GroupManager.updateAttendanceRules(activeMatrixGroupName, {
    enabled,
    ruleBasis,
    lateThresholdMinutes,
    absentThresholdPercent,
    countLateAs,
  });

  activeAttendanceRules = GroupManager.getAttendanceRules(activeMatrixGroupName);
  refreshAttendanceRulesSummary();
  closeAttendanceRulesModal();

  // Re-render so the matrix reflects the new rules immediately
  generateAttendanceMatrix();
}

// =====================================================
// EXPORT OPTIONS DROPDOWN
// =====================================================

function toggleExportOptionsDropdown(e) {
  e.stopPropagation();
  const exportWrapper = document.getElementById("matrixExportDropdownWrapper");
  if (exportWrapper) exportWrapper.classList.toggle("hidden");
}

function triggerMatrixExportAction(type) {
  const exportWrapper = document.getElementById("matrixExportDropdownWrapper");
  if (exportWrapper) exportWrapper.classList.add("hidden");

  if (type === "excel") {
    exportMatrixToExcel();
  } else if (type === "pdf") {
    exportMatrixToPDF();
  }
}

function statusToLabel(status) {
  if (status === "present") return "✓ Present";
  if (status === "late") return "⚠ Late";
  return "✕ Absent";
}

function exportMatrixToExcel() {
  if (!lastTargetedSessions || lastTargetedSessions.length === 0 || !lastUniqueStudentsList) return;

  // 1. Recreate exact 2-Row Header Structure matching the web matrix UI
  let aoaData = [];

  // Row 0: Month headers and fixed column headers
  let headerRow1 = ["No.", "Participant Name"];
  // Row 1: Day headers (empty placeholders for No. & Name since they span 2 rows)
  let headerRow2 = ["", ""];

  const MONTH_ABBREV_TO_FULL = {
    Jan: "January",
    Feb: "February",
    Mar: "March",
    Apr: "April",
    May: "May",
    Jun: "June",
    Jul: "July",
    Aug: "August",
    Sep: "September",
    Oct: "October",
    Nov: "November",
    Dec: "December",
  };

  function parseSessionMonthDay(session, fallbackIdx) {
    if (session.date) {
      const parts = session.date.split("-");
      if (parts.length === 3) {
        const day = parts[0];
        const monthAbbrev = parts[1];
        const monthLabel = MONTH_ABBREV_TO_FULL[monthAbbrev] || monthAbbrev.toUpperCase();
        return { monthLabel, dayLabel: day };
      }
    }
    return { monthLabel: "Session", dayLabel: `${fallbackIdx + 1}` };
  }

  let monthGroups = [];
  lastTargetedSessions.forEach((session, idx) => {
    const { monthLabel, dayLabel } = parseSessionMonthDay(session, idx);
    const lastGroup = monthGroups[monthGroups.length - 1];

    if (lastGroup && lastGroup.monthLabel === monthLabel) {
      lastGroup.days.push(dayLabel);
    } else {
      monthGroups.push({ monthLabel, days: [dayLabel] });
    }
  });

  // Track merge ranges for months in Row 0
  let merges = [];
  // No. and Participant Name span 2 rows (Rows 0 to 1, Col 0 and Col 1)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
  merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });

  let currentCol = 2;
  monthGroups.forEach((group) => {
    const startCol = currentCol;
    const endCol = startCol + group.days.length - 1;

    // Push month label to the first column of the group, and empty strings for the rest of the merged span
    headerRow1.push(group.monthLabel);
    headerRow2.push(group.days[0]);

    for (let i = 1; i < group.days.length; i++) {
      headerRow1.push(""); // Placeholder for merged cell
      headerRow2.push(group.days[i]);
    }

    // If month spans across multiple days, add to merges
    if (startCol !== endCol) {
      merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: endCol } });
    }

    currentCol += group.days.length;
  });

  headerRow1.push("Total");
  headerRow2.push("");
  merges.push({ s: { r: 0, c: currentCol }, e: { r: 1, c: currentCol } });

  aoaData.push(headerRow1);
  aoaData.push(headerRow2);

  const countLateAsPresent = !(activeAttendanceRules && activeAttendanceRules.countLateAs === "absent");

  // 2. Add student rows
  lastUniqueStudentsList.forEach((studentName, sIdx) => {
    // let row = [sIdx + 1, studentName];
    let presentCount = 0;
    let sessionStatuses = [];

    lastTargetedSessions.forEach((session) => {
      const status = resolveAttendanceStatus(session, studentName, activeAttendanceRules);
      if (status === "present") {
        presentCount++;
        sessionStatuses.push("✓");
      } else if (status === "late") {
        if (countLateAsPresent) presentCount++;
        sessionStatuses.push("⚠");
      } else {
        sessionStatuses.push("✕");
      }
    });

    const totalSessions = lastTargetedSessions.length;
    const percent = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    let totalFormattedStr = "";
    if (currentTotalDisplayMode === "number") {
      totalFormattedStr = `${presentCount}/${totalSessions}`;
    } else if (currentTotalDisplayMode === "percent") {
      totalFormattedStr = `${percent}%`;
    } else {
      totalFormattedStr = `${presentCount}/${totalSessions} (${percent}%)`;
    }

    let row = [sIdx + 1, studentName, ...sessionStatuses, totalFormattedStr];
    aoaData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoaData);
  ws["!merges"] = merges;

  // 3. Define professional styles
  const attendanceBorder = {
    top: { style: "thin", color: { rgb: "E2E8F0" } },
    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
    left: { style: "thin", color: { rgb: "E2E8F0" } },
    right: { style: "thin", color: { rgb: "E2E8F0" } },
  };

  const headerStyle = {
    font: { name: "Arial", sz: 11, bold: true, color: { rgb: "1E293B" } },
    fill: { fgColor: { rgb: "F1F5F9" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: attendanceBorder,
  };

  const studentNameHeaderStyle = {
    font: { name: "Arial", sz: 11, bold: true, color: { rgb: "1E293B" } },
    fill: { fgColor: { rgb: "F1F5F9" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: attendanceBorder,
  };

  const normalCellStyle = {
    font: { name: "Arial", sz: 10, color: { rgb: "334155" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: attendanceBorder,
  };

  const leftCellStyle = {
    font: { name: "Arial", sz: 10, color: { rgb: "334155" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: attendanceBorder,
  };

  const presentStyle = {
    font: { name: "Arial", sz: 12, bold: true, color: { rgb: "059669" } },
    fill: { fgColor: { rgb: "ECFDF5" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: attendanceBorder,
  };

  const lateStyle = {
    font: { name: "Arial", sz: 12, bold: true, color: { rgb: "D97706" } },
    fill: { fgColor: { rgb: "FEF3C7" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: attendanceBorder,
  };

  const absentStyle = {
    font: { name: "Arial", sz: 12, bold: true, color: { rgb: "F43F5E" } },
    fill: { fgColor: { rgb: "FFF1F2" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: attendanceBorder,
  };

  // 4. Apply styles across all cells
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) {
        ws[cellAddress] = { t: "s", v: "" }; // Ensure empty cells in merges get styled properly too
      }

      if (R === 0 || R === 1) {
        ws[cellAddress].s = C === 1 ? studentNameHeaderStyle : headerStyle;
      } else {
        if (C === 0) {
          ws[cellAddress].s = normalCellStyle;
        } else if (C === 1) {
          ws[cellAddress].s = leftCellStyle;
        } else {
          const val = ws[cellAddress].v;
          if (val === "✓") {
            ws[cellAddress].s = presentStyle;
          } else if (val === "⚠") {
            ws[cellAddress].s = lateStyle;
          } else if (val === "✕") {
            ws[cellAddress].s = absentStyle;
          } else {
            ws[cellAddress].s = normalCellStyle;
          }
        }
      }
    }
  }

  // 5. Dynamic column width adjustment based on content
  let maxNameLength = 16; // Minimum baseline width for participant names
  lastUniqueStudentsList.forEach((name) => {
    if (name && name.length > maxNameLength) {
      maxNameLength = name.length;
    }
  });

  ws["!cols"] = [
    { wch: 6 }, // No. column width
    { wch: maxNameLength + 4 }, // Auto-adjusted Participant Name column width with padding buffer
  ];

  for (let i = 2; i < 2 + lastTargetedSessions.length; i++) {
    ws["!cols"].push({ wch: 12 }); // Session columns width
  }

  ws["!cols"].push({ wch: 16 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Matrix");

  XLSX.writeFile(wb, `Presynce Matrix Record - ${activeMatrixGroupName}.xlsx`);
}

function exportMatrixToPDF() {
  window.print();
}
