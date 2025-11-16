const apiUrl = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=ISL&sta=HFC&lang=TC';
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
        '76': '☀️', '77': '☀️', '80': '🌧️', '81': '🌧️', '82': '⛈️', '85': '❄️'
    };
    return iconMap[String(iconCode)] || '🌤️';
}

async function fetchWeatherData() {
    try {
        const weatherDiv = document.getElementById('weather-info');
        const weatherError = document.getElementById('weather-error');

        weatherDiv.innerHTML = '';
        weatherError.innerHTML = '';

        const currentResponse = await fetch(currentWeatherUrl);
        const currentData = await currentResponse.json();

        if (currentData && currentData.temperature) {
            const temp = currentData.temperature.data[0];
            const humidity = currentData.humidity ? currentData.humidity.data[0] : null;

            let weatherIcon = '🌤️';
            if (currentData.icon && currentData.icon.length > 0) {
                weatherIcon = getWeatherIcon(currentData.icon[0]);
            }

            let rainfallInfo = '無降雨';
            if (currentData.rainfall && currentData.rainfall.data && currentData.rainfall.data.length > 0) {
                const rainfallData = currentData.rainfall.data;
                const maxRainfall = Math.max(...rainfallData.map(item => item.max || item.value || 0));
                if (maxRainfall > 0) {
                    rainfallInfo = `降雨: ${maxRainfall} 毫米`;
                }
            }

            const currentCard = document.createElement('div');
            currentCard.className = 'weather-card current-weather';
            currentCard.innerHTML = `
                <div class="weather-info-container">
                    <div class="weather-info-text">
                        <p><strong>溫度:</strong> ${temp.value}°C</p>
                        ${humidity ? `<p><strong>濕度:</strong> ${humidity.value}%</p>` : ''}
                        <p><strong>${rainfallInfo}</strong></p>
                    </div>
                    <div class="weather-icon-display">
                        ${weatherIcon}
                    </div>
                </div>
            `;
            weatherDiv.appendChild(currentCard);
        } else {
            weatherError.textContent = '無法獲取天氣資料。';
        }

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
    document.getElementById('current-datetime').textContent = dateTimeStr;
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
setInterval(fetchWeatherData, 300000);

