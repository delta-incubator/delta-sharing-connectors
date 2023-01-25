export class DeltaSharingClient {
    constructor(profile) {
        this.client = new DeltaSharingRestClient(profile);
    }

    listShares() {
        let pageToken = null;
        const shares = [];
        do {
            let resp = this.client.listShares(pageToken);
            if (resp.hasOwnProperty('items')) {
                shares.push(...resp.items);
            }
            pageToken = 'pageToken' in resp ? resp.pageToken : null;
        } while (pageToken && pageToken != '');
        return shares;
    }

    listAllTables(share) {
        let pageToken = null;
        const tables = [];
        do {
            const resp = this.client.listAllTables(share, pageToken);
            if (resp.hasOwnProperty('items')) {
                tables.push(...resp.items);
            }
            pageToken = resp.hasOwnProperty('pageToken') ? resp.pageToken : null;
        } while (pageToken && pageToken != '');
        return tables;
    }

    queryTable(tableItem, limitHint) {
        return this.client.queryTable(tableItem.share, tableItem.schema, tableItem.name, limitHint);
    }
}

class DeltaSharingRestClient {
    constructor(profile) {
        this.profile = profile;
    }

    callEndpoint(url, method, payload) {
        const headers = {
            'Authorization': `Bearer ${this.profile.bearerToken}`
        };
        // Query table requires this header as well.
        if (method == 'post') {
            headers['Content-Type'] = 'application/json; charset=utf-8';
        }
        const payloadStr = payload ? JSON.stringify(payload) : null;
        const params = {
            method,
            payload: payloadStr,
            headers
        };
        return UrlFetchApp.fetch(
            this.profile.endpoint + url,
            params
        ).getContentText();
    }

    listShares(pageToken) {
        let url = '/shares'
        if (pageToken) {
            url = url + `?pageToken=${encodeURIComponent(pageToken)}`;
        }
        return JSON.parse(this.callEndpoint(url, 'get'));
    }

    listAllTables(share, pageToken) {
        const eShare = encodeURIComponent(share);
        let url = `/shares/${eShare}/all-tables`
        if (pageToken) {
            url = url + `?pageToken=${encodeURIComponent(pageToken)}`;
        }
        return JSON.parse(this.callEndpoint(url, 'get'));
    }

    queryTable(share, schema, table, limitHint) {
        const eShare = encodeURIComponent(share);
        const eSchema = encodeURIComponent(schema);
        const eTable = encodeURIComponent(table);
        const url = `/shares/${eShare}/schemas/${eSchema}/tables/${eTable}/query`;
        const response = this.callEndpoint(url, 'post', {limitHint});
        // http://ndjson.org/
        // The last JSON row ends with a line delimiter per the spec, but to be more flexible,
        // we will check whether the last element after the split has contents or not before
        // dropping it.
        let splitResponse = response.split(/\r?\n/)
        if (splitResponse[splitResponse.length - 1].length == 0) {
            splitResponse = splitResponse.slice(0, splitResponse.length - 1);
        }
        return splitResponse.map(JSON.parse);
    }
}