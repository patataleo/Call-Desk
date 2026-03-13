# Call Desk Setup Guide

Quick setup instructions to get your call desk system running.

## Google Apps Script Configuration

1. Head over to script.google.com and create a new project
2. Copy the code from `AppsScript.gs` and paste it into the script editor
3. Update the `SHEET_ID` constant with your Google Sheet ID
4. Deploy as a web app:
   - Click Deploy → New Deployment
   - Select "Web app" as deployment type
   - Set "Execute as" to your account
   - Set "Who has access" to "Anyone"
   - Click Deploy and authorize the necessary permissions
5. Copy the generated web app URL
6. Open `js/app.js` and replace the `APPS_SCRIPT_URL` value with your web app URL

## Google Sheet Structure

Your sheet should have these columns (A through K):

| Column | Field       | Description                               |
| ------ | ----------- | ----------------------------------------- |
| A      | Lead ID     | Unique identifier                         |
| B      | Name        | Client name                               |
| C      | Phone       | Contact number                            |
| D      | Address     | Street address                            |
| E      | Province    | Will be filled by agent                   |
| F      | City        | Will be filled by agent                   |
| G      | Barangay    | Will be filled by agent                   |
| H      | Remarks     | Call notes                                |
| I      | Call Status | Outcome of the call                       |
| J      | Timestamp   | Auto-filled when lead is fetched          |
| K      | Items Sold  | Products sold (required for Sales status) |

If your columns are arranged differently, you'll need to adjust the column numbers in `AppsScript.gs` (look for the `getRange()` calls in the `updateLead` function).

## Location Data (PSGC API)

The system uses the Philippine Standard Geographic Code (PSGC) API for location dropdowns:

- API endpoint: https://psgc.gitlab.io/api/
- No API key required
- Works automatically for Philippine locations

If you need to use a different country's location data, you'll need to modify the `loadProvinces()` function and the dropdown event listeners in `js/app.js`.

## Running the Application

1. Open `login.html` in your browser
2. Enter your agent name (this should match a sheet name in your Google Sheet)
3. Click login to access the call desk interface

## Notes

- Each agent should have their own sheet in the Google Sheets file
- The sheet name must match the agent name used during login
- Make sure your Google Sheet is accessible by the account running the Apps Script
- The system uses JSONP for cross-origin requests, so the callback parameter is required
