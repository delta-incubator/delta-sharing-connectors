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
    let requiredFields = ['shareCredentialsVersion', 'endpoint', 'bearerToken'];
    requiredFields.map(field => {
        if (!(field in parsedProfile)) {
            throw Error(`Profile is missing key ${field}`);
        }
    });
    return parsedProfile;
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