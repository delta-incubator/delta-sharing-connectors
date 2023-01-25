import { ParquetReader } from 'parquetjs-lite-gas';
import { IMPORT_LOCATIONS } from './constants';
import { DeltaSharingClient } from './delta-sharing-client';
import { getProfilesProperty } from './profile';

export async function fillSpreadsheet(profileName, tableItem, options) {
    if (options.limit != null && (
        !Number.isInteger(options.limit) || options.limit < 0 || options.limit > 10000000)) {
        throw Error('Limit must be an integer between 0 and 10000000 inclusive.');
    }

    const profiles = getProfilesProperty();
    if (!profiles.hasOwnProperty(profileName)) {
        throw Error(`Profile ${profileName} does not exist.`);
    }
    const deltaSharingClient = new DeltaSharingClient(profiles[profileName].profile);
    const queryTable = deltaSharingClient.queryTable(tableItem, options.limit);

    // There is nothing we need to do with the protocol data.
    const protocol = queryTable[0];

    const metaData = queryTable[1];
    const schema = JSON.parse(metaData.metaData.schemaString);
    const fields = schema.fields

    // No fields.
    if (fields.length == 0) {
        return;
    }

    const preparedSheetInfo = prepareSpreadsheet(options.importLocation, tableItem);
    const sheet = preparedSheetInfo.sheet;
    const startCell = preparedSheetInfo.startCell;
    let currentCell = startCell;

    let numResults = 0;
    let values = [];
    // Header
    values.push(fields.map(field => field.name))

    for (let i = 2; i < queryTable.length && (options.limit == null || numResults < options.limit); i++) {
        const file = queryTable[i].file
        const reader = await ParquetReader.openUrl(UrlFetchApp.fetch, file.url);

        const cursor = reader.getCursor();
        let record = null;
        while ((record = await cursor.next()) && (options.limit == null || numResults < options.limit)) {
            const row = new Array(fields.length);
            for (let j = 0; j < fields.length; j++) {
                const fieldName = fields[j].name;
                row[j] = record[fieldName];
                // Partition values are not in parquet files.
                // Even if it's not in partition values, undefined is treated as an empty field in
                // spreadsheets.
                if (row[j] == undefined) {
                    row[j] = file.partitionValues[fieldName];
                }
            }
            values.push(row);
            numResults++;
        }
        reader.close();
        fillValuesInSpreadsheet(sheet, values, fields, startCell, currentCell);

        // Next empty row index.
        currentCell = sheet.getRange(currentCell.getRow() + values.length, currentCell.getColumn());
        values = [];
    }

    // If there are no entries, just fill in the header.
    // Otherwise, this is effectively a no-op.
    fillValuesInSpreadsheet(sheet, values, fields, startCell, currentCell);

    // This happens when the import location is create new spreadsheet. Redirect to the spreadsheet.
    return preparedSheetInfo.redirectSpreadsheet ? preparedSheetInfo.redirectSpreadsheet.getUrl() : null;
}

function getAvailableSheetName(spreadsheet, baseSheetName) {
    const sheetNames = new Set(spreadsheet.getSheets().map(sheet => sheet.getName()));
    let sheetName = baseSheetName;
    let idx = 0;
    for (; sheetNames.has(sheetName); sheetName = `${baseSheetName} (${idx})`) {
        idx++;
    }
    return sheetName;
}

function prepareSpreadsheet(importLocation, tableItem) {
    const tableName = `${tableItem.share}.${tableItem.schema}.${tableItem.name}`;
    switch (importLocation) {
        case IMPORT_LOCATIONS.CREATE_NEW_SPREADSHEET: {
            const spreadSheet = SpreadsheetApp.create(tableName);
            const sheet = spreadSheet.getSheets()[0];
            sheet.setName(tableName);
            return {
                sheet,
                startCell: sheet.getRange(1, 1),
                redirectSpreadsheet: spreadSheet
            };
        }
        case IMPORT_LOCATIONS.INSERT_NEW_SHEET: {
            const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
            const sheetName = getAvailableSheetName(spreadsheet, tableName);
            const sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
            return {
                sheet,
                startCell: sheet.getRange(1, 1)
            };
        }
        case IMPORT_LOCATIONS.REPLACE_SPREADSHEET: {
            const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
            const sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();
            for (const sheetToDelete of sheets) {
                SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheetToDelete);
            }
            sheet.setName(tableName);
            return {
                sheet,
                startCell: sheet.getRange(1, 1)
            };
        }
        case IMPORT_LOCATIONS.REPLACE_CURRENT_SHEET: {
            const sheet = SpreadsheetApp.getActiveSheet();
            sheet.clear();
            return {
                sheet,
                startCell: sheet.getRange(1, 1)
            };
        }
        case IMPORT_LOCATIONS.APPEND_TO_CURRENT_SHEET: {
            const sheet = SpreadsheetApp.getActiveSheet();
            return {
                sheet,
                startCell: sheet.getRange(sheet.getLastRow() + 1, 1)
            };
        }
        case IMPORT_LOCATIONS.REPLACE_DATA_AT_SELECTED_CELL:
            return {
                sheet: SpreadsheetApp.getActiveSheet(),
                startCell: SpreadsheetApp.getCurrentCell()
            };
        default:
            throw new Error(`Invalid import location: ${importLocation}.`)
    }
}

function fillValuesInSpreadsheet(sheet, values, fields, startCell, currentCell) {
    // Nothing to fill.
    if (values.length == 0) {
        return;
    }

    const startRowIdx = startCell.getRow();

    const rowIdx = currentCell.getRow();
    const colIdx = currentCell.getColumn();

    // Clear all formats for a clean slate.
    // "General" is automatic formatting, but it is undocumented.
    sheet.getRange(rowIdx, colIdx, values.length, fields.length)
        .clearFormat().setNumberFormat("General");

    if (startRowIdx == rowIdx) {
        // Headers are always strings.
        sheet.getRange(rowIdx, colIdx, 1, fields.length).setNumberFormat('@');
    }

    // For strings, we explicitly specify string format to prevent truncation from automatic
    // formatting.
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].type == "string") {
            // This can also set the header format, but it's fine, since it's a string anyways.
            sheet.getRange(rowIdx, colIdx + i, values.length).setNumberFormat('@');
        }
    }

    sheet.getRange(rowIdx, colIdx, values.length, fields.length).setValues(values);
}
