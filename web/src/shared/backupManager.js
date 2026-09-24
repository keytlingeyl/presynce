// =====================================================
// BACKUP MANAGER
// Syncs the existing localStorage "sandbox database"
// (platform_attendance_records / platform_attendance_groups)
// with Firestore, scoped per-user at users/{uid}.
//
// NOTE ON DATA MODEL: earlier planning discussed subcollections
// (users/{uid}/records/{recordId}, users/{uid}/groups/{groupId}).
// For this pass, records/groups are stored as arrays on a single
// users/{uid} document instead - it's simpler to keep atomic with
// a single write/read, and well within Firestore's 1MB document
// limit at capstone-demo scale. If the dataset ever grows large,
// migrating to subcollections is a drop-in change to this file only
// (nothing else in the app touches Firestore directly).
// =====================================================

const BackupManager = (() => {
  const RECORD_STORAGE_KEY = "platform_attendance_records";
  const GROUP_STORAGE_KEY = "platform_attendance_groups";
  const LAST_BACKUP_TIMESTAMP_KEY = "platform_last_backup_timestamp";

  function getLocalRecords() {
    return JSON.parse(localStorage.getItem(RECORD_STORAGE_KEY)) || [];
  }

  function getLocalGroups() {
    return JSON.parse(localStorage.getItem(GROUP_STORAGE_KEY)) || [];
  }

  function userDocRef(uid) {
    if (!firebaseDb) throw new Error("Cloud storage is not configured yet. Add your Firebase project config in firebaseConfig.js.");
    return firebaseDb.collection("users").doc(uid);
  }

  async function backupNow(uid) {
    if (!uid) throw new Error("Missing authenticated user id.");

    const records = getLocalRecords();
    const groups = getLocalGroups();
    const nowIso = new Date().toISOString();

    await userDocRef(uid).set(
      {
        records,
        groups,
        lastBackupTimestamp: nowIso,
      },
      { merge: true },
    );

    localStorage.setItem(LAST_BACKUP_TIMESTAMP_KEY, Date.now().toString());
    return { records: records.length, groups: groups.length, timestamp: nowIso };
  }

  async function restoreNow(uid, mergeExisting = false) {
    if (!uid) throw new Error("Missing authenticated user id.");

    const snap = await userDocRef(uid).get();
    if (!snap.exists) {
      return { records: 0, groups: 0, restored: false };
    }

    const cloudData = snap.data() || {};
    const cloudRecords = cloudData.records || [];
    const cloudGroups = cloudData.groups || [];

    if (mergeExisting) {
      const localRecords = getLocalRecords();
      const localGroups = getLocalGroups();

      const mergedRecords = [...localRecords, ...cloudRecords];

      const mergedGroupsMap = new Map();
      [...localGroups, ...cloudGroups].forEach((g) => mergedGroupsMap.set(g.name, g));

      localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(mergedRecords));
      localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(Array.from(mergedGroupsMap.values())));
    } else {
      localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(cloudRecords));
      localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(cloudGroups));
    }

    return { records: cloudRecords.length, groups: cloudGroups.length, restored: true };
  }

  async function getCloudSnapshot(uid) {
    if (!uid || !firebaseDb) return { records: 0, groups: 0, lastBackupTimestamp: null, exists: false };
    const snap = await userDocRef(uid).get();
    if (!snap.exists) return { records: 0, groups: 0, lastBackupTimestamp: null, exists: false };
    const data = snap.data() || {};
    return {
      records: (data.records || []).length,
      groups: (data.groups || []).length,
      lastBackupTimestamp: data.lastBackupTimestamp || null,
      exists: true,
    };
  }

  function getDeviceSnapshot() {
    return { records: getLocalRecords().length, groups: getLocalGroups().length };
  }

  function getLastBackupTimestampMs() {
    const raw = localStorage.getItem(LAST_BACKUP_TIMESTAMP_KEY);
    return raw ? Number(raw) : null;
  }

  return {
    backupNow,
    restoreNow,
    getCloudSnapshot,
    getDeviceSnapshot,
    getLastBackupTimestampMs,
  };
})();

window.BackupManager = BackupManager;
