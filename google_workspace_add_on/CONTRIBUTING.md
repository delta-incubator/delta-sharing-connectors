# Contributing

Thanks for contributing to the project!

# Setup

While inside the `google_workspace_add_on` directory.

Run

```
yarn
yarn global add @google/clasp
clasp login
mkdir dist
clasp create --type standalone --rootDir dist/
mv dist/.clasp.json .
```

This will create a local Google Apps Script project and your clasp CLI will be attached to the
project.

If you want to attach to an existing project, modify `.clasp.json`.

# Building

Run `yarn run build`.

# Publishing to Local Google Apps Script Project

Run `yarn run push`.

## One-time flow when publishing for the first time

Go to the Google Apps Script settings for the project.

Click on `Deploy` > `Test Deployments`.

Click the gear icon next to `Select Type`.

Choose the `Google Workspace Add-On` option.

Click on `Install`.

Go to any Google Sheets and you should be able to use the Add-On.
If there are difficulties with OAuth, attach a Google Cloud Project to your script by following
[this](https://developers.google.com/apps-script/guides/cloud-platform-projects#standard).

# Publishing to Production Google Apps Script Project (for pushers)

Modify `.clasp.json` (backup if necessary) to contain

``` json
{"scriptId":"1HZUkoe3XL11X7BQqOhJBbxkDIb-ZwgZvgTS7k0EiI4_HqDC2dXAc-dTk","rootDir":"dist/"}
```

Run `yarn run push`.

Go to the Google Apps Script settings for the project.

Click on `Deploy` > `New Deployment`.

Fill in the details and then click on `Deploy`.