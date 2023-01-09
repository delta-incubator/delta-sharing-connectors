import { PROFILES_KEY } from "./constants";

export function onOpen() {
    SpreadsheetApp.getUi()
        .createAddonMenu()
        .addItem('Start', 'showSidebar')
        .addToUi();

}

export function onInstall(e) {
    onOpen(e);
}

function init() {
    if (PropertiesService.getUserProperties().getProperty(PROFILES_KEY) == null) {
        PropertiesService.getUserProperties().setProperty(PROFILES_KEY, {});
    }
}

export function showSidebar() {
    init();
    const ui = HtmlService.createTemplateFromFile('sidebar').evaluate().setTitle("Delta Sharing");
    SpreadsheetApp.getUi().showSidebar(ui);
}

export function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
}

export function assert(condition, message) {
    if (!condition) {
        if (!message) {
            throw Error('Assertion failed');
        }
        throw Error(message);
    }
}