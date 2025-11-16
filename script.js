const apiUrl = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=ISL&sta=HFC&lang=TC';

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

        // Update time
        const currentTimeStr = json.curr_time || json.sys_time;
        const currentTime = new Date(currentTimeStr);
        updateP.textContent = `最後更新: ${currentTimeStr}`;

        // Function to calculate minutes
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

        // UP direction
        if (data.UP && data.UP.length > 0) {
            data.UP.forEach(train => {
                const mins = calculateMins(train.time);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${train.seq}</td>
                    <td>${train.time}</td>
                    <td>${mins}</td>
                `;
                upTbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3">目前沒有上行列車資訊</td>';
            upTbody.appendChild(row);
        }

        // DOWN direction
        if (data.DOWN && data.DOWN.length > 0) {
            data.DOWN.forEach(train => {
                const mins = calculateMins(train.time);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${train.seq}</td>
                    <td>${train.time}</td>
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

// Fetch data on load
fetchTrainData();

// Refresh every 30 seconds
setInterval(fetchTrainData, 30000);

