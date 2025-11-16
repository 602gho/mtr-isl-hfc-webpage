const apiUrl = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=ISL&sta=HFC&lang=TC';
const forecastWeatherUrl = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc';
const currentWeatherUrl = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc';

async function fetchTrainData() {
    try {
        const response = await fetch(apiUrl);
        const json = await response.json();

        const upTbody = document.getElementById('up-tbody');
        const downTbody = document.getElementById('down-tbody');
        const errorDiv = document.getElementById('error-message');
        const updateP = document.getElementById('update-time');

        upTbody.innerHTML = '';
        downTbody.innerHTML = '';
        errorDiv.innerHTML = '';

        if (json.status === 0) {
            errorDiv.textContent = json.message || '無法獲取資料。可能是目前沒有列車服務或輸入錯誤。';
            return;
        }

        const key = 'ISL-HFC';
        const data = json.data[key];

        if (!data) {
            errorDiv.textContent = '無法找到車站資料。';
            return;
        }

        const currentTimeStr = json.curr_time || json.sys_time;
        const currentTime = new Date(currentTimeStr);
        updateP.textContent = `最後更新: ${currentTimeStr}`;
        window.lastTrainUpdate = Date.now();

        function formatTime(timeStr) {
            if (!timeStr) return '';
            const timeMatch = timeStr.match(/\d{2}:\d{2}:\d{2}/);
            return timeMatch ? timeMatch[0] : timeStr;
        }

        function calculateMins(arrivalTimeStr) {
            try {
                const arrivalTime = new Date(arrivalTimeStr);
                if (isNaN(arrivalTime) || isNaN(currentTime)) {
                    return '-';
                }
                const diffMs = arrivalTime - currentTime;
                if (diffMs < 0) {
                    return '已到達';
                }
                const mins = Math.floor(diffMs / 60000);
                return mins === 0 ? '即將抵達' : `${mins} 分鐘`;
            } catch (e) {
                return '-';
            }
        }

        if (data.UP && data.UP.length > 0) {
            data.UP.forEach(train => {
                const mins = calculateMins(train.time);
                const formattedTime = formatTime(train.time);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${train.seq}</td>
                    <td>${formattedTime}</td>
                    <td>${mins}</td>
                `;
                upTbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3">目前沒有上行列車資訊</td>';
            upTbody.appendChild(row);
        }

        if (data.DOWN && data.DOWN.length > 0) {
            data.DOWN.forEach(train => {
                const mins = calculateMins(train.time);
                const formattedTime = formatTime(train.time);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${train.seq}</td>
                    <td>${formattedTime}</td>
                    <td>${mins}</td>
                `;
                downTbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3">目前沒有下行列車資訊</td>';
            downTbody.appendChild(row);
        }

    } catch (error) {
        document.getElementById('error-message').textContent = '發生錯誤: ' + error.message;
    }
}

function getWeatherIcon(iconCode) {
    const iconMap = {
        '50': '☀️', '51': '🌤️', '52': '⛅', '53': '🌥️', '54': '🌦️',
        '60': '☁️', '61': '☁️', '62': '🌧️', '63': '🌧️', '64': '⛈️', '65': '⛈️',
        '70': '☀️', '71': '🌙', '72': '💨', '73': '🌫️', '74': '🌫️', '75': '🌫️',
        '76': '☀️', '77': '☀️', '80': '🌧️', '81': '🌧️', '82': '⛈️', '85': '❄️',
        '90': '⛈️', '91': '⛈️', '92': '🌧️', '93': '🌧️', '94': '⛈️', '95': '⛈️', '96': '⛈️'
    };
    return iconMap[String(iconCode)] || '🌤️';
}

function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return '';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${month}/${day}`;
}

async function fetchWeatherData() {
    try {
        const currentDiv = document.getElementById('current-weather');
        const generalDiv = document.getElementById('general-situation');
        const forecastDiv = document.getElementById('weather-info');
        const weatherError = document.getElementById('weather-error');

        const tbody = document.getElementById('current-weather-tbody');
        if (tbody) tbody.innerHTML = '';
        generalDiv.innerHTML = '';
        forecastDiv.innerHTML = '';
        weatherError.innerHTML = '';

        // Fetch current weather
        const currentResponse = await fetch(currentWeatherUrl);
        const currentData = await currentResponse.json();

        if (currentData && currentData.temperature && currentData.temperature.data) {
            const tempData = currentData.temperature.data[0];
            const humidityData = currentData.humidity ? currentData.humidity.data[0] : null;
            const rainfallMax = currentData.rainfall && currentData.rainfall.data
                ? Math.max(...currentData.rainfall.data.map(item => item.max || 0))
                : 0;

            // Determine emoji based on temperature
            let emoji = '🌤️'; // default
            const temp = parseFloat(tempData.value);
            if (temp >= 30) {
                emoji = '🔥';
            } else if (temp >= 25) {
                emoji = '☀️';
            } else if (temp >= 20) {
                emoji = '🌤️';
            } else if (temp >= 15) {
                emoji = '⛅';
            } else if (temp >= 10) {
                emoji = '🌥️';
            } else {
                emoji = '❄️';
            }

            document.getElementById('current-weather-emoji').textContent = emoji;

            const tbody = document.getElementById('current-weather-tbody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tempData.value}°C</td>
                <td>${humidityData ? humidityData.value + '%' : '-'}</td>
                <td>${rainfallMax}mm</td>
            `;
            tbody.appendChild(row);
        }

        // Fetch forecast data
        const forecastResponse = await fetch(forecastWeatherUrl);
        const forecastData = await forecastResponse.json();

        if (!forecastData || !forecastData.weatherForecast) {
            weatherError.textContent = '無法獲取天氣資料。';
            return;
        }

        // Display general situation
        if (forecastData.generalSituation) {
            const generalCard = document.createElement('p');
            generalCard.textContent = forecastData.generalSituation;
            generalDiv.appendChild(generalCard);
        }

        // Display forecast cards (first 4 days)
        const forecasts = forecastData.weatherForecast.slice(0, 4);
        
        forecasts.forEach(forecast => {
            const card = document.createElement('div');
            card.className = 'forecast-card';
            
            const icon = getWeatherIcon(forecast.ForecastIcon);
            const date = formatDate(forecast.forecastDate);
            const maxTemp = forecast.forecastMaxtemp.value;
            const minTemp = forecast.forecastMintemp.value;
            const maxRh = forecast.forecastMaxrh.value;
            const minRh = forecast.forecastMinrh.value;
            const psr = forecast.PSR || '-';
            
            card.innerHTML = `
                <div>
                    <div class="forecast-date">${date}</div>
                    <div class="forecast-day">${forecast.week}</div>
                    <div class="forecast-icon">${icon}</div>
                    <div class="forecast-temp">
                        <span class="temp-max">${maxTemp}°C</span>
                        <span style="margin: 0 0.3rem;">/</span>
                        <span class="temp-min">${minTemp}°C</span>
                    </div>
                    <div class="forecast-metrics">
                        <div class="metric-item">
                            <div class="metric-label">濕度</div>
                            <div class="metric-value">${maxRh}%</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">紫外線</div>
                            <div class="metric-value">${psr}</div>
                        </div>
                    </div>
                    <div class="forecast-weather-desc">${forecast.forecastWeather}</div>
                    <div class="forecast-wind">${forecast.forecastWind}</div>
                </div>
            `;
            
            forecastDiv.appendChild(card);
        });

    } catch (error) {
        document.getElementById('weather-error').textContent = '發生錯誤: ' + error.message;
    }
}

function updateDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    const dateTimeStr = `${year}年${month}月${day}日 ${hour}時${minute}分${second}秒`;
    document.getElementById('datetime-text').textContent = dateTimeStr;
}

function updateRefreshCountdown() {
    const countdownDiv = document.getElementById('refresh-countdown');
    if (!countdownDiv || !window.lastTrainUpdate) return;

    const now = Date.now();
    const trainRefreshInterval = 30000;
    const timeSinceTrainUpdate = now - window.lastTrainUpdate;
    const timeUntilTrainRefresh = trainRefreshInterval - timeSinceTrainUpdate;

    if (timeUntilTrainRefresh > 0) {
        const seconds = Math.ceil(timeUntilTrainRefresh / 1000);
        countdownDiv.textContent = `下次更新: ${seconds} 秒`;
    } else {
        countdownDiv.textContent = '更新中...';
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);
setInterval(updateRefreshCountdown, 1000);

fetchTrainData();
fetchWeatherData();

setInterval(fetchTrainData, 30000);
setInterval(fetchWeatherData, 600000); // Update every 10 minutes

// Create floating particles for background animation
function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random size between 20px and 80px
    const size = Math.random() * 60 + 20;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random horizontal position
    particle.style.left = `${Math.random() * 100}%`;
    
    // Random animation duration between 15 and 30 seconds
    const duration = Math.random() * 15 + 15;
    particle.style.animationDuration = `${duration}s`;
    
    // Random delay
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    document.body.appendChild(particle);
    
    // Remove particle after animation completes
    setTimeout(() => {
        particle.remove();
    }, (duration + 5) * 1000);
}

// Create initial particles
for (let i = 0; i < 15; i++) {
    setTimeout(() => createParticle(), i * 200);
}

// Continuously create new particles
setInterval(() => {
    createParticle();
}, 2000);
