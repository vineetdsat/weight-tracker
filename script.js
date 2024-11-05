// Function to calculate metrics
function calculateMetrics(data) {
    // Ensure data has at least one entry
    if (data.length === 0) return {};

    const latestWeight = data[data.length - 1].weight;
    const secondLatestWeight = data.length > 1 ? data[data.length - 2].weight : latestWeight;
    const initialWeight = data[0].weight;

    // Calculate 'Actual' - Latest weight entered
    const actual = latestWeight;

    // Calculate 'Change' - Difference between the latest weight and the second latest weight
    const change = latestWeight - secondLatestWeight;

    // Calculate 'Trend (week)' - Average weight change per week (from last 7 days)
    const weeklyData = data.slice(-7);
    const trendWeek = weeklyData.length > 1
        ? (weeklyData[weeklyData.length - 1].weight - weeklyData[0].weight) / (weeklyData.length - 1)
        : 0;

    // Calculate 'This Week' - Average change in weight over the last 7 days
    const thisWeekChange = weeklyData.length > 1
        ? (weeklyData[weeklyData.length - 1].weight - weeklyData[0].weight) / (weeklyData.length - 1)
        : 0;

    // Calculate 'This Month' - Average change in weight over the last 30 days
    const monthlyData = data.slice(-30);
    const thisMonthChange = monthlyData.length > 1
        ? (monthlyData[monthlyData.length - 1].weight - monthlyData[0].weight) / (monthlyData.length - 1)
        : 0;

    // Calculate 'Total' - Difference between the initial and latest weight
    const total = latestWeight - initialWeight;

    return {
        actual: actual.toFixed(2) + " kg",
        change: (change >= 0 ? '▲' : '▼') + Math.abs(change).toFixed(2) + " kg",
        trendWeek: (trendWeek >= 0 ? '▲' : '▼') + Math.abs(trendWeek).toFixed(2) + " kg",
        thisWeek: (thisWeekChange >= 0 ? '▲' : '▼') + Math.abs(thisWeekChange).toFixed(2) + " kg",
        thisMonth: (thisMonthChange >= 0 ? '▲' : '▼') + Math.abs(thisMonthChange).toFixed(2) + " kg",
        total: (total >= 0 ? '▲' : '▼') + Math.abs(total).toFixed(2) + " kg"
    };
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
            labels: labels, // Dates are included for tooltip context
            datasets: [{
                label: 'Weight',
                data: weights,
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                borderWidth: 2,
                pointRadius: 0, // Removes the dots at each data point
                pointHoverRadius: 0, // Ensures no dots appear on hover
                // Show data labels for min and max points only
                datalabels: {
                    display: function(context) {
                        // Display only for min and max points
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
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw.toFixed(2) + ' kg';
                        }
                    }
                },
                datalabels: { // Enable the DataLabels plugin for the chart
                    color: '#fff',
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return value.toFixed(2) + ' kg'; // Display y-axis values in 2 decimal places with kg unit
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
        plugins: [ChartDataLabels] // Ensure that the ChartDataLabels plugin is included
    });
}


// Function to update the page with chart and metrics
async function updatePage() {
    const data = await fetchData();

    if (data) {
        console.log('Data successfully fetched and passed to updatePage:', data);  // Debug message

        // Render chart
        const labels = data.map(entry => entry.date);
        const weights = data.map(entry => entry.weight);

        renderChart(labels, weights); // Call renderChart to render the updated chart

        // Calculate and render metrics
        const metrics = calculateMetrics(data);
        document.getElementById('stats').innerHTML = `
            <div>Actual<br><span>${metrics.actual}</span></div>
            <div>Change<br><span>${metrics.change.startsWith('-') ? '▼' : '▲'}${metrics.change.replace('-', '')}</span></div>
            <div>Trend (week)<br><span>${metrics.trendWeek.startsWith('-') ? '▼' : '▲'}${metrics.trendWeek.replace('-', '')}</span></div>
            <div>This Week<br><span>${metrics.thisWeek.startsWith('-') ? '▼' : '▲'}${metrics.thisWeek.replace('-', '')}</span></div>
            <div>This Month<br><span>${metrics.thisMonth.startsWith('-') ? '▼' : '▲'}${metrics.thisMonth.replace('-', '')}</span></div>
            <div>Total<br><span>${metrics.total.startsWith('-') ? '▼' : '▲'}${metrics.total.replace('-', '')}</span></div>
        `;
    } else {
        console.error("Data is null or undefined. Can't update the page.");
    }
}

// Initial call to update the page
updatePage();
