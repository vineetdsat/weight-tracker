// Function to fetch data from Google Sheets
async function fetchData() {
    const sheetId = '1xZoIrtg7Mb2XL-_s3eM8JptnTrg4Zc4N48KGhBG5k1g'; // Replace with your actual Google Sheet ID
    const apiKey = 'AIzaSyCqr7U6m8gIl8RAnAIPGXOC12uGMAxJ4ek'; // Replace with your actual Google Sheets API key
    const range = 'Sheet1!A:B'; // Assumes your data is in the first sheet, columns A and B

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    console.log('Fetching data from:', url); // Debug log

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();

        // Convert Google Sheets data format to our expected format
        const rows = data.values;
        const formattedData = rows.slice(1).map(row => ({
            date: row[0],
            weight: parseFloat(row[1])
        }));

        console.log('Fetched data from Google Sheets:', formattedData); // Debug log
        return formattedData;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Function to update the page with calculated metrics
async function updatePage() {
    const data = await fetchData();
    if (!data) {
        console.error("Data is null or undefined. Can't update the page.");
        return;
    }

    // Sort the data by date in ascending order to ensure the last entry is the latest
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get the latest (most recent) entry
    const latestEntry = data[data.length - 1];
    const actualWeight = latestEntry.weight;

    // Calculate other metrics
    const secondLatestEntry = data[data.length - 2] || latestEntry; // Fallback to latest if only one entry
    const change = actualWeight - secondLatestEntry.weight;
    const totalChange = actualWeight - data[0].weight;

    // Calculate weekly trend (average change per week over the last week if available)
    const oneWeekAgoIndex = data.findIndex(entry => new Date(entry.date) >= new Date(new Date(latestEntry.date).setDate(new Date(latestEntry.date).getDate() - 7)));
    const weeklyChange = oneWeekAgoIndex !== -1 ? actualWeight - data[oneWeekAgoIndex].weight : change;

    // Calculate average change this week and this month
    const oneWeekAgoData = data.slice(oneWeekAgoIndex);
    const weeklyAverageChange = oneWeekAgoData.length > 1 ? (oneWeekAgoData[oneWeekAgoData.length - 1].weight - oneWeekAgoData[0].weight) / (oneWeekAgoData.length - 1) : change;

    const oneMonthAgoIndex = data.findIndex(entry => new Date(entry.date) >= new Date(new Date(latestEntry.date).setMonth(new Date(latestEntry.date).getMonth() - 1)));
    const oneMonthAgoData = data.slice(oneMonthAgoIndex);
    const monthlyAverageChange = oneMonthAgoData.length > 1 ? (oneMonthAgoData[oneMonthAgoData.length - 1].weight - oneMonthAgoData[0].weight) / (oneMonthAgoData.length - 1) : change;

    // Update HTML elements with calculated values
    document.getElementById("actual-weight").textContent = `${actualWeight.toFixed(2)} kg`;
    document.getElementById("change").textContent = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)} kg`;
    document.getElementById("trend-weekly").textContent = `${weeklyChange >= 0 ? '▲' : '▼'} ${Math.abs(weeklyChange).toFixed(2)} kg`;
    document.getElementById("this-week").textContent = `${weeklyAverageChange >= 0 ? '▲' : '▼'} ${Math.abs(weeklyAverageChange).toFixed(2)} kg`;
    document.getElementById("this-month").textContent = `${monthlyAverageChange >= 0 ? '▲' : '▼'} ${Math.abs(monthlyAverageChange).toFixed(2)} kg`;
    document.getElementById("total-change").textContent = `${totalChange >= 0 ? '▲' : '▼'} ${Math.abs(totalChange).toFixed(2)} kg`;

    // Update the chart with the data
    updateChart(data);
}

// Function to update the chart
function updateChart(data) {
    const ctx = document.getElementById('chart').getContext('2d');
    const dates = data.map(entry => entry.date);
    const weights = data.map(entry => entry.weight);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Weight',
                data: weights,
                borderColor: 'lime',
                backgroundColor: 'lime',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                }
            }
        }
    });
}

// Initialize the page with data
document.addEventListener('DOMContentLoaded', updatePage);
