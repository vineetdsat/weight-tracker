const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Load Google Sheets credentials
const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
const { client_email, private_key } = credentials;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const auth = new google.auth.JWT(client_email, null, private_key, SCOPES);
const sheets = google.sheets({ version: 'v4', auth });

// Your Google Sheet ID and range
const SPREADSHEET_ID = '1xZoIrtg7Mb2XL-_s3eM8JptnTrg4Zc4N48KGhBG5k1g';
const RANGE = 'Sheet1!A:B';

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '/')));

app.get('/data', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.data.values;
        if (rows.length) {
            const data = rows.map(row => ({
                date: row[0],
                weight: parseFloat(row[1]),
            }));
            res.json(data);
        } else {
            res.status(404).send('No data found.');
        }
    } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
