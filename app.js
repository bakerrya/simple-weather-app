const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

/* I understand storing API keys in codebase is bad practice.
   Typically, keys would be stored and accessed from where the app is hosted. */
const apiKey = "9LCzOKA7Ae7AK7CwJ5AX8sZjr8jc3eTj";

app.get('/', (req, res) => {
    res.render('index', { error: null, weatherData: null });
});

app.post('/submit-city', async (req, res) => {
    const city = req.body.location;

    if (!city) {
        return res.status(400).json({ error: "City name is required!!" });
    }

    try {
        const locationData = await getLocationKey(city);

        if (!locationData.locationKey) {
            return res.render('index', { weatherData: null, error: `No data found for city: ${city}. Please check the city name.` });
        }

        const weatherData = await getWeatherData(locationData.locationKey);
        weatherData[0].localizedName = locationData.localizedName;

        return res.render('index', { weatherData, error: null });
    } catch (error) {
        res.render('index', { weatherData: null, error: "Failed to retrieve data. Please try again later." });
    }
});

// This function uses the current conditions API to fetch weather data for a specific city by providing a location key
async function getWeatherData(locationKey) {
    try {
        const response = await fetch(`http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        return responseData;

    } catch (error) {
        console.error("Error in retrieving weather data: ", error);
        throw error;
    }
}

// This function uses the text search API provided by AccuWeather to retrieve the location key for a given city name
async function getLocationKey(city) {
    const url = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(city)}&language=en-us&details=false`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();

        // Extract information from the first match returned
        const firstCity = responseData[0];
        const locationKey = firstCity?.Key;
        const localizedName = firstCity?.LocalizedName;

        return { locationKey, localizedName };
    } catch (error) {
        console.error("Error in getLocationKey:", error);
        throw error;
    }
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
