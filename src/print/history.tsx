import React from "dom-chef";
import formatDistanceToNow from "date-fns/esm/formatDistanceToNow";
import enUS from "date-fns/esm/locale/en-US";
import de from "date-fns/esm/locale/de";

import userSettings, { saveUserSettings } from "../settings/userSettings";
import { getCabinFromITA } from "../settings/appSettings";
import { updateCurrentSearch, stateEnabled, getStateUrl } from "../state";
import { waitFor } from "../utils";

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
        left: "20px",
        bottom: "20px",
        paddingRight: "20px",
        borderRight: "1px dashed grey",
        overflowY: "auto",
        display: "none"
      }}
    >
      <p>History</p>
    </div>
  );
  document.body.classList.add("show-history");
  document.body.append(container);

  (async function() {
    let lastDistance;
    let t0 = performance.now();
    await userSettings.history
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .reduce(async (last, h) => {
        await last;

        const search = getSearchObject(h.savedSearch);
        const distance = formatDistanceToNow(new Date(h.ts), {
          locale: userSettings.language === "de" ? de : enUS,
          addSuffix: true
        });
        const label = distance !== lastDistance ? <div>{distance}</div> : null;
        lastDistance = distance;

        if (!h.url) h.url = getSearchUrl(search[1], h.savedSearch);

        const linkText = `${(search[3][7] || [])
          .map(s => `${s[5]}-${s[3]}`)
          .join(" ")} (${getCabinFromITA(search[3][8])})`;

        label && container.appendChild(label);
        container.appendChild(
          <div
            class="pt-history-item"
            style={{
              position: "relative",
              margin: "1em 0"
            }}
          >
            <a
              style={{
                paddingRight: ".8rem",
                display: "block"
              }}
              onClick={e => changeSearch(e, search[1], h.savedSearch)}
              href={h.url}
              title={linkText}
            >
              {linkText}
            </a>
            <a
              class="pt-history-remove"
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
                style={{ width: ".8rem", height: ".8rem", fill: "#E46D31" }}
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

        const t1 = performance.now();
        if (t1 - t0 > 100) {
          await waitFor(0);
          t0 = t1;
        }
      }, Promise.resolve(undefined));
    container.style.display = "block";
  })();

  return container;
}

function getHash(key) {
  return `#search:research=${key}`;
}

function remove(e: MouseEvent, search: SavedSearch) {
  userSettings.history = userSettings.history.filter(h => {
    const hist = getSearchObject(h.savedSearch);
    return JSON.stringify(hist) !== JSON.stringify(search);
  });
  saveUserSettings();
  (e.currentTarget as HTMLAnchorElement)?.parentElement?.remove();
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
