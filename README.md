README / SETUP INSTRUCTIONS

1. GOOGLE APPS SCRIPT SETUP
   - Open script.google.com → New Project
   - Paste the Apps Script code from the companion file (see below)
   - Deploy → New Deployment → Web App
     • Execute as: Me
     • Who has access: Anyone
   - Copy the Web App URL and paste it as APPS_SCRIPT_URL below

2. GOOGLE SHEET COLUMNS (adjust COL\_ constants if your columns differ)
   A: Lead ID B: Name C: Phone D: Address
   E: Province F: City G: Barangay H: Remarks I: Call Status

3. PSGC (Philippine location data)
   Uses the free public PSGC API at https://psgc.gitlab.io/api/
   No key needed. Works out-of-the-box for PH locations.
   To use a different country, swap the loadProvinces/loadCities/loadBarangays
   functions below with your preferred API.
