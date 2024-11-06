// Function to calculate metrics
function calculateMetrics(data) {
    if (data.length === 0) return {};

    const latestWeight = data[data.length - 1].weight;
    const secondLatestWeight = data.length > 1 ? data[data.length - 2].weight : latestWeight;
    const initialWeight = data[0].weight;

    // Calculate 'Actual' - Latest weight entered
    const actual = latestWeight;

    // Calculate 'Change' - Difference between the latest weight and the second latest weight
    const change = latestWeight - secondLatestWeight;

    // Calculate 'Total' - Difference between the initial and latest weight
    const total = latestWeight - initialWeight;

    // Calculate '%Consistency' - Total Number of Rows / Date Difference (in days) between First and Last Entry
    const totalRows = data.length;
    const startDate = new Date(data[data.length - 1].date); 
    const endDate = new Date(data[0].date);
    const dateDifference = Math.max((endDate - startDate) / (1000 * 60 * 60 * 24), 1); // Avoid divide by zero
    const consistency = ((totalRows / dateDifference) * 100).toFixed(2) + '%';

    // Arrow formatting
    const changeArrow = change >= 0 ? '▲' : '▼';
    const changeColor = change >= 0 ? 'red' : 'green';
    const totalArrow = total >= 0 ? '▲' : '▼';
    const totalColor = total >= 0 ? 'red' : 'green';

    // Fixed target value
    const target = "73 kg";

    return {
        actual: actual.toFixed(2) + " kg",
        change: `<span style="color: ${changeColor}">${changeArrow} ${Math.abs(change).toFixed(2)} kg</span>`,
        total: `<span style="color: ${totalColor}">${totalArrow} ${Math.abs(total).toFixed(2)} kg</span>`,
        consistency: consistency,
        target: target
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

    // Find the minimum and maximum weights and their indices
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const minIndex = weights.indexOf(minWeight);
    const maxIndex = weights.indexOf(maxWeight);

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
                            const date = context.label;
                            return `Date: ${date}, Weight: ${weight}`;
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        // Display labels only for the minimum and maximum points
                        return context.dataIndex === minIndex || context.dataIndex === maxIndex;
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: function(value) {
                        return value.toFixed(2) + ' kg';
                    },
                    color: '#00ff00',
                    font: {
                        weight: 'bold'
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
        plugins: [ChartDataLabels] // Ensure the ChartDataLabels plugin is included
    });
}



// Function to update the page with chart and metrics
async function updatePage() {
    const data = await fetchData();

    if (data) {
        console.log('Data successfully fetched and passed to updatePage:', data);

        // Render chart
        const labels = data.map(entry => entry.date);
        const weights = data.map(entry => entry.weight);

        renderChart(labels, weights);

        // Calculate and render metrics
        const metrics = calculateMetrics(data);
        document.getElementById('stats').innerHTML = `
            <div>Actual<br><span>${metrics.actual}</span></div>
            <div>Change<br><span>${metrics.change}</span></div>
            <div>Total<br><span>${metrics.total}</span></div>
            <div>%Consistency<br><span>${metrics.consistency}</span></div>
        `;
    } else {
        console.error("Data is null or undefined. Can't update the page.");
    }
}




// Initial call to update the page
updatePage();
