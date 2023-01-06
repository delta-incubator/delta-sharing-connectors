import { IMPORT_LOCATIONS, IMPORT_LOCATIONS_FOR_DISPLAY, PROFILES_KEY } from "./constants";
import { listRedactedProfiles, getProfilesProperty, setProfilesProperty, verifyProfile } from "./profile";
import { fillSpreadsheet } from "./spreadsheet";

export function onHomepage(e) {
    if (PropertiesService.getUserProperties().getProperty(PROFILES_KEY) == null) {
        PropertiesService.getUserProperties().setProperty(PROFILES_KEY, {});
    }
    return createHomepage(getInitState());
}

// Constructs the initial state.
// In general, the design pattern is to get the state first and
// then have the UI represent the state.
function getInitState() {
    let state = {
        profiles: [],
        profile: null,
        tables: [],
        table: null,
        options: {
            importLocation: IMPORT_LOCATIONS.CREATE_NEW_SPREADSHEET,
            limit: null
        },
        message: null
    };
    try {
        refreshProfileState(state);
        refreshTableState(state);
    } catch (error) {
        state.message = createErrorMessage(error);
    }
    return state;
}

function createErrorMessage(error) {
    let message = error.message;
    // Remove internal error message when URLFetchApp fails.
    message = message.replace('(use muteHttpExceptions option to examine full response)', '')
    return `<b><font color="#dd4b39">${message}</font></b>`
}

function refreshProfileState(state, profiles) {
    if (!profiles) {
        profiles = listRedactedProfiles();
    }
    state.profiles = Object.entries(profiles).sort((a, b) => {
        // Sort by reverse chronological order
        return b[1].createdAt - a[1].createdAt;
    }).map(entry => entry[0]);
    state.profile = state.profiles.length > 0 ? state.profiles[0] : null;
}

function refreshTableState(state) {
    state.tables = state.profile ?
        getAllTablesInProfile(state.profile).map(
            item => `${item.share}.${item.schema}.${item.name}`) :
        [];
    state.table = state.tables.length > 0 ? state.tables[0] : null;
}

function updateStateCommon(state, e) {
    let formInputs = e.commonEventObject.formInputs;
    let profile = formInputs.profile;
    state.profile = profile ? profile.stringInputs.value[0] : null;
    let table = formInputs.table;
    state.table = table ? table.stringInputs.value[0] : null;
    state.options.importLocation = formInputs.importLocation.stringInputs.value[0];
    let limit = formInputs.limit
    state.options.limit = limit ? limit.stringInputs.value[0] : null;
    state.message = null;
}

function createHomepage(state) {
    let builder = CardService.newCardBuilder();

    let profileSection = CardService.newCardSection()
        .addWidget(createProfileDropdown(state))
        .addWidget(createProfileButtons(state));
    builder.addSection(profileSection);

    let tableSection = CardService.newCardSection()
        .addWidget(createTableDropdown(state))
        .addWidget(createImportLocationDropdown(state))
        .addWidget(createLimitTextBox(state))
        .addWidget(createTableButtons(state));
    if (state.message) {
        tableSection.addWidget(CardService
            .newTextParagraph()
            .setText(state.message));
    }
    builder.addSection(tableSection);

    builder.setFixedFooter(CardService.newFixedFooter()
        .setPrimaryButton(CardService.newTextButton()
            .setText('Learn more about Delta Sharing')
            .setOpenLink(CardService.newOpenLink()
                .setUrl('https://delta.io/sharing/'))
        ));

    return builder.build();
}

function createProfileDropdown(state) {
    let selectionInput = CardService
        .newSelectionInput()
        .setTitle('Profile')
        .setFieldName('profile')
        .setType(CardService.SelectionInputType.DROPDOWN)
        .setOnChangeAction(CardService
            .newAction()
            .setFunctionName('changeProfile')
            // SPINNER is not the default in these actions.
            .setLoadIndicator(CardService.LoadIndicator.SPINNER)
            .setParameters(serializeStateParameter(state)));
    state.profiles.forEach(
        profile => selectionInput.addItem(profile, profile, profile == state.profile));
    // CardService needs an item to display.
    if (state.profiles.length == 0) {
        selectionInput.addItem('', '', true);
    }
    return selectionInput;
}

function createProfileButtons(state) {
    return CardService
        .newButtonSet()
        .addButton(CardService
            .newTextButton()
            .setText('Add Profile')
            .setOnClickAction(CardService
                .newAction()
                .setFunctionName('addProfile')
                .setParameters(serializeStateParameter(state)))
            .setDisabled(false))
        .addButton(CardService
            .newTextButton()
            .setText('Remove Profile')
            .setOnClickAction(CardService
                .newAction()
                .setFunctionName('removeProfile')
                .setParameters(serializeStateParameter(state)))
            .setDisabled(state.profiles.length == 0));
}

function createTableDropdown(state) {
    let selectionInput = CardService
        .newSelectionInput()
        .setTitle('Table')
        .setFieldName('table')
        .setType(CardService.SelectionInputType.DROPDOWN);
    state.tables.forEach(
        table => selectionInput.addItem(table, table, table == state.table));
    // CardService needs an item to display.
    if (state.tables.length == 0) {
        selectionInput.addItem('', '', true);
    }
    return selectionInput;
}

function createImportLocationDropdown(state) {
    let selectionInput = CardService
        .newSelectionInput()
        .setTitle('Import Location')
        .setFieldName('importLocation')
        .setType(CardService.SelectionInputType.DROPDOWN);
    IMPORT_LOCATIONS_FOR_DISPLAY.forEach(
        loc => selectionInput.addItem(loc[1], loc[0], loc[0] == state.options.importLocation));
    return selectionInput;
}

function createLimitTextBox(state) {
    return CardService
        .newTextInput()
        .setFieldName('limit')
        .setTitle('Result Limit')
        .setHint('If empty, no limit is set.')
        .setValue(state.options.limit == null ? '' : state.options.limit);
}

function createTableButtons(state) {
    return CardService
        .newButtonSet()
        .addButton(CardService
            .newTextButton()
            .setText('Import Table')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setOnClickAction(CardService
                .newAction()
                .setFunctionName('importTable')
                .setParameters(serializeStateParameter(state)))
            .setDisabled(state.table == null));
}

export function changeProfile(e) {
    let state = parseStateParameter(e);
    updateStateCommon(state, e);
    try {
        refreshTableState(state);
    } catch (error) {
        state.table = null;
        state.message = createErrorMessage(error);
    }
    return CardService.newActionResponseBuilder()
        .setNavigation(CardService
            .newNavigation()
            .updateCard(createHomepage(state)))
        .build();
}

export function addProfile(e, addProfileState) {
    let state = parseStateParameter(e);

    // If there's a addProfileState, then validation in addProfile card failed,
    // so do not update homepage state, because there's nothing in the event regarding form inputs
    // from the homepage.
    if (!addProfileState) {
        updateStateCommon(state, e);
        // Dummy state to fill in inputs
        addProfileState = {
            profile: '',
            profileContents: '',
            message: null
        }
    }

    let builder = CardService.newCardBuilder()
        .setHeader(CardService
            .newCardHeader()
            .setTitle('Add Profile'));

    let section = CardService
        .newCardSection()
        .addWidget(CardService
            .newTextButton()
            .setText('Profile file protocol')
            .setOpenLink(CardService.newOpenLink()
                .setUrl('https://github.com/delta-io/delta-sharing/blob/main/PROTOCOL.md#profile-file-format')))
        .addWidget(CardService
            .newTextInput()
            .setFieldName('addProfileName')
            .setTitle('Profile Name (no whitespace)')
            .setValue(addProfileState.profile))
        .addWidget(CardService
            .newTextInput()
            .setFieldName('addProfileContents')
            .setMultiline(true)
            .setTitle('Profile')
            .setValue(addProfileState.profileContents)
            .setHint('Please copy and paste the Delta Sharing profile file contents'))
        .addWidget(CardService
            .newButtonSet()
            .addButton(CardService
                .newTextButton()
                .setText('Add Profile')
                .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
                .setOnClickAction(CardService
                    .newAction()
                    .setFunctionName('addProfileConfirm')
                    .setParameters(serializeStateParameter(state))))
            .addButton(CardService
                .newTextButton()
                .setText('Cancel')
                .setOnClickAction(CardService
                    .newAction()
                    .setFunctionName('addProfileCancel')
                    .setParameters(serializeStateParameter(state)))));
    if (addProfileState.message) {
        section.addWidget(CardService
            .newTextParagraph()
            .setText(addProfileState.message));
    }

    builder.addSection(section);

    return builder.build();
}

function getAddProfileName(e) {
    let addProfileName = e.commonEventObject.formInputs.addProfileName;
    return addProfileName ? addProfileName.stringInputs.value[0] : '';
}

function getAddProfileContents(e) {
    let addProfileContents = e.commonEventObject.formInputs.addProfileContents;
    return addProfileContents ? addProfileContents.stringInputs.value[0] : '';
}

export function addProfileConfirm(e) {
    let state = parseStateParameter(e);

    let profileName = getAddProfileName(e);
    let profileContents = getAddProfileContents(e);
    let profiles = null;
    try {
        if (!profileName.match(/^\S+$/)) {
            throw Error('Profile name must be non-empty and cannot contain whitespace.')
        }
        profiles = getProfilesProperty();
        if (profileName in profiles) {
            throw Error(`Profile ${profileName} already exists.`);
        }
        profiles[profileName] = {
            profile: verifyProfile(profileContents),
            name: profileName,
            createdAt: new Date().getTime()
        };
    } catch (error) {
        let addProfileState = getAddProfileState(e, error);
        // Simple validation failures will reuse the addProfile card.
        return CardService.newActionResponseBuilder()
            .setNavigation(CardService
                .newNavigation()
                .updateCard(addProfile(e, addProfileState)))
            .build();
    }

    setProfilesProperty(profiles);

    // Errors from profile contents will be displayed in the home page.
    try {
        refreshProfileState(state, profiles);
        refreshTableState(state);
    } catch (error) {
        state.message = createErrorMessage(error);
    }

    return CardService.newActionResponseBuilder()
        .setNavigation(CardService
            .newNavigation()
            .popCard()
            .updateCard(createHomepage(state)))
        .build();
}

function getAddProfileState(e, error) {
    let state = {
        profile: null,
        profileContents: null,
        message: createErrorMessage(error)
    }
    let formInputs = e.commonEventObject.formInputs;
    let addProfileName = formInputs.addProfileName;
    state.profile = addProfileName ? addProfileName.stringInputs.value[0] : null;
    let addProfileContents = formInputs.addProfileContents;
    state.profileContents = addProfileContents ? addProfileContents.stringInputs.value[0] : null;
    return state;
}

export function addProfileCancel(e) {
    return CardService.newActionResponseBuilder()
        .setNavigation(CardService
            .newNavigation()
            .popCard())
        .build();
}

export function removeProfile(e, removeProfileMessage) {
    let state = parseStateParameter(e);

    // If there's a message, then validation in removeProfile card failed, so do not update state,
    // because there's nothing in the event regarding form inputs from the homepage.
    if (!removeProfileMessage) {
        updateStateCommon(state, e);
    }

    let builder = CardService.newCardBuilder()
        .setHeader(CardService
            .newCardHeader()
            .setTitle(`Remove Profile ${state.profile}`));

    let section = CardService
        .newCardSection()
        .addWidget(CardService
            .newTextParagraph()
            .setText('Are you sure you want to delete the profile?'))
        .addWidget(CardService
            .newButtonSet()
            .addButton(CardService
                .newTextButton()
                .setText('Yes')
                .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
                .setOnClickAction(CardService
                    .newAction()
                    .setFunctionName('removeProfileConfirm')
                    .setParameters(serializeStateParameter(state))))
            .addButton(CardService
                .newTextButton()
                .setText('No')
                .setOnClickAction(CardService
                    .newAction()
                    .setFunctionName('removeProfileCancel')
                    .setParameters(serializeStateParameter(state)))));
    if (removeProfileMessage) {
        section.addWidget(CardService
            .newTextParagraph()
            .setText(removeProfileMessage));
    }
    builder.addSection(section);

    return builder.build();
}

export function removeProfileConfirm(e) {
    let state = parseStateParameter(e);

    let profiles = getProfilesProperty();
    if (!(state.profile in profiles)) {
        return CardService.newActionResponseBuilder()
            .setNavigation(CardService
                .newNavigation()
                .updateCard(removeProfile(
                    e, createErrorMessage(`Profile ${state.profile} does not exist.`))))
            .build();
    }
    delete profiles[state.profile]
    setProfilesProperty(profiles);

    refreshProfileState(state, profiles);
    refreshTableState(state);

    return CardService.newActionResponseBuilder()
        .setNavigation(CardService
            .newNavigation()
            .popCard()
            .updateCard(createHomepage(state)))
        .build();
}

export function removeProfileCancel(e) {
    return CardService.newActionResponseBuilder()
        .setNavigation(CardService
            .newNavigation()
            .popCard())
        .build();
}

export async function importTable(e) {
    let state = parseStateParameter(e);
    updateStateCommon(state, e);

    let tableParts = state.table.split('.');
    let tableItem = {
        share: tableParts[0],
        schema: tableParts[1],
        name: tableParts[2]
    }
    let url = null;
    try {
        let options = {
            importLocation: state.options.importLocation,
            limit: state.options.limit == null ? null : parseInt(state.options.limit)
        }
        url = await fillSpreadsheet(state.profile, tableItem, options);
    } catch (error) {
        state.message = createErrorMessage(error);
    }
    if (url) {
        state.message = `<b>Table imported successfuly. <a href="${url}">Open now»</a></b>`;
    }
    return CardService.newActionResponseBuilder()
        .setNavigation(CardService
            .newNavigation()
            .updateCard(createHomepage(state)))
        .build();
}

function serializeStateParameter(state) {
    return { 'state': JSON.stringify(state) };
}

function parseStateParameter(e) {
    return JSON.parse(e.commonEventObject.parameters.state)
}