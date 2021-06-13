export function findtarget(className, nth) {
  return document.getElementsByClassName(className)[(nth || 1) - 1];
}

export function findtargets(className) {
  return Array.from(document.getElementsByClassName(className));
}

export function hasClass(element, className) {
  return element.classList.contains(className);
}

export function toggleVis(target, blockType = "block") {
  if (hasClass(target, "vis")) {
    target.setAttribute("class", "invis");
    target.style.display = "none";
  } else {
    target.setAttribute("class", "vis");
    target.style.display = blockType;
  }
}

export function clearNotification() {
  var target = document.getElementById("mtpNotification");
  target.innerHTML = "";
}

export function printNotification(text) {
  // log the text to the browser's developer console:
  console.log(text);
  // display for user:
  var target = document.getElementById("mtpNotification");
  if (target === null) {
    //alert("mtp Error: Notification container not Found");
    console.log("mtp Error: Notification container not Found");
  } else {
    //possibility to print multiple notifications
    var temp = document.createElement("div");
    temp.appendChild(document.createTextNode(text));
    target.appendChild(temp);
  }
}

//Parses all of the outputs of regexp matches into an array
export function exRE(str, re) {
  var ret = new Array();
  var m;
  var i = 0;
  while ((m = re.exec(str)) != null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }
    for (let k = 1; k < m.length; k++) {
      ret[i++] = m[k];
    }
  }
  return ret;
}

export function padChars(str, chars) {
  return (chars + str).slice(chars.length * -1);
}

export function to2digits(str) {
  return padChars(str, "00");
}

export function to4digits(str) {
  return padChars(str, "0000");
}

export function to4digitTime(time) {
  return to4digits(time.replace(":", ""));
}

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const monthnames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC"
];

export function monthnumberToName(month) {
  return monthnames[month - 1];
}

export function monthnameToNumber(month) {
  return monthnames.indexOf(month.toUpperCase()) + 1;
}

/** @param {{ day: number; month: number; year: number; }} dateLike */
export function toDate(dateLike) {
  return new Date(dateLike.year, dateLike.month, dateLike.day);
}

/** @param {Date} startDate */
/** @param {Date} endDate */
export function dayDiff(startDate, endDate) {
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000);
}
