export const PROFILES_KEY = 'profiles';
export const IMPORT_LOCATIONS = {
    CREATE_NEW_SPREADSHEET: 'create-new-spreadsheet',
    INSERT_NEW_SHEET: 'insert-new-sheet',
    REPLACE_SPREADSHEET: 'replace-spreadsheet',
    REPLACE_CURRENT_SHEET: 'replace-current-sheet',
    APPEND_TO_CURRENT_SHEET: 'append-to-current-sheet',
    REPLACE_DATA_AT_SELECTED_CELL: 'replace-data-at-selected-cell'
};
export const IMPORT_LOCATIONS_FOR_DISPLAY = [
    [IMPORT_LOCATIONS.CREATE_NEW_SPREADSHEET, 'Create New Spreadsheet'],
    [IMPORT_LOCATIONS.INSERT_NEW_SHEET, 'Insert New Sheet'],
    [IMPORT_LOCATIONS.REPLACE_SPREADSHEET, 'Replace Spreadsheet'],
    [IMPORT_LOCATIONS.REPLACE_CURRENT_SHEET, 'Replace Current Sheet'],
    [IMPORT_LOCATIONS.APPEND_TO_CURRENT_SHEET, 'Append to Current Sheet'],
    [IMPORT_LOCATIONS.REPLACE_DATA_AT_SELECTED_CELL, 'Replace Data at Selected Cell']
];