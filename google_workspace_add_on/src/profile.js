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
    const redactedProfiles = getProfilesProperty();
    for (const [profileName, profile] of Object.entries(redactedProfiles)) {
        profile.profile.bearerToken = '[REDACTED]';
    }
    return redactedProfiles;
}

export function verifyProfile(profile) {
    const parsedProfile = JSON.parse(profile);
    const requiredFields = ['shareCredentialsVersion', 'endpoint', 'bearerToken'];
    requiredFields.map(field => {
        if (!parsedProfile.hasOwnProperty(field)) {
            throw Error(`Profile is missing key ${field}`);
        }
    });
    // Verify that we can actually perform operations with the profile.
    const deltaSharingClient = new DeltaSharingClient(parsedProfile);
    deltaSharingClient.listShares();
    return parsedProfile;
}

export function getAllTablesInProfile(profileName) {
    const profiles = getProfilesProperty();
    if (!profiles.hasOwnProperty(profileName)) {
        throw Error(`Profile ${profileName} does not exist.`);
    }
    const deltaSharingClient = new DeltaSharingClient(profiles[profileName].profile);
    const shares = deltaSharingClient.listShares();
    const tables = [];
    for (const share of shares) {
        tables.push(...deltaSharingClient.listAllTables(share.name));
    }
    return tables;
}