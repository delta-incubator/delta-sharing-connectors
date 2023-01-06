'use strict';

$(function () {
    google.script.run
        .withSuccessHandler(result => {
            loadProfiles(result);
            $('#profile').on('change', loadTables);
            $('#delete-profile').on('click', showDeleteProfilePrompt);
            $('#add-profile').on('click', showAddProfilePrompt);
            $('#import-table').on('click', importTable);
            $('#limit-checkbox').on('change', function () {
                $('#limit').prop('disabled', !this.checked);
            });
            if (Object.keys(result).length > 0) {
                loadTables();
            } else {
                updateUi(true);
            }
        })
        .withFailureHandler(showError)
        .listRedactedProfiles();
});

function showError(msg) {
    $('#error').text(msg);
}

function updateUi(enable) {
    let enableProfilesDropdown = enable && $('#profile option').length > 0;
    $('#profile').prop('disabled', !enableProfilesDropdown);
    $('#delete-profile').prop('disabled', !enableProfilesDropdown);
    $('#add-profile').prop('disabled', !enable);

    let enableTablesDropdown = enable && $('#table option').length > 0;
    $('#table').prop('disabled', !enableTablesDropdown);
    $('#import-table').prop('disabled', !enableTablesDropdown);
    $('#import-location').prop('disabled', !enableTablesDropdown);
    $('#limit-checkbox').prop('disabled', !enableTablesDropdown);
    let enableLimit = enable && $('#limit-checkbox').prop('checked');
    $('#limit').prop('disabled', !enableLimit);

    $('#message').text('');
    $('#error').text('');
}

function loadProfiles(profiles) {
    Object.entries(profiles).sort((a, b) => {
        // Sort by reverse chronological order
        b[1].createdAt - a[1].createdAt;
    }).map(entry => {
        let key = entry[0];
        $('#profile').append(
            $('<option></option>')
                .attr('value', key)
                .text(key)
        );
    });
}

function showAddProfilePrompt() {
    updateUi(false);
    google.script.run
        .withSuccessHandler(result => {
            if (result != null) {
                $('#profile').prepend(
                    $('<option></option>')
                        .attr('value', result.name)
                        .text(result.name)
                );
                loadTables();
            } else {
                updateUi(true);
            }
        })
        .withFailureHandler(msg => {
            updateUi(true);
            showError(msg);
        })
        .showAddProfilePrompt();
}

function showDeleteProfilePrompt() {
    updateUi(false);
    google.script.run
        .withSuccessHandler(result => {
            if (result) {
                $('#profile option:selected').remove();
                if ($('#profile option').length == 0) {
                    $('#table').empty();
                    updateUi(true);
                } else {
                    loadTables();
                }
            } else {
                updateUi(true);
            }
        })
        .withFailureHandler(msg => {
            updateUi(true);
            showError(msg);
        })
        .showDeleteProfilePrompt($('#profile').val());
}

function loadTables() {
    updateUi(false);
    $('#table').empty();
    google.script.run
        .withSuccessHandler(result => {
            result.map(item => {
                let value = `${item.share}.${item.schema}.${item.name}`
                $('#table').append(
                    $('<option></option>')
                        .attr('value', value)
                        .text(value)
                );
            });
            updateUi(true);
        })
        .withFailureHandler(msg => {
            updateUi(true);
            showError(msg);
        })
        .getAllTablesInProfile($('#profile').val());
}

function importTable() {
    let tableParts = $('#table').val().split('.');
    let item = {
        share: tableParts[0],
        schema: tableParts[1],
        name: tableParts[2]
    }
    let limit = null;
    if ($('#limit-checkbox').prop('checked')) {
        limit = parseInt($('#limit').val());
    }
    let options = {
        importLocation: $('#import-location').val(),
        limit
    }
    updateUi(false);
    google.script.run
        .withSuccessHandler(result => {
            updateUi(true);
            if (result) {
                // This happens if a new spreadsheet is created, so we need some way to let
                // the user open the spreadsheet in a new window.
                $('#message')
                    .text('Table imported successfuly. ')
                    .append(
                        $('<a target="_blank" rel="noopener">Open now»</a>').attr('href', result)
                    );
            }
        })
        .withFailureHandler(msg => {
            updateUi(true);
            showError(msg);
        })
        .fillSpreadsheet($('#profile').val(), item, options);
}

