
import * as card from './card';
import * as util from './util';

global.onHomepage = card.onHomepage;
global.changeProfile = card.changeProfile;
global.addProfile = card.addProfile;
global.addProfileConfirm = card.addProfileConfirm;
global.addProfileCancel = card.addProfileCancel;
global.removeProfile = card.removeProfile;
global.removeProfileConfirm = card.removeProfileConfirm;
global.removeProfileCancel = card.removeProfileCancel;
global.importTable = card.importTable;

global.assert = util.assert;