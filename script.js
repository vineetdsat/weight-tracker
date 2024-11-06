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

    // Calculate '%Consistency'
    const totalRows = data.length; // Total number of entries
    const oldestDate = new Date(data[0].date); // First entry date (oldest)
    const latestDate = new Date(data[data.length - 1].date); // Last entry date (latest)
    const totalDays = Math.max((latestDate - oldestDate) / (1000 * 60 * 60 * 24), 1); // Difference in days
    const consistency = ((totalRows / totalDays) * 100).toFixed(2) + '%';

    // Arrow formatting
    const changeArrow = change >= 0 ? '▲' : '▼';
    const changeColor = change >= 0 ? 'red' : 'green';
    const totalArrow = total >= 0 ? '▲' : '▼';
    const totalColor = total >= 0 ? 'red' : 'green';

    // Fixed target value
    const target = "73.00 kg";

    return {
        actual: actual.toFixed(2) + " kg",
        change: `<span style="color: ${changeColor}">${changeArrow} ${Math.abs(change).toFixed(2)} kg</span>`,
        total: `<span style="color: ${totalColor}">${totalArrow} ${Math.abs(total).toFixed(2)} kg</span>`,
        consistency: consistency,
        target: target
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


// Function to fetch data from Google Sheets
function renderChart(labels, weights) {
    const ctx = document.getElementById('chart').getContext('2d');

    // Identify the start of each month in the labels
    const monthDividers = [];
    labels.forEach((label, index) => {
        const currentDate = new Date(label);
        const previousDate = index > 0 ? new Date(labels[index - 1]) : null;

        // Mark the start of each new month
        if (previousDate && currentDate.getMonth() !== previousDate.getMonth()) {
            monthDividers.push({
                index,
                month: currentDate.toLocaleString('default', { month: 'long' })
            });
        }

        // Ensure the start of the current month is marked if it’s the first label
        if (index === 0) {
            monthDividers.push({
                index: index,
                month: currentDate.toLocaleString('default', { month: 'long' })
            });
        }
    });

    // Identify local maxima and minima
    const maximaMinima = weights.map((value, index) => {
        const previousValue = weights[index - 1];
        const nextValue = weights[index + 1];
        
        // Local maximum
        if (previousValue !== undefined && nextValue !== undefined && value > previousValue && value > nextValue) {
            return 'max';
        }
        
        // Local minimum
        if (previousValue !== undefined && nextValue !== undefined && value < previousValue && value < nextValue) {
            return 'min';
        }

        return null;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight',
                data: weights,
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                tension: 0.4
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
                        const index = context.dataIndex;
                        return maximaMinima[index] !== null; // Only display for local maxima and minima
                    },
                    align: 'top',
                    anchor: 'end',
                    formatter: function(value) {
                        return Math.round(value) + ' kg';
                    },
                    color: '#c0c0c0', // Light gray color for the labels
                    font: {
                        weight: 'normal',
                        size: 10
                    }
                },
                annotation: {
                    annotations: monthDividers.map(divider => ({
                        type: 'line',
                        scaleID: 'x',
                        value: labels[divider.index],
                        borderColor: 'rgba(255, 255, 255, 0.5)', // Light grey divider line
                        borderWidth: 1,
                        borderDash: [5, 5],
                        label: {
                            content: divider.month,
                            enabled: true,
                            position: 'top',
                            color: '#ffffff',
                            font: {
                                weight: 'normal',
                                size: 10
                            },
                            backgroundColor: 'rgba(0, 0, 0, 0.6)', // Optional: add a background color for better readability
                            padding: 5 // Optional: padding around the label text
                        }
                    }))
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(128, 128, 128, 0.3)',
                        lineWidth: 0.5,
                        borderDash: [4, 4]
                    },
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return value.toFixed(2) + ' kg';
                        },
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false, // Hide x-axis labels but show tick marks
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0
                    },
                    border: {
                        display: true,
                        color: 'rgba(128, 128, 128, 0.3)',
                        width: 0.5
                    }
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

        // Get the current date to determine the current and previous months
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Determine the previous month and year
        let previousMonth = currentMonth - 1;
        let previousYear = currentYear;
        if (previousMonth < 0) {
            previousMonth = 11; // December
            previousYear -= 1;
        }

        // Filter data to include only entries from the current and previous months
        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.date);
            const entryMonth = entryDate.getMonth();
            const entryYear = entryDate.getFullYear();

            // Include data only from the current or previous month and year
            return (
                (entryMonth === currentMonth && entryYear === currentYear) ||
                (entryMonth === previousMonth && entryYear === previousYear)
            );
        });

        // Map the filtered data to labels and weights for the chart
        const labels = filteredData.map(entry => entry.date);
        const weights = filteredData.map(entry => entry.weight);

        // Render the chart with the filtered data
        renderChart(labels, weights);

        // Calculate and render metrics for all data (metrics remain unchanged)
        const metrics = calculateMetrics(data);
        document.getElementById('stats').innerHTML = `
            <div>Actual<br><span>${metrics.actual}</span></div>
            <div>Change<br><span>${metrics.change}</span></div>
            <div>Total<br><span>${metrics.total}</span></div>
            <div>% Consistency<br><span>${metrics.consistency}</span></div>
            <div>Target<br><span>${metrics.target}</span></div>
        `;
    } else {
        console.error("Data is null or undefined. Can't update the page.");
    }
}





// Initial call to update the page
updatePage();
