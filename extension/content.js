// ==========================================
// CONFIGURATION & GLOBAL STATE
// ==========================================

// PLACEHOLDERS FOR ROUTING - Change DEV_MODE to false and fill PROD_URL when live
const DEV_MODE = false;
const LOCAL_PORT = "3000"; // Change to your local server port

const PROD_URL = "https://presynce.vercel.app";
const DEV_URL = `http://localhost:${LOCAL_PORT}`;

const SAVE_ATTENDANCE_URI = "/pages/saveAttendance.html";
const CONTACT_US_URI = "/pages/contactUs.html";

// State Management Variables
let studentDetails = new Map();
let totalClassDuration = 0;
let totalActiveDuration = 0;
let startTime = new Date().toLocaleTimeString();
let startTimeInMillis = new Date().getTime();
let currentMeetingName = null;
let goingToStop = 0;
let isAttendanceWorking = false;
let previousRecordBackup = 0;
let wasAlreadyAlerted = false;
let canShowProfileIconForRecords = false;
let isCustomMeetingName = false;
let canSendRecordMetricsForCurrentRecord = true;

// Interval Handlers
let startAttendanceTracker = null;
let checkBtnPeriodically = null;
let checkIsInMeeting = null;

// Constants & Key Configurations
const EXTENSION_VERSION = "V3";
const EXTENSION_MANIFEST_VERSION = "1.0.0";
const RECORD_BACKUP_THRESHOLD = 8;
const LOCAL_KEY_PREVIOUS_RECORD = "googlemeet-attendance-tracker-ext-previous-meeting-data";

// Google Meet DOM Selectors
const CONTRIBUTORS_ELEMENT = "m3Uzve RJRKn";
const DATA_MEETING_TITLE_ATTR = "data-meeting-title";
const DATA_PARTICIPANT_ID_ATTR = "data-participant-id";

const DEFAULT_PARTICIPANTS_BTN_SELECTOR = `[data-side="1"] [role="button"]`;
const FALLBACK_PARTICIPANTS_BTN_SELECTOR = `[role="button"]`;
const OLD_UI_PARTICIPANTS_BTN_SELECTOR = `[data-panel-id][role="button"]`;

const DEFAULT_PARTICIPANTS_NAME_SELECTOR = `[role="listitem"][data-participant-id]`;
const FALLBACK_PARTICIPANTS_NAME_SELECTOR = `[data-participant-id]:not([role="listitem"])`;
const PARTICIPANT_IMAGE_SELECTOR = `img[src^="https://lh3.googleusercontent.com"]`;
const DEFAULT_PROFILE_ICON = `${getTargetBaseURL()}/svg/default-person-icon.svg`;

// ==========================================
// ENVIRONMENT & URL RESOLVERS
// ==========================================

function getTargetBaseURL() {
  return DEV_MODE ? DEV_URL : PROD_URL;
}

function getSaveAttendanceURL() {
  return getTargetBaseURL() + SAVE_ATTENDANCE_URI;
}

function getContactUsURL() {
  return getTargetBaseURL() + CONTACT_US_URI;
}

// ==========================================
// INITIALIZATION & MEETING DETECTION
// ==========================================

window.onload = function () {
  if (checkIsInMeeting) return;
  checkIsInMeeting = setInterval(hasUserJoinedMeeting, 1000);
};

function hasUserJoinedMeeting() {
  try {
    if (isInMeeting()) {
      clearInterval(checkIsInMeeting);
      checkIsInMeeting = null;
      startExtension();
    }
  } catch (e) {
    console.error("Exception in hasUserJoinedMeeting: ", e);
  }
}

function isInMeeting() {
  try {
    let pathName = location.pathname;
    if (pathName !== "/" && pathName.length > 1) {
      if (isUserInMeetingView()) {
        return true;
      }
    }
  } catch (e) {
    console.error("Exception in isInMeeting check: ", e);
  }
  return false;
}

function isUserInMeetingView() {
  try {
    if (hasAttribute(DATA_PARTICIPANT_ID_ATTR) && hasAttribute(DATA_MEETING_TITLE_ATTR)) {
      return true;
    } else if (getAttributeLen(DATA_PARTICIPANT_ID_ATTR) > 1) {
      return true;
    } else if (hasAttribute(DATA_MEETING_TITLE_ATTR) && getParticipantsCountInMeeting() > 0) {
      return true;
    }
  } catch (e) {
    console.error("Exception inside isUserInMeetingView: ", e);
  }
  return false;
}

function startExtension() {
  try {
    setTimeout(function () {
      addTrackAttendanceButton();
    }, 700);
  } catch (e) {
    console.error("Exception in startExtension: ", e);
  }
}

// ==========================================
// UI INJECTION & CONTROLS
// ==========================================

function addTrackAttendanceButton() {
  try {
    setTimeout(function () {
      let trackAttBtnEle = document.getElementById("trackAttendanceBlueButton_GMAT");
      if (trackAttBtnEle == null) {
        const trackAttendanceBtnHTML = `
          <div style="position:fixed; bottom:8px; left:10px; z-index:999999; ; background-color: #1e1f20; padding: 12px; border-radius: 20px;">
              <style>
                  @keyframes gmatWhitePulse {
                      0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.55); }
                      70%  { box-shadow: 0 0 0 44px rgba(255,255,255,0); }
                      100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
                  }
                  #trackAttendanceBlueButton_GMAT.pulse { animation: gmatWhitePulse 3.2s ease-out 2; }
              </style>
              <button id="trackAttendanceBlueButton_GMAT" type="button" class="pulse" style="background-color:#9bbbef; color:#062e6f; border:none; border-radius:10px; height:48px; padding:15 20px; font-size:16px; font-weight:bold; letter-spacing:0.2px; display:none; align-items:center; justify-content:center; gap:10px; cursor:pointer;">
                  Track Attendance
              </button>
          </div>`;
        document.body.insertAdjacentHTML("beforeend", trackAttendanceBtnHTML);
        attachClickListenerForNewButton();
        showTrackAttendanceButton();
        keepCheckingForButtonExistencePeriodically();

        if (isPreviousRecordPresent()) {
          proceedSavingPreviousRecord(true);
        }
      }
    }, 1100);
  } catch (e) {
    console.error("Exception inside addTrackAttendanceButton: ", e);
  }
}

function attachClickListenerForNewButton() {
  try {
    document.getElementById("trackAttendanceBlueButton_GMAT").addEventListener("click", async function () {
      if (!isAttendanceWorking) {
        if (isPreviousRecordPresent()) {
          proceedSavingPreviousRecord(true);
        } else {
          isAttendanceWorking = true;
          updateTrackAttendanceButtonToTrackingMode();
          resetGlobalVariablesForNewRecord();

          let wasParticipantsTabOpeningSuccessful = await tryToOpenParticipantsTab();

          if (getParticipantsInformationFromParticipantsTab().size > 0 || getParticipantsInformationFromTiles().size > 0) {
            if (isAttendanceWorking) {
              start();
            }
          } else {
            stopAttendance(false);
            showCantTrackNowButYouCanRecoverBanner("cantOpenParticipantsTab");
          }
        }
      } else if (isAttendanceWorking) {
        stopAttendance(true);
      }
    });
  } catch (e) {
    console.error("Can't attach click listener for tracking button: ", e);
  }
}

function keepCheckingForButtonExistencePeriodically() {
  try {
    if (checkBtnPeriodically) return;
    checkBtnPeriodically = setInterval(function () {
      checkIfButtoncanBeShown();
    }, 1000);
  } catch (e) {
    console.error("Error monitoring tracking button visibility context: ", e);
  }
}

function checkIfButtoncanBeShown() {
  try {
    let btnElement = document.getElementById("trackAttendanceBlueButton_GMAT");
    if (btnElement != null) {
      if (isUserInMeetingView()) {
        showTrackAttendanceButton();
      } else {
        hideTrackAttendanceButton();
      }
    }
  } catch (ex) {
    console.error("Error running validation checking button state: ", ex);
  }
}

function showTrackAttendanceButton() {
  try {
    let trackAttendanceBtn = document.getElementById("trackAttendanceBlueButton_GMAT");
    if (trackAttendanceBtn != null) trackAttendanceBtn.style.display = "flex";
  } catch (e) {
    console.error(e);
  }
}

function hideTrackAttendanceButton() {
  try {
    let trackAttendanceBtn = document.getElementById("trackAttendanceBlueButton_GMAT");
    if (trackAttendanceBtn != null) trackAttendanceBtn.style.display = "none";
  } catch (e) {
    console.error(e);
  }
}

function updateTrackAttendanceButtonToTrackingMode() {
  try {
    let trackAttendanceButton = document.getElementById("trackAttendanceBlueButton_GMAT");
    if (trackAttendanceButton != null) {
      trackAttendanceButton.innerHTML = "Starting...Please wait";
      trackAttendanceButton.style.color = "#0d4431";
      trackAttendanceButton.style.border = "1px solid white";
      trackAttendanceButton.style.backgroundColor = "#83d991";
    }
  } catch (e) {
    console.error(e);
  }
}

function updateTrackAttendanceButtonContent(buttonText) {
  try {
    let trackAttendanceButton = document.getElementById("trackAttendanceBlueButton_GMAT");
    if (trackAttendanceButton != null) trackAttendanceButton.innerHTML = buttonText;
  } catch (e) {
    console.error(e);
  }
}

function resetTrackAttendanceButtonToDefault() {
  try {
    let trackAttendanceButton = document.getElementById("trackAttendanceBlueButton_GMAT");
    if (trackAttendanceButton != null) {
      trackAttendanceButton.innerHTML = "Track Attendance";
      trackAttendanceButton.style.backgroundColor = "#9bbbef";
      trackAttendanceButton.style.color = "#062e6f";
    }
  } catch (e) {
    console.error(e);
  }
}

function resetTrackAttendanceButton() {
  try {
    isAttendanceWorking = false;
    resetTrackAttendanceButtonToDefault();
    goingToStop = 0;
  } catch (e) {
    console.error(e);
  }
}

// ==========================================
// DETERMINISTIC PANEL DETECTION & INTERACTION
// ==========================================

async function tryToOpenParticipantsTab() {
  try {
    if (isParticipantsTabOpened()) return true;

    // Strategy A: Top right panel controls (Default modern meet layout UI)
    let primaryContainer = document.body.querySelectorAll(DEFAULT_PARTICIPANTS_BTN_SELECTOR);
    let filteredButtons = getButtonsUnderGoogleImgOrWithNumber(primaryContainer);
    if (filteredButtons.length > 0) {
      for (let i = 0; i < filteredButtons.length; i++) {
        try {
          filteredButtons[i].click();
          await wait(1000);
          if (isParticipantsTabOpened()) return true;
        } catch (e) {}
      }
    }

    // Strategy B: Fallback Top right panel selection variations
    primaryContainer = document.body.querySelectorAll(FALLBACK_PARTICIPANTS_BTN_SELECTOR);
    filteredButtons = getButtonsUnderGoogleImgOrWithNumber(primaryContainer);
    if (filteredButtons.length > 0) {
      for (let i = 0; i < filteredButtons.length; i++) {
        try {
          filteredButtons[i].click();
          await wait(1000);
          if (isParticipantsTabOpened()) return true;
        } catch (e) {}
      }
    }

    for (let i = 0; i < 3; i++) {
      await wait(1000);
      if (isParticipantsTabOpened()) return true;
    }

    // Strategy C: Handle legacy structure designs (Bottom Right Placement)
    filteredButtons = document.body.querySelectorAll(OLD_UI_PARTICIPANTS_BTN_SELECTOR);
    if (filteredButtons.length > 0) {
      for (let i = 0; i < filteredButtons.length; i++) {
        try {
          filteredButtons[i].click();
          await wait(1000);
          if (isParticipantsTabOpened()) {
            return true;
          }
        } catch (e) {}
      }
    }

    for (let i = 0; i < 6; i++) {
      await wait(1000);
      if (isParticipantsTabOpened()) return true;
    }
  } catch (e) {
    console.error("Exception inside tryToOpenParticipantsTab determinism sequence: ", e);
  }
  return false;
}

function isParticipantsTabOpened() {
  try {
    let participantEle = document.body.querySelectorAll(DEFAULT_PARTICIPANTS_NAME_SELECTOR);
    if (participantEle.length > 0) {
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

function getButtonsUnderGoogleImgOrWithNumber(buttonElements) {
  let firstPreferenceBtns = [];
  let googleIconHavingBtns = [];
  let numberHavingBtns = [];
  let numberOnlyBtns = [];
  try {
    for (const btn of buttonElements) {
      try {
        if (btn && btn != null) {
          const btnHasGoogleImg = btn.querySelector('img[src*="googleusercontent"]');
          const btnHasAnNumber = /\d+/.test(btn.innerText.trim());
          const btnHasOnlyNumber = /^\d+\+?$/.test(btn.innerText.trim());
          if (btnHasGoogleImg && btnHasAnNumber) {
            firstPreferenceBtns.push(btn);
          } else if (btnHasGoogleImg) {
            googleIconHavingBtns.push(btn);
          } else if (btnHasOnlyNumber) {
            numberOnlyBtns.push(btn);
          } else if (btnHasAnNumber) {
            numberHavingBtns.push(btn);
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    console.error(e);
  }
  return [...firstPreferenceBtns, ...googleIconHavingBtns, ...numberOnlyBtns, ...numberHavingBtns];
}

// ==========================================
// TRACK ATTENDANCE (CORE)
// ==========================================

function start() {
  try {
    if (startAttendanceTracker) {
      clearInterval(startAttendanceTracker);
      startAttendanceTracker = null;
    }
    startTime = new Date().toLocaleTimeString();
    startAttendanceTracker = setInterval(attendanceTracker, 1000);
  } catch (e) {
    console.error(e);
  }
}

function attendanceTracker() {
  try {
    let currentParticipantsInMeeting = null;

    if (isParticipantsTabOpened()) {
      currentParticipantsInMeeting = getParticipantsInformationFromParticipantsTab();
    } else {
      currentParticipantsInMeeting = getParticipantsInformationFromTiles();
    }

    if (currentParticipantsInMeeting != null && currentParticipantsInMeeting.size > 0) {
      markAttendanceForGivenParticipants(currentParticipantsInMeeting);
    } else {
      goingToStop += 1;
      if (goingToStop == 2) {
        if (!isUserInMeetingView() && totalClassDuration > 0) {
          stopAttendance(true);
        } else {
          if (totalClassDuration > 0) {
            stopAttendance(true);
          } else {
            showCantTrackNowButYouCanRecoverBanner("stoppedAbruptly");
            stopAttendance(false);
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function markAttendanceForGivenParticipants(currentParticipants) {
  try {
    let studentNameKeys = currentParticipants.keys();
    for (let index = 0; index < currentParticipants.size; index++) {
      let studentName = studentNameKeys.next().value;
      let studentPropertiesData = currentParticipants.get(studentName);
      let studentProfileIcon = studentPropertiesData.profileIcon;

      if (studentDetails.has(studentName)) {
        let data = studentDetails.get(studentName);
        data[0] += 1;
        studentDetails.set(studentName, data);
      } else {
        let joiningTime = new Date().toLocaleTimeString();
        let currStatus = 1;
        let data = [currStatus, joiningTime, studentProfileIcon];
        studentDetails.set(studentName, data);
      }
    }

    updateTrackAttendanceButtonContent("Tracking Attendance for " + toTimeFormat(totalClassDuration) + "<br>" + "Click To Generate Record");
    totalClassDuration += 1;
    goingToStop = 0;
    previousRecordBackup += 1;

    if (document.visibilityState == "visible") {
      totalActiveDuration += 1;
    }
    if (previousRecordBackup == 2 || previousRecordBackup % RECORD_BACKUP_THRESHOLD == 0) {
      saveCurrentRecordToLocalStorage();
    }
  } catch (e) {
    console.error(e);
  }
}

function stopAttendance(canGenerateRecord = true) {
  try {
    clearInterval(startAttendanceTracker);
    startAttendanceTracker = null;
    resetTrackAttendanceButton();
    if (canGenerateRecord) {
      let newRecord = getRecordWithCurrentData();
      if (newRecord != null) {
        openSaveAttendancePage(false);
      } else {
        showContactUsAlert(true, "failedAtStopAttendance");
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// ==========================================
// DATA EXTRACTION & DOM PARSING
// ==========================================

function getParticipantsInformationFromParticipantsTab() {
  let participantsInfo = new Map();
  try {
    let contributorDocumentToUse = getContributorsDocumentToFetchParticipantsName();
    let eleToUse = contributorDocumentToUse != null && contributorDocumentToUse.querySelectorAll(DEFAULT_PARTICIPANTS_NAME_SELECTOR).length > 0 ? contributorDocumentToUse : document.body;
    let participantsEle = eleToUse.querySelectorAll(DEFAULT_PARTICIPANTS_NAME_SELECTOR);

    participantsEle.forEach((el) => {
      try {
        const name = el.getAttribute("aria-label")?.trim() || el.querySelector("span")?.textContent?.trim() || null;
        const imgEl = el.querySelector(PARTICIPANT_IMAGE_SELECTOR);
        const imageUrl = imgEl?.src || DEFAULT_PROFILE_ICON;
        if (name != null && name.length > 0) {
          const userProperties = { profileIcon: imageUrl };
          if (!canShowProfileIconForRecords && !imageUrl.includes(DEFAULT_PROFILE_ICON)) {
            canShowProfileIconForRecords = true;
          }
          participantsInfo.set(name, userProperties);
        }
      } catch (e) {}
    });
  } catch (e) {
    console.error(e);
  }
  return participantsInfo;
}

function getParticipantsInformationFromTiles() {
  let participantsInfo = new Map();
  try {
    let participantsEle = document.body.querySelectorAll(FALLBACK_PARTICIPANTS_NAME_SELECTOR);
    participantsEle.forEach((el) => {
      try {
        const name = el.querySelector("span.notranslate")?.textContent?.trim() || null;
        const imgEl = el.querySelector(PARTICIPANT_IMAGE_SELECTOR);
        const imageUrl = imgEl?.src || DEFAULT_PROFILE_ICON;
        if (name != null && name.length > 0) {
          const userProperties = { profileIcon: imageUrl };
          if (!canShowProfileIconForRecords && !imageUrl.includes(DEFAULT_PROFILE_ICON)) {
            canShowProfileIconForRecords = true;
          }
          participantsInfo.set(name, userProperties);
        }
      } catch (e) {}
    });
  } catch (e) {
    console.error(e);
  }
  return participantsInfo;
}

function getParticipantsCountInMeeting() {
  try {
    let countEle = document.getElementsByClassName("egzc7c");
    if (countEle.length == 0) countEle = document.getElementsByClassName("uGOf1d");
    if (countEle.length >= 1) {
      for (let i = 0; i < countEle.length; i++) {
        try {
          let value = Number(countEle[i].innerText);
          if (!isNaN(value) && value >= 1 && isFinite(value)) return value;
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error(e);
  }
  return -1;
}

function getContributorsDocumentToFetchParticipantsName() {
  try {
    let contributorsDocument = document.getElementsByClassName(CONTRIBUTORS_ELEMENT);
    let contributorsDocumentLength = contributorsDocument.length;
    if (contributorsDocumentLength == 1) {
      return contributorsDocument[0];
    } else if (contributorsDocumentLength > 1) {
      for (let i = 0; i < contributorsDocumentLength; i++) {
        let participantsCount = contributorsDocument[i].querySelectorAll(DEFAULT_PARTICIPANTS_NAME_SELECTOR).length;
        if (participantsCount > 0) return contributorsDocument[i];
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

function getCurrentMeetingName() {
  try {
    if (hasAttribute(DATA_MEETING_TITLE_ATTR)) {
      let attributeNodes = getAttributeElements(DATA_MEETING_TITLE_ATTR);
      if (attributeNodes != null && attributeNodes.length > 0) {
        let meetingNameNode = attributeNodes[0];
        let meetingName = meetingNameNode.innerText;
        if (meetingName.includes("\n")) {
          meetingName = meetingName.split("\n")[0].trim();
          if (meetingName.length > 0) {
            isCustomMeetingName = getMeetingCode() === meetingName ? false : true;
            return meetingName;
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

function getMeetingCode() {
  try {
    return window.location.pathname.substring(1);
  } catch (e) {}
  return "meet";
}

// ==========================================
// SAVE TO LOCAL STORAGE
// ==========================================

function saveCurrentRecordToLocalStorage() {
  try {
    let currentRecordData = getRecordWithCurrentData();
    if (currentRecordData != null) {
      localStorage.setItem(LOCAL_KEY_PREVIOUS_RECORD, JSON.stringify(currentRecordData));
    }
  } catch (e) {
    console.error(e);
  }
}

function getPreviousRecordData() {
  try {
    let previousRecordData = null;
    try {
      previousRecordData = localStorage.getItem(LOCAL_KEY_PREVIOUS_RECORD);
    } catch (e) {}
    if (previousRecordData != null && typeof previousRecordData == "string" && previousRecordData !== "" && previousRecordData !== "[]" && previousRecordData.length > 2 && isJSON(previousRecordData)) {
      return JSON.parse(previousRecordData);
    }
  } catch (err) {
    console.error(err);
  }
  return null;
}

function isPreviousRecordPresent() {
  try {
    return getPreviousRecordData() != null;
  } catch (e) {
    return false;
  }
}

function proceedSavingPreviousRecord(isAlertPopupRequired = true) {
  try {
    if (isAlertPopupRequired) {
      alert('Unsaved previously tracked attendance record found!\nOn clicking "OK" It will be recovered now.');
    }
    let previousRecord = getPreviousRecordData();
    if (previousRecord != null) {
      openSaveAttendancePage(true);
    } else {
      showContactUsAlert(true, "previousrecorddatanotfound");
    }
  } catch (er) {
    console.error(er);
  }
}

// ==========================================
// DATA TRANSMISSION & CROSS-TAB EVENT DISPATCH
// ==========================================

function openSaveAttendancePage(isPreviousRecord) {
  try {
    let saveAttendanceURL = getSaveAttendanceURL();
    const trackingVersionParam = `?isPreviousRecord=${isPreviousRecord}&version=${EXTENSION_VERSION}`;

    // Opens the hosted domain page (or localhost port context target) in a clean tab environment
    const newTab = window.open(saveAttendanceURL + trackingVersionParam, "_blank");
    if (newTab) {
      newTab.focus();
    }
  } catch (error) {
    console.error("Unable to execute openSaveAttendancePage link runtime handler: ", error);
  }
}

function setDefaultMessageListener(event) {
  try {
    if (!isValidMessageListenerCall(event)) return;
    if (canProcessEvent(event)) {
      let eventData = JSON.parse(event.data);
      if (eventData.hasOwnProperty("action")) {
        let eventAction = eventData.action;
        if (eventAction === "sendPreviousRecord") {
          let attendanceRecord = getPreviousRecordData();
          if (attendanceRecord != null) {
            event.source.postMessage(JSON.stringify(attendanceRecord), event.origin);
          }
        } else if (eventAction === "sendCurrentRecord") {
          let attendanceRecord = getRecordWithCurrentData();
          if (attendanceRecord != null) {
            event.source.postMessage(JSON.stringify(attendanceRecord), event.origin);
          }
        } else if (eventAction === "removePreviousRecord") {
          localStorage.removeItem(LOCAL_KEY_PREVIOUS_RECORD);
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

window.addEventListener("message", setDefaultMessageListener);

// ==========================================
// NAME FORMATTING & RECORD ASSEMBLY
// ==========================================

/**
 * Core Name Parsing Engine
 * Converts names into standard: LASTNAME, FIRST NAME MIDDLE_INITIAL.
 * Handles multiple first names, optional middle initials, and already-formatted names.
 */

function formatParticipantName(rawName) {
  if (!rawName) return "UNKNOWN, PARTICIPANT";

  let cleanName = rawName.replace(/\s+/g, " ").trim();

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const isInitial = (s) => /^[A-Za-z]\.?$/.test(s);

  // -------------------------
  // CASE 1: Has comma
  // -------------------------
  if (cleanName.includes(",")) {
    let parts = cleanName.split(",");

    // Ignore malformed names with multiple commas
    if (parts.length === 2) {
      let left = parts[0].trim();
      let right = parts[1].trim();

      // LEFT has one word = already LASTNAME, FIRSTNAME
      if (left.split(" ").length === 1) {
        return `${toTitleCase(left)}, ${toTitleCase(right)}`;
      }

      // Otherwise assume FIRSTNAME M., LASTNAME
      return `${toTitleCase(right)}, ${toTitleCase(left)}`;
    }
  }

  let tokens = cleanName.split(" ");

  if (tokens.length === 1) {
    return toTitleCase(tokens[0]);
  }

  // -------------------------
  // CASE 2:
  // LASTNAME FIRSTNAME M.
  // Example:
  // ABIZAR CAITLIN GAIL D
  // -------------------------
  let lastToken = tokens[tokens.length - 1];

  if (isInitial(lastToken)) {
    let lastName = toTitleCase(tokens[0]);
    let middleInitial = lastToken.endsWith(".") ? lastToken.toUpperCase() : lastToken.toUpperCase() + ".";
    let firstName = toTitleCase(tokens.slice(1, -1).join(" "));

    return `${lastName}, ${firstName} ${middleInitial}`;
  }

  // -------------------------
  // CASE 3:
  // FIRSTNAME M. LASTNAME
  // Example:
  // CAITLIN GAIL D. ABIZAR
  // -------------------------
  let initialIndex = tokens.findIndex(isInitial);

  if (initialIndex > 0 && initialIndex < tokens.length - 1) {
    let middleInitial = tokens[initialIndex].endsWith(".") ? tokens[initialIndex].toUpperCase() : tokens[initialIndex].toUpperCase() + ".";

    let firstName = toTitleCase(tokens.slice(0, initialIndex).join(" "));
    let lastName = toTitleCase(tokens.slice(initialIndex + 1).join(" "));

    return `${lastName}, ${firstName} ${middleInitial}`;
  }

  // -------------------------
  // CASE 4:
  // FIRSTNAME LASTNAME
  // -------------------------
  let lastName = toTitleCase(tokens[tokens.length - 1]);
  let firstName = toTitleCase(tokens.slice(0, -1).join(" "));

  return `${lastName}, ${firstName}`;
}

function getRecordWithCurrentData() {
  try {
    let meetingCode = getMeetingCode();
    let date = new Date();
    let dd = date.getDate();
    let mm = date.toLocaleString("default", { month: "short" });
    let yyyy = date.getFullYear();
    date = dd + "-" + mm + "-" + yyyy;

    // 1. Map into unified row objects to protect data integrity during sorting
    let participantRows = [];
    let mapKeys = studentDetails.keys();

    for (let i = 0; i < studentDetails.size; i++) {
      let rawName = mapKeys.next().value;
      let data = studentDetails.get(rawName);

      // Apply formatting rules immediately
      let formattedName = formatParticipantName(rawName);

      participantRows.push({
        name: formattedName,
        duration: data[0],
        joinTime: data[1],
        profileIcon: data[2],
      });
    }

    // 2. Sort row objects alphabetically (A-Z) using the formatted name string
    participantRows.sort((rowA, rowB) => {
      return rowA.name.localeCompare(rowB.name, undefined, { sensitivity: "accent", numeric: true });
    });

    // 3. Unzip the safely-sorted row objects back into individual arrays for transmission
    let sortedStudentNames = [];
    let studentsAttendedDuration = [];
    let studentsJoiningTime = [];
    let studentsProfileIcons = [];

    participantRows.forEach((row) => {
      sortedStudentNames.push(row.name);
      studentsAttendedDuration.push(row.duration);
      studentsJoiningTime.push(row.joinTime);
      studentsProfileIcons.push(row.profileIcon);
    });

    let newRecord = {
      meetingCode: meetingCode,
      date: date,
      attendanceStartTime: startTime,
      attendanceStopTime: new Date().toLocaleTimeString(),
      studentNames: sortedStudentNames,
      attendedDuration: studentsAttendedDuration,
      joiningTime: studentsJoiningTime,
      profileIcons: studentsProfileIcons,
      customDefinitions: [canShowProfileIconForRecords, isCustomMeetingName],
      meetingDuration: totalClassDuration,
      totalActiveTimeInMeet: totalActiveDuration,
    };

    if (isCustomMeetingName && currentMeetingName != null) {
      newRecord.meetingName = currentMeetingName;
    }
    return newRecord;
  } catch (err) {
    console.error("Error compilation step: ", err);
    showContactUsAlert(true, "agentbreakage");
  }
  return null;
}

function resetGlobalVariablesForNewRecord() {
  try {
    startTime = new Date().toLocaleTimeString();
    isCustomMeetingName = false;
    canShowProfileIconForRecords = false;
    currentMeetingName = getCurrentMeetingName();
    studentDetails.clear();
    totalClassDuration = 0;
    totalActiveDuration = 0;
    previousRecordBackup = 0;
    goingToStop = 0;
  } catch (e) {
    console.error(e);
  }
}

// ==========================================
// MODAL INTERACTION BANNERS & SYSTEM UTILS
// ==========================================

function showCantTrackNowButYouCanRecoverBanner(reason) {
  try {
    let bannerTitle = "Meet Attendance Tracker";
    let errorCode = reason === "stoppedAbruptly" ? "ATTENDANCE_TRACKING_FAILED" : "CANNOT_START_ATTENDANCE";
    let bannerContent = `<span style="margin-top: 13px;"><b>Error: </b> <span style="color: #fc0000;">${errorCode}</span></span> <p style="margin-top:20px; font-size: 15px;"> Don't worry - <span style="color: #000000;">You can still get attendance record for this meeting.</span></p>`;
    let buttonContent = "Get Attendance Record";
    let buttonActionCallBack = function () {
      // Reuses the same recovery pipeline as the auto-detected "unsaved record" flow:
      // opens the dashboard (saveAttendance.html) with isPreviousRecord=true, which makes
      // attendanceDashboard.js request the saved backup via "sendPreviousRecord".
      openSaveAttendancePage(true);
    };
    showBanner(bannerTitle, bannerContent, buttonContent, buttonActionCallBack);
  } catch (e) {}
}

function showBanner(bannerTitle, bannerContent, buttonContent, actionBtnCallBack) {
  try {
    if (document.getElementById("meetAttendanceTrackExtensionBanner") == null) {
      let bannerHTML = `<div id='meetAttendanceTrackExtensionBanner' style='position:fixed;bottom:15px;right:230px;width:230px;max-width:94%;padding:15px 10px;border-radius:10px;border:1px solid #d9534f;background:linear-gradient(180deg,#fff4e5,#fff1c2);color:#663c00;font-family:Inter,Arial,sans-serif;font-size:14px;display:flex;flex-direction:column;gap:14px;box-shadow:0 10px 28px rgba(0,0,0,0.2);z-index:999999;position:relative;'> <button id='meetAttendanceTrackExtensionBannerClose' style='all:unset;position:absolute;top:10px;right:10px;cursor:pointer;font-size:16px;line-height:1;color:#663c00;'>✖</button> <div style='display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;'> <span style='font-size:18px;'>⚠️</span> <span>${bannerTitle}</span> </div> <div style='display:flex;gap:10px;align-items:flex-start;font-weight:600;'> <span>${bannerContent}</span> </div> <div style='display:flex;justify-content:flex-end;gap:10px;margin-top:6px;'><span id="bannerContactUsLink" style="color: #0060de; margin-top: 7px; margin-right: 10px; cursor: pointer; text-decoration: underline;"> <b>Contact Support </b></span> <button id='meetAttendanceTrackerBannerActionBtn' style='all:unset;cursor:pointer;padding:8px 14px;border-radius:6px;font-weight:600;background:#1a73e8;color:#fff;'>${buttonContent}</button> </div> </div>`;
      document.body.insertAdjacentHTML("beforeend", bannerHTML);

      document.getElementById("meetAttendanceTrackExtensionBannerClose").addEventListener("click", removeBanner);
      document.getElementById("meetAttendanceTrackerBannerActionBtn").addEventListener("click", actionBtnCallBack);
      document.getElementById("bannerContactUsLink").addEventListener("click", function () {
        window.open(getContactUsURL() + "?source=extErrorBanner");
      });
    }
  } catch (e) {}
}

function removeBanner() {
  try {
    let bannerEle = document.getElementById("meetAttendanceTrackExtensionBanner");
    if (bannerEle != null) bannerEle.remove();
  } catch (e) {}
}

function showContactUsAlert(redirectToSupportPage = true, source = "extension") {
  try {
    if (!wasAlreadyAlerted) {
      let alertContent = redirectToSupportPage ? "Something went wrong in Meet Attendance Tracker chrome extension! Please contact us in the next step" : "Something went wrong in Meet Attendance Tracker chrome extension! Please contact support.";
      alert(alertContent);
      wasAlreadyAlerted = true;
      if (redirectToSupportPage) {
        window.open(getContactUsURL() + "?type=extError&source=" + source);
      }
    }
  } catch (e) {}
}

function isValidMessageListenerCall(event) {
  try {
    if (event && event.origin && event.origin === getTargetBaseURL()) return true;
  } catch (e) {}
  return false;
}

function canProcessEvent(event) {
  try {
    if (event && event.data !== undefined && isJSON(event.data)) return true;
  } catch (e) {}
  return false;
}

function hasAttribute(attributeName) {
  try {
    return document.body.querySelectorAll("[" + attributeName + "]").length > 0;
  } catch (e) {}
  return false;
}

function getAttributeElements(attributeName) {
  try {
    return document.body.querySelectorAll("[" + attributeName + "]");
  } catch (e) {}
  return null;
}

function getAttributeLen(attributeName) {
  try {
    return document.body.querySelectorAll("[" + attributeName + "]").length;
  } catch (e) {}
  return 0;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toTimeFormat(time) {
  let hh = Math.floor(time / 3600);
  time = time - hh * 3600;
  let mm = Math.floor(time / 60);
  let ss = time - mm * 60;
  if (hh == 0) return mm + " min " + ss + "s";
  return hh + " hr " + mm + " min " + ss + "s";
}

function isJSON(data) {
  try {
    JSON.parse(data);
    return true;
  } catch (ex) {
    return false;
  }
}
