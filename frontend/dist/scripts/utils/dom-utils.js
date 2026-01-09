/**
 * DOM Utilities
 */
export function showElement(element) {
    if (element) {
        element.style.display = "block";
    }
}
export function hideElement(element) {
    if (element) {
        element.style.display = "none";
    }
}
export function getElement(id) {
    return document.getElementById(id);
}
export function querySelector(selector) {
    return document.querySelector(selector);
}
//# sourceMappingURL=dom-utils.js.map