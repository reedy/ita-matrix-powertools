import React from "dom-chef";
import formatDistanceToNow from "date-fns/esm/formatDistanceToNow";
import enUS from "date-fns/esm/locale/en-US";
import de from "date-fns/esm/locale/de";

import userSettings, { saveUserSettings } from "../settings/userSettings";
import { getCabinFromITA } from "../settings/appSettings";
import { updateCurrentSearch, stateEnabled, getStateUrl } from "../state";

import { SavedSearch } from "./savedSearch";

const MAX_HISTORY_LENGTH = 100;

let container: HTMLDivElement;

function showHistory() {
  return userSettings.enableHistory && window.Storage?.prototype?.setItem;
}

export function renderHistory() {
  if (!showHistory()) return;
  subscribeSearchChanges();
  if (userSettings.history?.length) {
    container = renderHistoryContainer();

    (async function() {
      await redrawHistory("pins");
      await redrawHistory("history");
      container.style.display = "block";
    })();
  }
}

export function removeHistory() {
  container?.parentNode?.removeChild(container);
  document.body.classList.remove("show-history");
}

function subscribeSearchChanges() {
  var _setItem = window.Storage.prototype.setItem;
  window.Storage.prototype.setItem = function(key, value) {
    _setItem.apply(this, arguments);
    if (key !== "savedSearch.0") return;

    const search = getSearchObject(value);
    userSettings.history = [
      {
        ts: new Date().toISOString(),
        savedSearch: value,
        url: getSearchUrl(search[1], value)
      },
      ...userSettings.history.filter(h => {
        const hist = getSearchObject(h.savedSearch);
        return JSON.stringify(hist) !== JSON.stringify(search);
      })
    ].slice(0, MAX_HISTORY_LENGTH);
    saveUserSettings();
  };
}

function getSearchObject(savedSearch: string): SavedSearch {
  const { "12": _, ...token } = JSON.parse(savedSearch);
  return token;
}

function renderHistoryContainer() {
  const container: HTMLDivElement = (
    <div
      style={{
        position: "fixed",
        width: "200px",
        top: "20px",
        left: 0,
        bottom: "20px",
        padding: "0 20px",
        borderRight: "1px dashed grey",
        overflowY: "auto",
        display: "none"
      }}
    ></div>
  );
  document.body.classList.add("show-history");
  document.body.append(container);

  return container;
}

async function redrawHistory(setting: "history" | "pins") {
  const config = {
    pins: {
      title: "Pinned",
      setting: "pins",
      showPin: false,
      showDistanceToNow: false
    },
    history: {
      title: "History",
      setting: "history",
      showPin: true,
      showDistanceToNow: true
    }
  };
  const section = config[setting];

  const id = `pt-container-${setting}`;

  let div = window.document.getElementById(id);
  if (!div) {
    div = <div id={id}></div>;
    container.appendChild(div);
  }
  div.innerHTML = null;

  if (!userSettings[setting] || !userSettings[setting].length) return;

  div.appendChild(<p>{section.title}</p>);

  let lastDistance;
  await userSettings[setting].reduce(async (last, h) => {
    await last;

    if (section.showDistanceToNow) {
      const distance = formatDistanceToNow(new Date(h.ts), {
        locale: userSettings.language === "de" ? de : enUS,
        addSuffix: true
      });
      const label = distance !== lastDistance ? <div>{distance}</div> : null;
      lastDistance = distance;
      label && div.appendChild(label);
    }

    const search = getSearchObject(h.savedSearch);
    if (!h.url) h.url = getSearchUrl(search[1], h.savedSearch);

    const linkText = `${(search[3][7] || [])
      .map(s => `${s[5]}-${s[3]}`)
      .join(" ")} (${getCabinFromITA(search[3][8])})`;

    div.appendChild(
      <div
        class="pt-history-item"
        style={{
          position: "relative",
          margin: "1em -1rem",
          padding: "0 1rem"
        }}
      >
        <a
          style={{
            display: "block"
          }}
          onClick={e => changeSearch(e, search[1], h.savedSearch)}
          href={h.url}
          title={linkText}
        >
          {linkText}
        </a>
        {section.showPin ? (
          <a
            class="pt-history-action"
            style={{
              cursor: "pointer",
              position: "absolute",
              left: 0,
              top: 0,
              textDecoration: "none",
              visibility: "hidden"
            }}
            onClick={e => pin(h)}
            title="Pin"
          >
            <svg
              style={{ width: ".8rem", height: ".8rem", fill: "yellow" }}
              xmlns="http://www.w3.org/2000/svg"
              height="512pt"
              width="512pt"
              viewBox="0 0 512 512"
            >
              <path d="M114.594 491.14c-5.61 0-11.18-1.75-15.934-5.187a27.223 27.223 0 01-10.582-28.094l32.938-145.09L9.312 214.81a27.188 27.188 0 01-7.976-28.907 27.208 27.208 0 0123.402-18.71l147.797-13.419L230.97 17.027C235.277 6.98 245.089.492 255.992.492s20.715 6.488 25.024 16.512l58.433 136.77 147.774 13.417c10.882.98 20.054 8.344 23.425 18.711 3.372 10.368.254 21.739-7.957 28.907L390.988 312.75l32.938 145.086c2.414 10.668-1.727 21.7-10.578 28.098-8.832 6.398-20.61 6.89-29.91 1.3l-127.446-76.16-127.445 76.203c-4.309 2.559-9.11 3.864-13.953 3.864zm141.398-112.874c4.844 0 9.64 1.3 13.953 3.859l120.278 71.938-31.086-136.942a27.21 27.21 0 018.62-26.516l105.473-92.5-139.543-12.671a27.18 27.18 0 01-22.613-16.493L255.992 39.895 200.844 168.96c-3.883 9.195-12.524 15.512-22.547 16.43L38.734 198.062l105.47 92.5c7.554 6.614 10.858 16.77 8.62 26.54l-31.062 136.937 120.277-71.914c4.309-2.559 9.11-3.86 13.953-3.86zm-84.586-221.848s0 .023-.023.043zm169.13-.063l.023.043c0-.023 0-.023-.024-.043zm0 0" />
            </svg>
          </a>
        ) : null}
        <a
          class="pt-history-action"
          style={{
            cursor: "pointer",
            position: "absolute",
            right: 0,
            top: 0,
            textDecoration: "none",
            visibility: "hidden"
          }}
          onClick={e => remove(e, search)}
          title="Remove"
        >
          <svg
            style={{ width: ".8rem", height: ".8rem", fill: "red" }}
            xmlns="http://www.w3.org/2000/svg"
            height="512pt"
            width="512pt"
            viewBox="0 0 512 512"
          >
            <path d="M256 512C114.836 512 0 397.164 0 256S114.836 0 256 0s256 114.836 256 256-114.836 256-256 256zm0-480C132.48 32 32 132.48 32 256s100.48 224 224 224 224-100.48 224-224S379.52 32 256 32zm-79.187 319.188c-4.098 0-8.195-1.555-11.309-4.691-6.25-6.25-6.25-16.383 0-22.633l158.398-158.402c6.254-6.25 16.387-6.25 22.637 0s6.25 16.383 0 22.637L188.137 346.496c-3.156 3.137-7.25 4.691-11.324 4.691zm0 0" />
            <path d="M335.188 351.188c-4.094 0-8.191-1.555-11.305-4.691L165.484 188.117a16 16 0 1 1 22.633-22.633l158.398 158.398a16 16 0 0 1 0 22.633c-3.133 3.117-7.23 4.672-11.328 4.672zm0 0" />
          </svg>
        </a>
      </div>
    );

    function pin(search) {
      const searchObj = getSearchObject(search.savedSearch);
      userSettings.pins = [
        search,
        ...userSettings.pins.filter(h => {
          const hist = getSearchObject(h.savedSearch);
          return JSON.stringify(hist) !== JSON.stringify(searchObj);
        })
      ];
      saveUserSettings();
      redrawHistory("pins");
    }

    function remove(e: MouseEvent, search: SavedSearch) {
      userSettings[setting] = userSettings[setting].filter(h => {
        const hist = getSearchObject(h.savedSearch);
        return JSON.stringify(hist) !== JSON.stringify(search);
      });
      saveUserSettings();
      redrawHistory(setting);
    }
  }, Promise.resolve(undefined));
}

function getHash(key) {
  return `#search:research=${key}`;
}

function changeSearch(e: MouseEvent, key: string, savedSearch: string) {
  if (stateEnabled()) return; // stateful URL will handle everything

  updateCurrentSearch(savedSearch);

  if (
    e.ctrlKey ||
    e.shiftKey ||
    e.metaKey || // apple
    (e.button && e.button == 1) // middle click, >IE9 + everyone else
  ) {
    // https://stackoverflow.com/a/20087506/82199
    return;
  }
  e.preventDefault();
  window.location.hash = getHash(key);
  window.location.reload(true);
}

function getSearchUrl(key: string, search: string) {
  if (stateEnabled()) {
    return getStateUrl({ search }, getHash(key));
  } else {
    return (
      window.location.pathname +
      window.location.search +
      `#search:research=${key}`
    );
  }
}
