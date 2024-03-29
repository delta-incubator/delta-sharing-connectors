# Google Workspace Add-On for Delta Sharing

This Google Workspace Add-On is a Delta Sharing client that imports Delta tables into Google Sheets.

# Allowlisting your domain

Due to Google's security policy, all URLs fetched must be allowlisted.
Without allowlisting, you would experience the following error message in the add-on:

```
... failed because the URL has not been whitelisted in the script manifest.
```

To be allowlisted, please file a GitHub issue or create a Pull Request that allowlists the domain
in `appscript.json` through `urlFetchWhitelist`.

# Limitations

## Parquet File size

URL fetching is limited to 50MB due to Google Workspace Add-On restrictions.
When reading Parquet files, it partially fetches the file through row groups,
so there is a 50MB limit in row group size.

## Execution Time / Call Limit

Google Workspace Add-Ons has an execution limit of 30 seconds.
If there are too many rows or if the bandwidth is slow, the table cannot be loaded in time.
Tests show that the limit is ~500k cells before reaching this deadline.

## Client IP Address

The Google Workspace Add-On runs on Google servers, so the IP address from where the
client is calling Delta Sharing APIs is one of Google's servers, not the end user's network.
This will limit the usefulness of IP address whitelists.

# Additional Disclosures
The app complies with the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

No data is shared with any third party sites; only credentials are sent as part of the authentication process to the third party service hosting the Delta Sharing service. Please refer to the corresponding third party service's terms of service and privacy policy.

# Support
For any issues not covered by the above sections, please file a GitHub issue or contact william.chau@databricks.com
