
import * as card from './card';
import * as profile from './profile';
import * as spreadsheet from './spreadsheet';
import * as util from './util';

global.listRedactedProfiles = profile.listRedactedProfiles;
global.showAddProfilePrompt = profile.showAddProfilePrompt;
global.showDeleteProfilePrompt = profile.showDeleteProfilePrompt;
global.getAllTablesInProfile = profile.getAllTablesInProfile;

global.onHomepage = card.onHomepage;
global.changeProfile = card.changeProfile;
global.addProfile = card.addProfile;
global.addProfileConfirm = card.addProfileConfirm;
global.addProfileCancel = card.addProfileCancel;
global.removeProfile = card.removeProfile;
global.removeProfileConfirm = card.removeProfileConfirm;
global.removeProfileCancel = card.removeProfileCancel;
global.importTable = card.importTable;

global.fillSpreadsheet = spreadsheet.fillSpreadsheet;

global.assert = util.assert;