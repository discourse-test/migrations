import Handlebars from "handlebars";
import { escape } from "pretty-text/sanitizer";
import toMarkdown from "discourse/lib/to-markdown";
import { capabilities } from "discourse/services/capabilities";
import * as AvatarUtils from "discourse-common/lib/avatar-utils";
import deprecated from "discourse-common/lib/deprecated";
import getURL from "discourse-common/lib/get-url";
import I18n from "I18n";

let _defaultHomepage;

function deprecatedAvatarUtil(name) {
  return function () {
    deprecated(
      `${name} should be imported from discourse-common/lib/avatar-utils instead of discourse/lib/utilities`,
      { id: "discourse.avatar-utils" }
    );
    return AvatarUtils[name](...arguments);
  };
}

export const translateSize = deprecatedAvatarUtil("translateSize");
export const getRawSize = deprecatedAvatarUtil("getRawSize");
export const getRawAvatarSize = deprecatedAvatarUtil("getRawAvatarSize");
export const avatarUrl = deprecatedAvatarUtil("avatarUrl");
export const avatarImg = deprecatedAvatarUtil("avatarImg");
export const tinyAvatar = deprecatedAvatarUtil("tinyAvatar");

export function splitString(str, separator = ",") {
  if (typeof str === "string") {
    return str.split(separator).filter(Boolean);
  } else {
    return [];
  }
}

export function escapeExpression(string) {
  if (!string) {
    return "";
  }

  // don't escape SafeStrings, since they're already safe
  if (string instanceof Handlebars.SafeString) {
    return string.toString();
  }

  return escape(string);
}

let _usernameFormatDelegate = (username) => username;

export function formatUsername(username) {
  return _usernameFormatDelegate(username || "");
}

export function replaceFormatter(fn) {
  _usernameFormatDelegate = fn;
}

export function postUrl(slug, topicId, postNumber) {
  let url = getURL("/t/");
  if (slug) {
    url += slug + "/";
  } else {
    url += "topic/";
  }
  url += topicId;
  if (postNumber > 1) {
    url += "/" + postNumber;
  }
  return url;
}

export function highlightPost(postNumber) {
  const container = document.querySelector(`#post_${postNumber}`);
  if (!container) {
    return;
  }

  container.querySelector(".tabLoc")?.focus();

  const element = container.querySelector(".topic-body");
  if (!element || element.classList.contains("highlighted")) {
    return;
  }

  element.classList.add("highlighted");

  const removeHighlighted = function () {
    element.classList.remove("highlighted");
    element.removeEventListener("animationend", removeHighlighted);
  };
  element.addEventListener("animationend", removeHighlighted);
}

export function emailValid(email) {
  // see:  http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
  const re =
    /^[a-zA-Z0-9!#$%&'*+\/=?\^_`{|}~\-]+(?:\.[a-zA-Z0-9!#$%&'\*+\/=?\^_`{|}~\-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/;
  return re.test(email);
}

export function hostnameValid(hostname) {
  // see:  https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
  const re =
    /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
  return hostname && re.test(hostname);
}

export function extractDomainFromUrl(url) {
  if (url.includes("://")) {
    url = url.split("/")[2];
  } else {
    url = url.split("/")[0];
  }
  return url.split(":")[0];
}

export function selectedText() {
  const selection = window.getSelection();
  if (selection.isCollapsed) {
    return "";
  }

  const div = document.createElement("div");
  for (let r = 0; r < selection.rangeCount; r++) {
    const range = selection.getRangeAt(r);
    const ancestor =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;

    // ensure we never quote text in the post menu area
    const postMenuArea = ancestor.querySelector(".post-menu-area");
    if (postMenuArea) {
      range.setEndBefore(postMenuArea);
    }

    const oneboxTest = ancestor.closest("aside.onebox[data-onebox-src]");
    const codeBlockTest = ancestor.closest("pre");
    if (codeBlockTest) {
      const code = document.createElement("code");
      code.append(range.cloneContents());

      // Even though this was a code block, produce a non-block quote if it's a single line.
      if (/\n/.test(code.innerText)) {
        const pre = document.createElement("pre");
        pre.append(code);
        div.append(pre);
      } else {
        div.append(code);
      }
    } else if (oneboxTest) {
      // This is a partial quote from a onebox.
      // Treat it as though the entire onebox was quoted.
      const oneboxUrl = oneboxTest.dataset.oneboxSrc;
      div.append(oneboxUrl);
    } else {
      div.append(range.cloneContents());
    }
  }

  div.querySelectorAll("aside.onebox[data-onebox-src]").forEach((element) => {
    const oneboxUrl = element.dataset.oneboxSrc;
    element.replaceWith(oneboxUrl);
  });

  return toMarkdown(div.outerHTML);
}

export function selectedNode() {
  return selectedRange()?.commonAncestorContainer;
}

export function selectedRange() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    return selection.getRangeAt(0);
  }
}

// Determine the row and col of the caret in an element
export function caretRowCol(el) {
  let cp = caretPosition(el);
  let rows = el.value.slice(0, cp).split("\n");
  let rowNum = rows.length;

  let colNum =
    cp -
    rows.splice(0, rowNum - 1).reduce(function (sum, row) {
      return sum + row.length + 1;
    }, 0);

  return { rowNum, colNum };
}

// Determine the position of the caret in an element
export function caretPosition(el) {
  return el?.selectionStart || 0;
}

// Set the caret's position
export function setCaretPosition(ctrl, pos) {
  let range;
  if (ctrl.setSelectionRange) {
    ctrl.focus();
    ctrl.setSelectionRange(pos, pos);
    return;
  }
  if (ctrl.createTextRange) {
    range = ctrl.createTextRange();
    range.collapse(true);
    range.moveEnd("character", pos);
    range.moveStart("character", pos);
    return range.select();
  }
}

export function initializeDefaultHomepage(siteSettings) {
  const sel = document.querySelector("meta[name='discourse_current_homepage']");
  const homepage =
    sel?.getAttribute("content") ||
    siteSettings.top_menu.split("|")[0].split(",")[0];
  setDefaultHomepage(homepage);
}

export function defaultHomepage() {
  return _defaultHomepage;
}

export function setDefaultHomepage(homepage) {
  _defaultHomepage = homepage;
}

export function determinePostReplaceSelection({
  selection,
  needle,
  replacement,
}) {
  const diff =
    replacement.end - replacement.start - (needle.end - needle.start);

  if (selection.end <= needle.start) {
    // Selection ends (and starts) before needle.
    return { start: selection.start, end: selection.end };
  } else if (selection.start <= needle.start) {
    // Selection starts before needle...
    if (selection.end < needle.end) {
      // ... and ends inside needle.
      return { start: selection.start, end: needle.start };
    } else {
      // ... and spans needle completely.
      return { start: selection.start, end: selection.end + diff };
    }
  } else if (selection.start < needle.end) {
    // Selection starts inside needle...
    if (selection.end <= needle.end) {
      // ... and ends inside needle.
      return { start: replacement.end, end: replacement.end };
    } else {
      // ... and spans end of needle.
      return { start: replacement.end, end: selection.end + diff };
    }
  } else {
    // Selection starts (and ends) behind needle.
    return { start: selection.start + diff, end: selection.end + diff };
  }
}

export function isAppleDevice() {
  // IE has no DOMNodeInserted so can not get this hack despite saying it is like iPhone
  // This will apply hack on all iDevices
  let caps = capabilities;
  return caps.isIOS && !window.navigator.userAgent.match(/Trident/g);
}

let iPadDetected = undefined;

export function isiPad() {
  if (iPadDetected === undefined) {
    iPadDetected =
      window.navigator.userAgent.match(/iPad/g) &&
      !window.navigator.userAgent.match(/Trident/g);
  }
  return iPadDetected;
}

export function safariHacksDisabled() {
  deprecated(
    "`safariHacksDisabled()` is deprecated, it now always returns `false`",
    {
      since: "2.8.0.beta8",
      dropFrom: "2.9.0.beta1",
      id: "discourse.safari-hacks-disabled",
    }
  );

  return false;
}

const toArray = (items) => {
  items = items || [];

  if (!Array.isArray(items)) {
    return Array.from(items);
  }

  return items;
};

const gifInDisguise = (clipboard) => {
  return (
    clipboard.files.length === 1 &&
    clipboard.files[0].type === "image/png" &&
    clipboard.types.every((e) => ["text/html", "Files"].includes(e)) &&
    /<img.*src=.*\.gif/.test(clipboard.getData("text/html"))
  );
};

export function clipboardHelpers(e, opts) {
  const clipboard =
    e.clipboardData ||
    e.originalEvent.clipboardData ||
    e.delegatedEvent.originalEvent.clipboardData;

  const types = toArray(clipboard.types);
  let files = toArray(clipboard.files);

  if (types.includes("Files") && files.length === 0) {
    // for IE
    files = toArray(clipboard.items).filter((i) => i.kind === "file");
  }

  let canUpload = files && opts.canUpload && types.includes("Files");
  const canUploadImage =
    canUpload &&
    files.filter((f) => f.type.match("^image/"))[0] &&
    !gifInDisguise(clipboard);
  const canPasteHtml =
    opts.siteSettings.enable_rich_text_paste &&
    types.includes("text/html") &&
    !canUploadImage;

  return { clipboard, types, canUpload, canPasteHtml };
}

// Replace any accented characters with their ASCII equivalent
// Return the string if it only contains ASCII printable characters,
// otherwise use the fallback
export function toAsciiPrintable(string, fallback) {
  if (typeof string.normalize === "function") {
    string = string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  return /^[\040-\176]*$/.test(string) ? string : fallback;
}

export function slugify(string) {
  return string
    .trim()
    .toLowerCase()
    .replace(/\s|_+/g, "-") // Replace spaces and underscores with dashes
    .replace(/[^\w\-]+/g, "") // Remove non-word characters except for dashes
    .replace(/\-\-+/g, "-") // Replace multiple dashes with a single dash
    .replace(/^-+/, "") // Remove leading dashes
    .replace(/-+$/, ""); // Remove trailing dashes
}

export function toNumber(input) {
  return typeof input === "number" ? input : parseFloat(input);
}

export function isNumeric(input) {
  return !isNaN(toNumber(input)) && isFinite(input);
}

export function fillMissingDates(data, startDate, endDate) {
  const startMoment = moment(startDate, "YYYY-MM-DD");
  const endMoment = moment(endDate, "YYYY-MM-DD");
  const countDays = endMoment.diff(startMoment, "days");
  let currentMoment = startMoment;

  for (let i = 0; i <= countDays; i++) {
    let date = data[i] ? moment(data[i].x, "YYYY-MM-DD") : null;
    if (i === 0 && (!date || date.isAfter(startMoment))) {
      data.splice(i, 0, { x: startMoment.format("YYYY-MM-DD"), y: 0 });
    } else {
      if (!date || date.isAfter(moment(currentMoment))) {
        data.splice(i, 0, { x: currentMoment, y: 0 });
      }
    }
    currentMoment = moment(currentMoment).add(1, "day").format("YYYY-MM-DD");
  }
  return data;
}

export function areCookiesEnabled() {
  // see: https://github.com/Modernizr/Modernizr/blob/400db4043c22af98d46e1d2b9cbc5cb062791192/feature-detects/cookies.js
  try {
    document.cookie = "cookietest=1";
    let ret = document.cookie.includes("cookietest=");
    document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
    return ret;
  } catch (e) {
    return false;
  }
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function postRNWebviewMessage(prop, value) {
  if (window.ReactNativeWebView !== undefined) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ [prop]: value }));
  }
}

const CODE_BLOCKS_REGEX =
  /^(  |\t).*|`[^`]+`|^```[^]*?^```|\[code\][^]*?\[\/code\]/gm;
//|    ^     |   ^   |      ^      |           ^           |
//     |         |          |                  |
//     |         |          |       code blocks between [code]
//     |         |          |
//     |         |          +--- code blocks between three backticks
//     |         |
//     |         +----- inline code between backticks
//     |
//     +------- paragraphs starting with 2 spaces or tab

const OPEN_CODE_BLOCKS_REGEX = /^(  |\t).*|`[^`]+|^```[^]*?|\[code\][^]*?/gm;

export function inCodeBlock(text, pos) {
  let end = 0;
  for (const match of text.matchAll(CODE_BLOCKS_REGEX)) {
    end = match.index + match[0].length;
    if (match.index <= pos && pos <= end) {
      return true;
    }
  }

  // Character at position `pos` can be in a code block that is unfinished.
  // To check this case, we look for any open code blocks after the last closed
  // code block.
  const lastOpenBlock = text.slice(end).search(OPEN_CODE_BLOCKS_REGEX);
  return lastOpenBlock !== -1 && pos >= end + lastOpenBlock;
}

// Return an array of modifier keys that are pressed during a given `MouseEvent`
// or `KeyboardEvent`.
export function modKeysPressed(event) {
  return ["alt", "shift", "meta", "ctrl"].filter((key) => event[`${key}Key`]);
}

export function translateModKey(string) {
  const { isApple } = capabilities;
  // Apple device users are used to glyphs for shortcut keys
  if (isApple) {
    string = string
      .toLowerCase()
      .replace("shift", "\u21E7")
      .replace("meta", "\u2318")
      .replace("alt", "\u2325")
      .replace(/\+/g, "");
  } else {
    string = string
      .toLowerCase()
      .replace("shift", I18n.t("shortcut_modifier_key.shift"))
      .replace("ctrl", I18n.t("shortcut_modifier_key.ctrl"))
      .replace("meta", I18n.t("shortcut_modifier_key.ctrl"))
      .replace("alt", I18n.t("shortcut_modifier_key.alt"));
  }

  return string;
}

// Use this version of clipboardCopy if you already have the text to
// be copied in memory, and you do not need to make an AJAX call to
// the API to generate any text. See clipboardCopyAsync for the latter.
export function clipboardCopy(text) {
  // Use the Async Clipboard API when available.
  // Requires a secure browsing context (i.e. HTTPS)
  if (window.navigator.clipboard) {
    return window.navigator.clipboard.writeText(text).catch(function (err) {
      throw err !== undefined
        ? err
        : new DOMException("The request is not allowed", "NotAllowedError");
    });
  }

  // ...Otherwise, use document.execCommand() fallback
  return clipboardCopyFallback(text);
}

// Use this version of clipboardCopy if you must use an AJAX call
// to retrieve/generate server-side text to copy to the clipboard,
// otherwise this write function will error in certain browsers, because
// the time taken from the user event to the clipboard text being copied
// will be too long.
//
// Note that the promise passed in should return a Blob with type of
// text/plain.
export function clipboardCopyAsync(functionReturningPromise) {
  // Use the Async Clipboard API when available.
  // Requires a secure browsing context (i.e. HTTPS)
  if (window.navigator.clipboard) {
    // Firefox does not support window.ClipboardItem yet (it is behind
    // a flag (dom.events.asyncClipboard.clipboardItem) as at version 87.)
    // so we need to fall back to the normal non-async clipboard copy, that
    // works in every browser except Safari.
    //
    // TODO: (martin) Look at this on 2022-07-01 to see if support has
    // changed.
    if (!window.ClipboardItem) {
      return functionReturningPromise().then((textBlob) => {
        return textBlob.text().then((text) => {
          return clipboardCopy(text);
        });
      });
    }

    return window.navigator.clipboard
      .write([
        new window.ClipboardItem({ "text/plain": functionReturningPromise() }),
      ])
      .catch(function (err) {
        throw err !== undefined
          ? err
          : new DOMException("The request is not allowed", "NotAllowedError");
      });
  }

  // ...Otherwise, use document.execCommand() fallback
  return functionReturningPromise().then((textBlob) => {
    textBlob.text().then((text) => {
      return clipboardCopyFallback(text);
    });
  });
}

function clipboardCopyFallback(text) {
  // Put the text to copy into a <span>
  const span = document.createElement("span");
  span.textContent = text;

  // Preserve consecutive spaces and newlines
  span.style.whiteSpace = "pre";

  // Add the <span> to the page
  document.body.appendChild(span);

  // Make a selection object representing the range of text selected by the user
  const selection = window.getSelection();
  const range = window.document.createRange();
  selection.removeAllRanges();
  range.selectNode(span);
  selection.addRange(range);

  // Copy text to the clipboard
  let success = false;
  try {
    success = window.document.execCommand("copy");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("error", err);
  }

  // Cleanup
  selection.removeAllRanges();
  window.document.body.removeChild(span);
  return success;
}

// this function takes 2 sorted lists and returns another sorted list that
// contains both of the original lists.
// you need to provide a callback as the 3rd argument that will be called with
// an item from the first list (1st callback argument) and another item from
// the second list (2nd callback argument). The callback should return true if
// its 2nd argument should go before its 1st argument and return false
// otherwise.
export function mergeSortedLists(list1, list2, comparator) {
  let index1 = 0;
  let index2 = 0;
  const merged = [];
  while (index1 < list1.length || index2 < list2.length) {
    if (
      index1 === list1.length ||
      (index2 < list2.length && comparator(list1[index1], list2[index2]))
    ) {
      merged.push(list2[index2]);
      index2++;
    } else {
      merged.push(list1[index1]);
      index1++;
    }
  }
  return merged;
}

export function getCaretPosition(element, options) {
  const jqueryElement = $(element);
  const position = jqueryElement.caretPosition(options);

  // Get the position of the textarea on the page
  const textareaRect = element.getBoundingClientRect();

  // Calculate the x and y coordinates by adding the element's position
  const adjustedPosition = {
    x: position.left + textareaRect.left,
    y: position.top + textareaRect.top,
  };

  return adjustedPosition;
}
