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
| E      | Remarks     | Call notes                                |
| F      | Call Status | Outcome of the call                       |
| G      | Timestamp   | Auto-filled when lead is fetched          |
| H      | Items Sold  | Products sold (required for Sales status) |

If your columns are arranged differently, you'll need to adjust the column numbers in `AppsScript.gs` (look for the `getRange()` calls in the `updateLead` function).

## Managing Agent Accounts

Agent credentials are stored in `encode.py`. To add, edit, or remove accounts:

1. Open `encode.py` in any text editor
2. Find the accounts list — each line looks like this:
   ```
   'NAME': {'p': 'password', 's': 'NAME'},
   ```

   - `p` is the password
   - `s` is the sheet name in Google Sheets (usually same as the name)
3. Make your changes — add a new line, edit a password, or delete a line to remove an account
4. Save the file, then run this in terminal from the project folder:
   ```
   python encode.py
   ```
5. It will print a long string of random-looking characters — copy the entire output
6. Open `login.html`, find this line near the bottom:
   ```
   const _x = JSON.parse(atob('...'));
   ```
7. Replace everything inside `atob('...')` with the string you just copied
8. Save `login.html` — done

## Running the Application

1. Open `login.html` in your browser
2. Enter your agent username and password
3. Click Sign In to access the call desk interface

## Notes

- Each agent must have their own sheet in the Google Sheets file
- The sheet name must match the `s` value set in `encode.py`
- Make sure your Google Sheet is accessible by the account running the Apps Script
- The system uses JSONP for cross-origin requests, so the callback parameter is required
