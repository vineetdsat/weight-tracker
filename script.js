// Function to calculate metrics
function calculateMetrics(data) {
    if (data.length === 0) return {};

    const latestWeight = data[data.length - 1].weight;
    const secondLatestWeight = data.length > 1 ? data[data.length - 2].weight : latestWeight;
    const initialWeight = data[0].weight;

    const actual = latestWeight;
    const change = latestWeight - secondLatestWeight;
    const total = latestWeight - initialWeight;

    // Arrow formatting
    const changeArrow = change >= 0 ? '▲' : '▼';
    const changeColor = change >= 0 ? 'red' : 'green';
    const totalArrow = total >= 0 ? '▲' : '▼';
    const totalColor = total >= 0 ? 'red' : 'green';

    const trendWeek = calculateWeeklyTrend(data);
    const thisWeekChange = calculateWeeklyChange(data);
    const thisMonthChange = calculateMonthlyChange(data);

    return {
        actual: actual.toFixed(2) + " kg",
        change: `<span style="color: ${changeColor}">${changeArrow} ${Math.abs(change).toFixed(2)} kg</span>`,
        trendWeek: (trendWeek >= 0 ? '▲' : '▼') + Math.abs(trendWeek).toFixed(2) + " kg",
        thisWeek: (thisWeekChange >= 0 ? '▲' : '▼') + Math.abs(thisWeekChange).toFixed(2) + " kg",
        thisMonth: (thisMonthChange >= 0 ? '▲' : '▼') + Math.abs(thisMonthChange).toFixed(2) + " kg",
        total: `<span style="color: ${totalColor}">${totalArrow} ${Math.abs(total).toFixed(2)} kg</span>`
    };
}

function calculateWeeklyTrend(data) {
    const weeklyData = data.slice(-7);
    return weeklyData.length > 1
        ? (weeklyData[weeklyData.length - 1].weight - weeklyData[0].weight) / (weeklyData.length - 1)
        : 0;
}

function calculateWeeklyChange(data) {
    const weeklyData = data.slice(-7);
    return weeklyData.length > 1
        ? (weeklyData[weeklyData.length - 1].weight - weeklyData[0].weight) / (weeklyData.length - 1)
        : 0;
}

function calculateMonthlyChange(data) {
    const monthlyData = data.slice(-30);
    return monthlyData.length > 1
        ? (monthlyData[monthlyData.length - 1].weight - monthlyData[0].weight) / (monthlyData.length - 1)
        : 0;
}


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

// Function to render the chart without data point dots and x-axis
function renderChart(labels, weights) {
    const ctx = document.getElementById('chart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, // Dates for tooltip context
            datasets: [{
                label: 'Weight',
                data: weights,
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                borderWidth: 2,
                pointRadius: 0, // Keeps dots hidden on the line
                pointHoverRadius: 6 // Displays a small dot when hovering over a point
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const weight = context.raw.toFixed(2) + ' kg';
                            const date = context.label; // This is the date for the data point
                            return `Date: ${date}, Weight: ${weight}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return value.toFixed(2) + ' kg';
                        }
                    }
                },
                x: {
                    display: false // Hides the x-axis with dates
                }
            },
            layout: {
                padding: { left: 20, right: 20 }
            }
        },
        plugins: [ChartDataLabels]
    });
}



// Function to update the page with chart and metrics
async function updatePage() {
    const data = await fetchData();

    if (data) {
        console.log('Data successfully fetched and passed to updatePage:', data);

        const labels = data.map(entry => entry.date);
        const weights = data.map(entry => entry.weight);

        renderChart(labels, weights);

        const metrics = calculateMetrics(data);
        document.getElementById('stats').innerHTML = `
            <div>Actual<br><span>${metrics.actual}</span></div>
            <div>Change<br><span>${metrics.change}</span></div>
            <div>Trend (week)<br><span>${metrics.trendWeek.startsWith('-') ? '▼' : '▲'}${metrics.trendWeek.replace('-', '')}</span></div>
            <div>This Week<br><span>${metrics.thisWeek.startsWith('-') ? '▼' : '▲'}${metrics.thisWeek.replace('-', '')}</span></div>
            <div>This Month<br><span>${metrics.thisMonth.startsWith('-') ? '▼' : '▲'}${metrics.thisMonth.replace('-', '')}</span></div>
            <div>Total<br><span>${metrics.total}</span></div>
        `;
    } else {
        console.error("Data is null or undefined. Can't update the page.");
    }
}


// Initial call to update the page
updatePage();
