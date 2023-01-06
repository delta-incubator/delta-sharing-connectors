import { PROFILES_KEY } from "./constants";
import { DeltaSharingClient } from "./delta-sharing-client";

export function getProfilesProperty() {
    return JSON.parse(PropertiesService.getUserProperties().getProperty(PROFILES_KEY));
}

export function setProfilesProperty(profiles) {
    return PropertiesService.getUserProperties().setProperty(
        PROFILES_KEY, JSON.stringify(profiles));
}

export function listRedactedProfiles() {
    let redactedProfiles = getProfilesProperty();
    for (let [profileName, profile] of Object.entries(redactedProfiles)) {
        profile.profile.bearerToken = '[REDACTED]';
    }
    return redactedProfiles;
}

export function verifyProfile(profile) {
    let parsedProfile = JSON.parse(profile);
    let fields = ['shareCredentialsVersion', 'endpoint', 'bearerToken', 'expirationTime'];
    fields.map(field => {
        if (!(field in parsedProfile)) {
            throw Error(`Profile is missing key ${field}`);
        }
    });
    return parsedProfile;
}

export function showAddProfilePrompt() {
    // Unfortunately, a GAS way to combine these 2 prompts do not exist and requires hacky code.
    // The 2 prompts keep it simpler to implement.
    // See https://stackoverflow.com/questions/41263889/how-to-update-html-in-sidebar-template-from-modal-dialog-template-with-javascrip/41265164#41265164
    // and https://stackoverflow.com/questions/23310563/how-do-i-communicate-a-pagemodal-dialog-with-its-sibling-sidebar
    let ui = SpreadsheetApp.getUi();

    let profileNameResult = ui.prompt(
        'Add profile',
        'Please enter a profile name (no whitespace):',
        ui.ButtonSet.OK_CANCEL);
    if (profileNameResult.getSelectedButton() != ui.Button.OK) {
        return null;
    }
    let profileName = profileNameResult.getResponseText();
    if (!profileName.match(/^\S+$/)) {
        throw Error('Profile name cannot contain whitespace.')
    }
    let profiles = getProfilesProperty();
    if (profileName in profiles) {
        throw Error(`Profile ${profileName} already exists.`);
    }
    
    let profileResult = ui.prompt(
        'Add profile',
        'Please copy and paste the Delta Sharing profile file contents:',
        ui.ButtonSet.OK_CANCEL);
    if (profileResult.getSelectedButton() != ui.Button.OK) {
        return null;
    }
    let profile = verifyProfile(profileResult.getResponseText());

    profiles[profileName] = { profile, name: profileName, createdAt: new Date().getTime() };
    setProfilesProperty(profiles);
    return profiles[profileName];
}

export function showDeleteProfilePrompt(profileName) {
    let ui = SpreadsheetApp.getUi();
    let result = ui.alert(
        `Deleting profile ${profileName}`,
        'Are you sure you want to delete the profile?',
        ui.ButtonSet.YES_NO);
    if (result == ui.Button.YES) {
        let profiles = getProfilesProperty();
        if (!(profileName in profiles)) {
            throw Error(`Profile ${profileName} does not exist.`);
        }
        delete profiles[profileName]
        setProfilesProperty(profiles);
        return true;
    }
    return false;
}

export function getAllTablesInProfile(profileName) {
    let profiles = getProfilesProperty();
    if (!(profileName in profiles)) {
        throw Error(`Profile ${profileName} does not exist.`);
    }
    let deltaSharingClient = new DeltaSharingClient(profiles[profileName].profile);
    let shares = deltaSharingClient.listShares();
    let tables = [];
    for (let share of shares) {
        tables.push(...deltaSharingClient.listAllTables(share.name));
    }
    return tables;
}