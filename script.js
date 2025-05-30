function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLogin() {
    document.getElementById('loginModal').style.display = 'none';
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if(username === 'admin' && password === 'admin') {
        localStorage.setItem('isAuthenticated', 'true');
        window.location.href = 'protected.html';
    } else {
        alert('Неверные учетные данные!');
    }
}

window.onload = function() {
    if(window.location.pathname.endsWith('protected.html') && 
       localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = 'protected.html';
    }
}

function logout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'protected.html';
}
async function loadAirData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Ошибка сети');
        
        const data = await response.json();
        if (!data || data.length === 0) throw new Error('Нет данных');
        
        // Обработка данных...
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        document.getElementById('currentStats').innerHTML = `
            <div class="alert alert-danger">
                Ошибка загрузки данных: ${error.message}
            </div>
        `;
    }
}
function renderPMChart(data) {
    const ctx = document.getElementById('pmChart').getContext('2d');
    
    // Показываем спиннер
    ctx.canvas.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';

    // Проверяем данные
    if (!data || data.length === 0) {
        console.error('Нет данных для графика');
        ctx.canvas.innerHTML = '<p class="text-danger">Нет данных для отображения</p>';
        return;
    }

    // Удаляем предыдущий график
    // if (window.pmChart) window.pmChart.destroy();

    // Группируем данные по дням
    const dailyData = {};
    data.forEach(item => {
        const dateStr = item[2].toLocaleDateString('ru-RU');
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = { pm25: [], count: 0 };
        }
        dailyData[dateStr].pm25.push(item[3]);
        dailyData[dateStr].count++;
    });

    // Подготавливаем данные
    const labels = Object.keys(dailyData);
    const pm25Values = labels.map(date => {
        const sum = dailyData[date].pm25.reduce((a, b) => a + b, 0);
        return sum / dailyData[date].count;
    });

    // Очищаем спиннер
    ctx.canvas.innerHTML = '';

    // Создаем график
    window.pmChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Средний PM2.5',
                data: pm25Values,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Динамика PM2.5 за последние дни'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'PM2.5 (μg/m³)' },
                    min: 0
                }
            }
        }
    });
}
function calculateStatistics(data) {
    const stats = data.reduce((acc, item) => {
        const city = item[1];
        if (!acc[city]) {
            acc[city] = {
                pm25: [],
                pm10: [],
                co2: [],
                temperature: [],
                humidity: []
            };
        }
        
        acc[city].pm25.push(item[3]);
        acc[city].pm10.push(item[4]);
        acc[city].co2.push(item[5]);
        acc[city].temperature.push(item[6]);
        acc[city].humidity.push(item[7]);
        
        return acc;
    }, {});
    
    Object.keys(stats).forEach(city => {
        const cityData = stats[city];
        stats[city] = {
            avgPM25: (cityData.pm25.reduce((a, b) => a + b, 0) / cityData.pm25.length).toFixed(1),
            maxPM25: Math.max(...cityData.pm25).toFixed(1),
            avgTemp: (cityData.temperature.reduce((a, b) => a + b, 0) / cityData.temperature.length).toFixed(1),
            avgHumidity: (cityData.humidity.reduce((a, b) => a + b, 0) / cityData.humidity.length).toFixed(1)
        };
    });
    
    return stats;
}

async function loadAirData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        const formattedData = data.map(item => [
            item.id,
            item.city, 
            new Date(item.timestamp),
            item.pm25,
            item.pm10,
            item.co2,
            item.temperature,
            item.humidity
        ]);
        
        updateCurrentStats(formattedData);
        document.getElementById('lastUpdate').textContent = 
            `Последнее обновление: ${new Date().toLocaleTimeString()}`;
        
        renderPMChart(formattedData);
        renderStatisticsTable(formattedData);
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

function renderStatisticsTable(data) {
    const stats = calculateStatistics(data);
    const tableBody = document.getElementById('statsTableBody');
    
    tableBody.innerHTML = Object.entries(stats).map(([city, data]) => `
        <tr>
            <td>${city}</td>
            <td>${data.avgPM25} μg/m³</td>
            <td>${data.maxPM25} μg/m³</td>
            <td>${data.avgTemp} °C</td>
            <td>${data.avgHumidity}%</td>
        </tr>
    `).join('');
}

function renderAirChart(data) {
    const ctx = document.getElementById('airChart').getContext('2d');
    if(window.airChart) window.airChart.destroy(); 
    
    window.airChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(row => new Date(row[2]).toLocaleDateString()),
            datasets: [{
                label: 'PM2.5',
                data: data.map(row => row[3]),
                borderColor: '#e74c3c',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
function updateCurrentStats(data) {
    const citiesContainer = document.getElementById('citiesStats');
    const now = new Date();
    const tenDaysAgo = new Date(now.setDate(now.getDate() - 10)).toISOString();

    const citiesData = data.reduce((acc, row) => {
        const city = row[1]; // Предполагаем, что город находится во втором элементе массива
        if (!acc[city]) {
            acc[city] = [];
        }
        if (new Date(row[2]) > new Date(tenDaysAgo)) { // Фильтр по дате
            acc[city].push(row);
        }
        return acc;
    }, {});

    citiesContainer.innerHTML = Object.entries(citiesData)
        .map(([city, readings]) => {
            if (readings.length === 0) return '';
            
            const avgTemp = readings
                .reduce((sum, row) => sum + row[6], 0) / readings.length;

            return `
                <div class="col">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${city}</h5>
                            <div class="display-4 text-primary">
                                ${avgTemp.toFixed(1)}°C
                            </div>
                            <p class="text-muted small mt-2">
                                Средняя температура за последние 
                                ${Math.min(readings.length, 10)} дней
                            </p>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');
}

function renderDistributionChart(data) {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    const pm25Values = data.map(row => row[3]);
    
    if(window.distributionChart) window.distributionChart.destroy();
    
    window.distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0-35', '36-75', '76-115', '116+'],
            datasets: [{
                label: 'Частота показаний PM2.5',
                data: [
                    pm25Values.filter(v => v <= 35).length,
                    pm25Values.filter(v => v > 35 && v <= 75).length,
                    pm25Values.filter(v => v > 75 && v <= 115).length,
                    pm25Values.filter(v => v > 115).length
                ],
                backgroundColor: ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
}

window.onload = function() {
    if (isAuthenticated()) {
        loadAirData();
        setInterval(loadAirData, 600000);
    } else {
        window.location.href = 'index.html';
    }
}