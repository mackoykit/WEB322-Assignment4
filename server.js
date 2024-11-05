/********************************************************************************
 *  WEB322 – Assignment 03
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Mark Anthony Sebastian Student ID: 140566225 Date: 11/05/2024
 * 
 ********************************************************************************/

const countryData = require("./modules/country-service");
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.set("views", __dirname + "/views");

app.use(express.static(__dirname + "/public"));

app.get("/viewData", function (req, res) {
  let someData = {
    name: "Honer",
    age: 46,
    occupation: "Student",
    company: "Seneca Polytechnic",
  };

  res.render("viewData", {
    data: someData,
  });
});

// GET "/" route
app.get("/", (req, res) => {
  res.render("home");
});

// GET "/about" route
app.get("/about", (req, res) => {
  res.render("about");
});

// Example for the /countries route
app.get("/countries", (req, res) => {
  const { region, subRegion } = req.query;
  if (region) {
    countryData
      .getCountriesByRegion(region)
      .then((countries) => res.render("countries", { countries: countries }))
      .catch((error) =>
        res.status(404).render("404", {
          message: "No countries found for region: " + region,
        })
      );
  } else if (subRegion) {
    countryData
      .getCountriesBySubRegion(subRegion)
      .then((countries) => res.render("countries", { countries: countries }))
      .catch((error) =>
        res.status(404).render("404", {
          message: "No countries found for sub-region: " + subRegion,
        })
      );
  } else {
    countryData
      .getAllCountries()
      .then((countries) => res.render("countries", { countries: countries }))
      .catch((error) =>
        res.status(404).render("404", { message: "No countries found" })
      );
  }
});

// Example for the /countries/:id route
app.get("/countries/:id", (req, res) => {
  const countryId = req.params.id;
  countryData
    .getCountryById(countryId)
    .then((country) => {
      if (country.subRegionObj) {
        country.subRegion = country.subRegionObj.subRegion;
        country.region = country.subRegionObj.region;
      }
      res.render("country", { country: country });
    })
    .catch((error) =>
      res
        .status(404)
        .render("404", { message: "No country found with ID: " + countryId })
    );
});

// Custom 404 error page for undefined routes
app.use((req, res) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for",
  });
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