import appSettings from "./appSettings";

const defaultSettings = {
  timeformat: "12h", // replaces times on resultpage - valid: 12h / 24h
  language: "en", // replaces several items on resultpage - valid: en / de
  linkFontsize: 100, // fontsize of links - valid: 50-200
  showAllAirlines: 0, // shows all airline links regardless of search results

  // booleans to toggle specific settings:
  enableDeviders: 1, // Print deviders in links after group (airlines/otas/other stuff) - valid: 0 / 1
  enableInlineMode: 1, // enables inline mode - valid: 0 / 1
  enableEditormode: 0, // prevents the script from automatically parsing the itinerary - valid: 0 / 1
  enableIMGautoload: 0, // enables images to auto load - valid: 0 / 1
  enableFarerules: 1, // enables fare rule opening in new window - valid: 0 / 1
  enablePricebreakdown: 1, // enables price breakdown - valid: 0 / 1
  enableDarkmode: 0, // enables dark mode - valid: 0 / 1
  enableMultiSearch: 1, // enables supporting multiple searches and search linking
  enableHistory: 1, // enables search history
  enablePlanefinder: 1, // enables Planefinder - click on flight numbers to open Planefinder for this flight - valid: 0 / 1
  enableSeatguru: 1, // enables Seatguru - click on plane type to open Seatguru for this flight - valid: 0 / 1
  enableWheretocredit: 1, // enables Wheretocredit - click on booking class to open wheretocredit for this flight - valid: 0 / 1

  /** @type {{ ts: string, savedSearch: string, url: string }[]} history */
  history: [], // search history

  /** @type {{ ts: string, savedSearch: string, url: string }[]} history */
  pins: [], // search history

  enableAffiliates: 1
};

export const registeredSettings = {};

/**
 * Registers a link
 * @param {string} name
 * @param {string} id
 * @param {{ name: string, value: string }[]} values
 * @param {string} defaultValue
 */
export function registerSetting(name, id, values, defaultValue) {
  registeredSettings[id] = { name, values };
  defaultSettings[id] = defaultValue;
}

export async function saveUserSettings(settings = defaultSettings) {
  if (appSettings.isUserscript)
    await GM.setValue("mptUserSettings", JSON.stringify(settings));
  else localStorage.setItem("mptUserSettings", JSON.stringify(settings));
}

export async function loadUserSettings() {
  let gmSavedUserSettings;
  if (appSettings.isUserscript)
    gmSavedUserSettings = await GM.getValue("mptUserSettings");
  else gmSavedUserSettings = localStorage.getItem("mptUserSettings");

  console.dir(gmSavedUserSettings);
  if (!gmSavedUserSettings || typeof gmSavedUserSettings !== "string") return;

  /** @type typeof defaultSettings */
  const savedUserSettings = JSON.parse(gmSavedUserSettings);
  if (!savedUserSettings) return;

  Object.assign(defaultSettings, savedUserSettings);
}

export default defaultSettings;
