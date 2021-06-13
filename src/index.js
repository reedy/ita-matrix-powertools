import mptSettings, { reset } from "./settings/appSettings";
import { loadUserSettings } from "./settings/userSettings";
import classSettings, { findTargetSetVersion } from "./settings/itaSettings";
import { printNotification, findtarget } from "./utils";

import { readItinerary } from "./parse/itin";

import { render, cleanUp } from "./print";
import { createUsersettings } from "./print/settings";
import { bindDarkmode } from "./print/darkmode";
import { manageState } from "./state";
import { renderHistory } from "./print/history";

/**************************************** Start Script *****************************************/

// *** DO NOT CHANGE BELOW THIS LINE***/
(async () => {
  await loadUserSettings();
  createUsersettings();
  manageState();
  injectCss();
  bindDarkmode();

  if (window.top === window.self) {
    if (!mptSettings.isUserscript || document.readyState == "complete") {
      startScript();
    } else {
      window.addEventListener("load", () => startScript(), false);
    }
  }
})(); // end async for GM4

function startScript() {
  pageChanged();
  window.addEventListener(
    "hashchange",
    () => {
      if (window.location.hash !== mptSettings.laststatus) {
        pageChanged();
      }
    },
    false
  );
}

function pageChanged() {
  reset();
  cleanUp();
  setTimeout(function() {
    getPage();
  }, 200);
  mptSettings.laststatus = window.location.hash;
}

/********************************************* Get page ***********************************************/
function getPage() {
  if (window.location.href.indexOf("view-details") != -1) {
    resultPage();
  } else if (
    window.location.href.indexOf("#search:") != -1 ||
    window.location.href == "https://matrix.itasoftware.com/" ||
    !window.location.hash
  ) {
    startPage();
  }
}
/********************************************* Start page *********************************************/
function startPage() {
  // try to get content
  if (!findTargetSetVersion(settings => settings.startpage.maindiv, 1)) {
    printNotification("Error: Unable to find content on start page.");
    return false;
  } else {
    renderHistory();
    fixSearchTab();
    // apply style-fix
    const target = findtarget(classSettings.startpage.maindiv, 1);
    target.children[0].children[0].children[0].children[0].setAttribute(
      "valign",
      "top"
    );
  }
}

function fixSearchTab() {
  // ITA doesn't always set the correct search tab on hash nav
  if (!window.location.hash.startsWith("#search:research=")) return;

  const search = JSON.parse(localStorage["savedSearch.0"]);
  if (!window.location.hash.endsWith(search[1])) return;

  const searchIndexes = {
    MULTI_CITY: 2,
    ONE_WAY: 1,
    ROUND_TRIP: 0 // default - can ignore
  };
  const searchIndex = searchIndexes[search[2]];
  if (!searchIndex) return;

  const tabBarItems = window.document.querySelectorAll(
    `.${classSettings.startpage.tabBarItem}`
  );
  tabBarItems[searchIndex] &&
    tabBarItems[searchIndex].firstElementChild &&
    tabBarItems[searchIndex].firstElementChild.click();
}
/********************************************* Result page *********************************************/

//Primary function for extracting flight data from ITA/Matrix
function resultPage() {
  // try to get content
  const itin = findTargetSetVersion(settings => settings.resultpage.itin, 1);
  if (!itin) {
    printNotification("Error: Unable to find Content on result page.");
    return false;
  }
  // retry if itin not loaded
  if (itin.parentElement.previousElementSibling.style.display != "none") {
    mptSettings.retrycount++;
    if (mptSettings.retrycount > 50) {
      printNotification(
        "Error: Timeout on result page. Content not found after 10s."
      );
      return false;
    }
    setTimeout(function() {
      resultPage();
    }, 200);
    return false;
  }
  // do some self-testing to prevent crashing on class-changes
  for (let i in classSettings.resultpage) {
    if (findtarget(classSettings.resultpage[i], 1) === undefined) {
      printNotification(
        "Error: Unable to find class " +
          classSettings.resultpage[i] +
          " for " +
          i +
          "."
      );
      return false;
    }
  }

  readItinerary();
  render();
}

function injectCss() {
  let css = "",
    head = document.head || document.getElementsByTagName("head")[0],
    style = document.createElement("style");
  style.type = "text/css";

  css += `@media only screen and (max-width: ${984 +
    261 * 2}px) { body.show-history { padding-left: 261px; } }`; // max-width + history-width * 2 for centered content
  css += `body.dark-mode, body.dark-mode input[type='text'], body.dark-mode input[type='radio'], body.dark-mode textarea, body.dark-mode select, body.dark-mode button, body.dark-mode .powertoolsimage, body.dark-mode .pt-hover-menu, body.dark-mode .pt-hover-menu-flex { background-color: #121212; color: #f5f5f5; }`;
  css += `body.dark-mode .${classSettings.resultpage.mcDiv}.powertoolslinkinlinecontainer { background-color: #1f1f1f; }`;
  css +=
    "body.dark-mode img.logo, body.dark-mode img[src^='data'] { filter: hue-rotate(180deg) brightness(.93) invert(1); }";
  css += "body.dark-mode img[src^='http'] { opacity: 0.75 }";
  css +=
    "body.dark-mode a, body.dark-mode a:link, body.dark-mode a:hover, body.dark-mode a:active, body.dark-mode .linked { color: #85daff; }";
  css += "body.dark-mode a:visited { color: #8ec6ec; }";
  css +=
    "body.dark-mode .pt-textlink a { text-decoration: none; color: #f5f5f5; }";
  css +=
    ".pt-hover-menu, .pt-hover-menu-flex { position:absolute; padding: 8px; z-index: 1; background-color: #FFF; border: 1px solid #808080; display:none; }";
  css += ".pt-hover-container:hover .pt-hover-menu { display:inline; }";
  css += ".pt-hover-container:hover .pt-hover-menu-flex { display:flex; }";
  css += ".pt-textlink a { text-decoration: none; color: black; }";
  css += `.${classSettings.resultpage.mcDiv}.powertoolslinkinlinecontainer { background-color: #f2f2f2; }`;
  css +=
    ".powertoolsimage { width: 184px; height: 100px; background-color: white; border: 1px solid #808080; cursor: pointer; text-align: center; margin-top: 10px; padding-top: 84px; }";
  css +=
    ".pt-history-item:hover .pt-history-action { visibility: visible !important; }";
  style.appendChild(document.createTextNode(css));

  head.appendChild(style);
}
