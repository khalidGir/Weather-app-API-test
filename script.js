// --- IMPORTANT ---
// PASTE YOUR OPENWEATHERMAP API KEY HERE
const apiKey = "59570522796c8df94e01f36c42289504"; 
// -----------------

const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

// Get references to DOM elements
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const weatherIcon = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const cityNameEl = document.getElementById('city-name');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const weatherDisplay = document.getElementById('weather-display');
const errorDisplay = document.getElementById('error-display');

// NEW: Forecast elements
const forecastContainer = document.getElementById('forecast-cards');
let temperatureChart; // For the hourly chart

// NEW: Default city
let userCity = "Addis Ababa";

// NEW: Utility function for weather icons
function getWeatherIcon(condition) {
    const iconMap = {
        "Clear": "fas fa-sun",
        "Clouds": "fas fa-cloud",
        "Rain": "fas fa-cloud-rain",
        "Drizzle": "fas fa-cloud-drizzle",
        "Thunderstorm": "fas fa-bolt",
        "Snow": "fas fa-snowflake",
        "Mist": "fas fa-smog",
        "Smoke": "fas fa-smoke",
        "Haze": "fas fa-smog",
        "Dust": "fas fa-wind",
        "Fog": "fas fa-fog",
        "Sand": "fas fa-wind",
        "Ash": "fas fa-volcano",
        "Squall": "fas fa-wind",
        "Tornado": "fas fa-tornado"
    };
    return iconMap[condition] || "fas fa-cloud";
}

// NEW: Update weather UI
function updateWeatherUI(data) {
    cityNameEl.innerHTML = data.name;
    temperatureEl.innerHTML = Math.round(data.main.temp) + "°c";
    humidityEl.innerHTML = data.main.humidity + "%";
    windSpeedEl.innerHTML = data.wind.speed + " km/h";
    weatherIcon.src = "https://i.ibb.co/" + getWeatherIcon(data.weather[0].main);
    
    weatherDisplay.style.display = "block";
    errorDisplay.style.display = "none";
}

// NEW: Update forecast UI
function updateForecastUI(data) {
    forecastContainer.innerHTML = '';
    const dailyForecasts = data.list.filter((item, index) => index % 8 === 0);
    
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        forecastCard.innerHTML = `
            <div class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <i class="${getWeatherIcon(day.weather[0].main)}"></i>
            <div class="forecast-temp">${Math.round(day.main.temp)}°c</div>
            <div class="forecast-condition">${day.weather[0].main}</div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
    
    createHourlyChart(data);
}

// NEW: Create hourly chart
function createHourlyChart(forecastData) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    
    const hourlyData = forecastData.list.slice(0, 8);
    const labels = hourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    });
    
    const temperatures = hourlyData.map(item => Math.round(item.main.temp));
    
    if (temperatureChart) {
        temperatureChart.destroy();
    }
    
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointRadius: 4,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#fff' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

// NEW: Update background based on weather
function updateBackground(weatherCondition) {
    document.body.className = '';
    document.body.classList.add(weatherCondition.toLowerCase());
    
    const hour = new Date().getHours();
    if (hour < 6 || hour > 18) {
        document.body.classList.add('night');
    }
}

// NEW: Geolocation function
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const geoResponse = await fetch(
                        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
                    );
                    const geoData = await geoResponse.json();
                    
                    if (geoData.length > 0) {
                        userCity = geoData[0].name;
                        checkWeather(userCity);
                    }
                } catch (error) {
                    console.error("Geolocation error:", error);
                    checkWeather(userCity);
                }
            },
            (error) => {
                console.log("Geolocation not allowed, using default city");
                checkWeather(userCity);
            }
        );
    } else {
        checkWeather(userCity);
    }
}

// UPDATED: Main weather function
async function checkWeather(city) {
    try {
        temperatureEl.innerHTML = "Loading...";
        
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(apiUrl + city + `&appid=${apiKey}`),
            fetch(forecastUrl + city + `&appid=${apiKey}`)
        ]);
        
        if (!weatherResponse.ok) throw new Error('City not found');
        
        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();
        
        updateWeatherUI(weatherData);
        updateForecastUI(forecastData);
        updateBackground(weatherData.weather[0].main);
        
    } catch (error) {
        errorDisplay.style.display = "block";
        weatherDisplay.style.display = "none";
    }
}

// Event listener (keep this as is)
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = cityInput.value;
    if (city) {
        checkWeather(city);
    }
});

// REPLACE the original checkWeather call with:
getLocation();
