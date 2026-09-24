// features/groupManager.js

const GroupManager = (() => {
  const GROUP_STORAGE_KEY = "platform_attendance_groups";
  const RECORD_STORAGE_KEY = "platform_attendance_records";

  // Fallback rules applied to any group that hasn't customized its own
  const DEFAULT_ATTENDANCE_RULES = {
    enabled: false, // false = "No Attendance Rules" (default), true = Present/Late/Absent logic active
    ruleBasis: "joinTime", // "joinTime" | "coverage" | "both"
    lateThresholdMinutes: 10, // minutes after start = Late (joinTime/both basis)
    absentThresholdPercent: 50, // coverage % below this = Absent (all bases)
  };

  // =====================================================
  // STORAGE
  // =====================================================

  function getGroups() {
    return JSON.parse(localStorage.getItem(GROUP_STORAGE_KEY)) || [];
  }

  function saveGroups(groups) {
    localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
  }

  function getRecords() {
    return JSON.parse(localStorage.getItem(RECORD_STORAGE_KEY)) || [];
  }

  function saveRecords(records) {
    localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(records));
  }

  function getRecord(index) {
    const records = getRecords();

    return records[index] || null;
  }

  // =====================================================
  // HELPERS
  // =====================================================

  function normalizeName(name) {
    return String(name || "")
      .trim()
      .toLowerCase();
  }

  // =====================================================
  // GROUP CRUD
  // =====================================================

  function createGroup(name, teacher = "") {
    const groups = getGroups();

    const exists = groups.some((group) => normalizeName(group.name) === normalizeName(name));

    if (exists) {
      return {
        success: false,
        message: "Group already exists.",
      };
    }

    const newGroup = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name: name.trim(),
      teacher: teacher.trim(),
      members: [],
      totalParticipants: 0,
      createdAt: new Date().toISOString(),

      settings: {
        allowAbsenteeDetection: true,
        hostFiltering: true,
      },
    };

    groups.push(newGroup);

    saveGroups(groups);

    return {
      success: true,
      group: newGroup,
    };
  }

  function deleteGroup(name) {
    let groups = getGroups();

    const exists = groups.some((group) => group.name === name);

    if (!exists) return false;

    groups = groups.filter((group) => group.name !== name);

    saveGroups(groups);

    // REMOVE TAG CONNECTIONS
    const records = getRecords();

    records.forEach((record) => {
      if (record.assignedGroup === name) {
        record.assignedGroup = null;
      }
    });

    saveRecords(records);

    return true;
  }

  function renameGroup(oldName, newName) {
    const groups = getGroups();

    const duplicate = groups.some((group) => normalizeName(group.name) === normalizeName(newName));

    if (duplicate) {
      return {
        success: false,

        message: "Group already exists.",
      };
    }

    const group = groups.find((g) => g.name === oldName);

    if (!group) {
      return {
        success: false,

        message: "Group not found.",
      };
    }

    group.name = newName.trim();

    saveGroups(groups);

    // UPDATE RECORD TAGS

    const records = getRecords();

    records.forEach((record) => {
      if (record.assignedGroup === oldName) {
        record.assignedGroup = newName.trim();
      }
    });

    saveRecords(records);

    return {
      success: true,

      group,
    };
  }

  function getGroupByName(name) {
    return getGroups().find((group) => group.name === name);
  }

  // =====================================================
  // MEMBERS
  // =====================================================

  function addMember(groupName, memberName) {
    const groups = getGroups();

    const group = groups.find((g) => g.name === groupName);

    if (!group) return false;

    const exists = group.members.some((member) => normalizeName(member) === normalizeName(memberName));

    if (!exists) {
      group.members.push(memberName.trim());
    }

    group.totalParticipants = group.members.length;

    saveGroups(groups);

    return true;
  }

  function removeMember(groupName, memberName) {
    const groups = getGroups();

    const group = groups.find((g) => g.name === groupName);

    if (!group) return false;

    group.members = group.members.filter((member) => normalizeName(member) !== normalizeName(memberName));

    group.totalParticipants = group.members.length;

    saveGroups(groups);

    return true;
  }

  function getGroupMembers(groupName) {
    return getGroupByName(groupName)?.members || [];
  }

  // =====================================================
  // RECORD TAGGING
  // =====================================================

  function assignRecordGroup(recordIndex, groupName) {
    const records = getRecords();

    if (!records[recordIndex]) return false;

    records[recordIndex].assignedGroup = groupName || null;

    saveRecords(records);

    return true;
  }

  function getRecordGroup(index) {
    const records = getRecords();

    return records[index]?.assignedGroup || null;
  }

  // =====================================================
  // DROPDOWN
  // =====================================================

  function populateSelector(selectorId, currentValue = "") {
    const selector = document.getElementById(selectorId);

    if (!selector) return;

    const groups = getGroups();

    selector.innerHTML = `
      <option value="">No Group Assigned</option>
      ${groups
        .map(
          (group) => `
        <option value="${group.name}"
        ${group.name === currentValue ? "selected" : ""}>
        ${group.name}</option>`,
        )
        .join("")}
    `;
  }

  function populateGroups(record) {
    populateSelector("groupDropdown", record.assignedGroup || "");
  }

  function updateAssignedGroup(recordIndex) {
    const selector = document.getElementById("groupDropdown");

    if (!selector) return false;

    return assignRecordGroup(recordIndex, selector.value);
  }

  // =====================================================
  // HOST / OBSERVER ISOLATION (group-scoped)
  // A name marked as Host/Observer in ANY record tagged to a group is
  // treated as a Host/Observer across that whole group (matrix, absentees,
  // record viewer). Nothing is copied between records - the group-wide set
  // is derived from each record's own `isolatedHosts` array, so existing
  // records need no migration and other groups are never affected.
  // =====================================================

  // Returns Map<normalizedName, { name, recordIndexes: number[] }>
  function getGroupIsolatedHosts(groupName) {
    const hostMap = new Map();

    if (!groupName) return hostMap;

    getRecords().forEach((record, index) => {
      if (record.assignedGroup !== groupName || !Array.isArray(record.isolatedHosts)) return;

      record.isolatedHosts.forEach((host) => {
        const key = normalizeName(host);
        if (!key) return;

        if (!hostMap.has(key)) {
          hostMap.set(key, { name: String(host).trim(), recordIndexes: [] });
        }
        hostMap.get(key).recordIndexes.push(index);
      });
    });

    return hostMap;
  }

  // Un-isolates a name from every record in the group. Returns how many records changed.
  function removeIsolatedHostFromGroup(groupName, memberName) {
    const target = normalizeName(memberName);
    const records = getRecords();
    let changed = 0;

    records.forEach((record) => {
      if (record.assignedGroup !== groupName || !Array.isArray(record.isolatedHosts)) return;

      const before = record.isolatedHosts.length;
      record.isolatedHosts = record.isolatedHosts.filter((host) => normalizeName(host) !== target);

      if (record.isolatedHosts.length !== before) changed++;
    });

    if (changed > 0) saveRecords(records);

    return changed;
  }

  // =====================================================
  // ABSENTEE
  // =====================================================

  // delete this generateAbsentees if gumagana yung pangalawa
  function generateAbsentees(recordIndex) {
    const records = getRecords();

    const target = records[recordIndex];

    if (!target) {
      return { error: "RECORD_NOT_FOUND" };
    }
    if (!target.assignedGroup) {
      return { error: "NO_GROUP" };
    }

    const group = getGroupByName(target.assignedGroup);

    if (!group) {
      return {
        error: "GROUP_NOT_FOUND",
      };
    }

    const present = new Set();

    records
      .filter((r) => r.assignedGroup === group.name)
      .forEach((session) => {
        if (Array.isArray(session.studentNames)) {
          session.studentNames.forEach((name) => present.add(name.trim()));
        }
      });

    const absent = group.members.filter((student) => !present.has(student));

    return {
      group: group.name,

      totalExpected: group.members.length,

      totalPresent: present.size,

      totalAbsent: absent.length,

      absent,
    };
  }

  function generateSessionAbsentees(recordIndex) {
    const records = getRecords();
    const target = records[recordIndex];

    if (!target) {
      return {
        error: "RECORD_NOT_FOUND",
      };
    }

    if (!target.assignedGroup) {
      return {
        error: "NO_GROUP",
      };
    }

    const group = getGroupByName(target.assignedGroup);

    if (!group) {
      return {
        error: "GROUP_NOT_FOUND",
      };
    }

    let baseMembers = Array.isArray(group.members) && group.members.length > 0 ? [...group.members] : [];

    if (baseMembers.length === 0) {
      const compiledRoster = new Set();
      records
        .filter((r) => r.assignedGroup === group.name)
        .forEach((session) => {
          if (Array.isArray(session.studentNames)) {
            session.studentNames.forEach((name) => {
              if (name && name.trim()) compiledRoster.add(name.trim());
            });
          }
        });
      baseMembers = Array.from(compiledRoster);
    }

    // Hosts/Observers isolated in ANY record of this group are excluded (same rule as the matrix)
    const groupHostMap = getGroupIsolatedHosts(group.name);
    const isolatedHostsSet = new Set(groupHostMap.keys());
    const activeExpectedMembers = baseMembers.filter((member) => !isolatedHostsSet.has(normalizeName(member)));
    // const membersList = Array.isArray(group.members) ? group.members : [];

    // Only this session's participant list counts as "present" — no other sessions tagged to this group are consulted.
    const presentInThisSession = new Set();

    if (Array.isArray(target.studentNames)) {
      target.studentNames.forEach((name) => {
        const normalized = normalizeName(name);
        if (!isolatedHostsSet.has(normalized)) {
          presentInThisSession.add(normalized);
        }
      });
    }

    // I-filter yung mga lumabas na absent on this session
    const presentMembers = activeExpectedMembers.filter((member) => presentInThisSession.has(normalizeName(member)));

    const absentMembers = activeExpectedMembers.filter((member) => !presentInThisSession.has(normalizeName(member))).sort((a, b) => a.localeCompare(b));

    // Who was left out of the numbers above, and why - so the UI can explain the difference.
    // "this"  = isolated in this record, "other" = isolated in another record of the same group.
    const ownIsolated = new Set((Array.isArray(target.isolatedHosts) ? target.isolatedHosts : []).map(normalizeName));
    const candidateNames = new Map();
    baseMembers.forEach((name) => candidateNames.set(normalizeName(name), String(name).trim()));
    if (Array.isArray(target.studentNames)) {
      target.studentNames.forEach((name) => candidateNames.set(normalizeName(name), String(name).trim()));
    }

    const excludedHosts = [];
    isolatedHostsSet.forEach((key) => {
      if (!candidateNames.has(key)) return;
      excludedHosts.push({ name: candidateNames.get(key), scope: ownIsolated.has(key) ? "this" : "other" });
    });
    excludedHosts.sort((a, b) => a.name.localeCompare(b.name));

    return {
      group: group.name,
      totalExpected: activeExpectedMembers.length,
      totalPresent: presentMembers.length,
      totalAbsent: absentMembers.length,
      absent: absentMembers,
      excludedHosts,
    };
  }

  // =====================================================
  // ATTENDANCE RULES (Present / Late / Absent)
  // =====================================================

  function getAttendanceRules(groupName) {
    const group = getGroupByName(groupName);

    if (!group) return { ...DEFAULT_ATTENDANCE_RULES };

    return { ...DEFAULT_ATTENDANCE_RULES, ...(group.settings?.attendanceRules || {}) };
  }

  function updateAttendanceRules(groupName, rules) {
    const groups = getGroups();

    const group = groups.find((g) => g.name === groupName);

    if (!group) return false;

    if (!group.settings) group.settings = {};

    group.settings.attendanceRules = {
      ...DEFAULT_ATTENDANCE_RULES,
      ...(group.settings.attendanceRules || {}),
      ...rules,
    };

    saveGroups(groups);

    return true;
  }

  // =====================================================
  // PUBLIC
  // =====================================================

  const api = {
    getGroups,
    saveGroups,

    getRecords,
    saveRecords,
    getRecord,

    createGroup,
    deleteGroup,
    renameGroup,
    getGroupByName,

    addMember,
    removeMember,
    getGroupMembers,

    assignRecordGroup,
    getRecordGroup,

    populateSelector,
    populateGroups,
    updateAssignedGroup,

    getGroupIsolatedHosts,
    removeIsolatedHostFromGroup,

    generateAbsentees,
    generateSessionAbsentees,

    getAttendanceRules,
    updateAttendanceRules,
  };

  window.fetchSavedGroups = api.getGroups;

  window.fetchSavedGroupMembers = api.getGroupMembers;

  return api;
})();
