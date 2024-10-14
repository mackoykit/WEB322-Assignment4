/********************************************************************************
 *  WEB322 – Assignment 03
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: ____Honer Mina____ Student ID: ___142518232___ Date: _____14/10/2024___
 *
 ********************************************************************************/

const countryData = require("./modules/country-service"); // Ensure the correct path
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(__dirname + "/public"));

app.set("views", __dirname + "/views");

// GET "/" route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/home.html"));
});

// GET "/about" route
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views/about.html"));
});

// GET "/countries" route
app.get("/countries", (req, res) => {
  const { region, subRegion } = req.query;

  if (region) {
    countryData
      .getCountriesByRegion(region)
      .then((countries) => res.json(countries))
      .catch((error) => res.status(404).send(error));
  } else if (subRegion) {
    countryData
      .getCountriesBySubRegion(subRegion)
      .then((countries) => res.json(countries))
      .catch((error) => res.status(404).send(error));
  } else {
    countryData
      .getAllCountries()
      .then((countries) => res.json(countries))
      .catch((error) => res.status(404).send(error));
  }
});

// GET "/countries/:id" route
app.get("/countries/:id", (req, res) => {
  const countryId = req.params.id;
  countryData
    .getCountryById(countryId)
    .then((country) => res.json(country))
    .catch((error) => res.status(404).send(error));
});

// Custom 404 error page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views/404.html"));
});

// Initialize country data before starting the server
countryData
  .initialize()
  .then(() => {
    console.log("Countries initialized successfully");

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize countries:", error);
  });
