/********************************************************************************
 *  WEB322 – Assignment 05
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
const Sequelize = require('sequelize');
const app = express();
require('pg');
const PORT = process.env.PORT || 8080;

// Sequelize connection configuration
const sequelize = new Sequelize('neondb', 'neondb_owner', '6QfOgmkAPu1p', {
    host: 'ep-muddy-star-a509cja9-pooler.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false },
    },
});

// Test database connection
sequelize
    .authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
    })
    .catch((err) => {
        console.log('Unable to connect to the database:', err);
    });

// Express middleware setup
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/viewData", (req, res) => {
    let someData = {
        name: "Mark",
        age: 37,
        occupation: "Student",
        company: "Seneca Polytechnic",
    };
    res.render("viewData", {
        data: someData,
    });
});

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/addCountry", (req, res) => {
    countryData.getAllSubRegions()
        .then(subRegions => {
            res.render("addCountry", { subRegions: subRegions });
        })
        .catch(err => {
            res.render("500", { message: `Error: ${err}` });
        });
});

app.post("/addCountry", (req, res) => {
    countryData.addCountry(req.body)
        .then(() => {
            res.redirect("/countries");
        })
        .catch(err => {
            res.render("500", { message: `Error: ${err}` });
        });
});

app.get("/countries", (req, res) => {
    const { region, subRegion } = req.query;
    let countryPromise;

    if (region) {
        countryPromise = countryData.getCountriesByRegion(region);
    } else if (subRegion) {
        countryPromise = countryData.getCountriesBySubRegion(subRegion);
    } else {
        countryPromise = countryData.getAllCountries();
    }

    countryPromise
        .then(countries => {
            const enhancedCountries = countries.map(country => ({
                ...country.get({ plain: true }),
                region: country.SubRegion?.region,
                subRegion: country.SubRegion?.subRegion
            }));
            res.render("countries", { countries: enhancedCountries });
        })
        .catch(error => {
            const message = region ? `No countries found for region: ${region}` :
                          subRegion ? `No countries found for sub-region: ${subRegion}` :
                          "No countries found";
            res.status(404).render("404", { message });
        });
});

app.get("/countries/:id", (req, res) => {
    const countryId = req.params.id;
    countryData.getCountryById(countryId)
        .then(country => {
            const enhancedCountry = {
                ...country.get({ plain: true }),
                region: country.SubRegion?.region,
                subRegion: country.SubRegion?.subRegion
            };
            res.render("country", { country: enhancedCountry });
        })
        .catch(error => {
            res.status(404).render("404", { 
                message: "No country found with ID: " + countryId 
            });
        });
});

// Route to edit a country
app.get("/editCountry/:id", (req, res) => {
    const countryId = req.params.id;
    countryData.getCountryById(countryId)
        .then(country => {
            if (!country) {
                throw new Error("Country not found");
            }
            // Fetch all sub-regions
            return countryData.getAllSubRegions()
                .then(subRegions => {
                    res.render("editCountry", { 
                        country: country.get({ plain: true }), 
                        subRegions: subRegions 
                    });
                });
        })
        .catch(error => {
            res.status(404).render("404", { 
                message: "No country found with ID: " + countryId 
            });
        });
});

app.post("/editCountry/:id", (req, res) => {
    const countryId = req.params.id;
    countryData.updateCountry(countryId, req.body)
        .then(() => {
            res.redirect("/countries");
        })
        .catch(err => {
            res.render("500", { message: `Error: ${err}` });
        });
});

app.get("/deleteCountry/:id", (req, res) => {
    countryData.deleteCountry(req.params.id)
        .then(() => {
            res.redirect("/countries");
        })
        .catch(err => {
            res.render("500", { message: `Error: ${err}` });
        });
});

app.use((req, res) => {
    res.status(404).render("404", {
        message: "I'm sorry, we're unable to find what you're looking for",
    });
});

countryData.initialize()
    .then(() => {
        console.log("Countries initialized successfully");
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to initialize countries:", error);
    });
