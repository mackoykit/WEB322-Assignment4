/********************************************************************************
 *  WEB322 – Assignment 06
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Mark Anthony Sebastian Student ID: 140566225 Date: 11/05/2024
 * 
 ********************************************************************************/
const express = require("express");
const path = require("path");
const {
  getAllSubRegions,
  addCountry,
  deleteCountry,
} = require("./modules/country-service");

const countryData = require("./modules/country-service");
const authData = require("./modules/auth-service");

const clientSessions = require("client-sessions");

const app = express();
const PORT = process.env.PORT || 8080;

const Sequelize = require("sequelize");

// Set up Sequelize to connect to PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(
  clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/addCountry", ensureLogin, (req, res) => {
  getAllSubRegions()
    .then((subRegions) => res.render("addCountry", { subRegions }))
    .catch((err) => res.render("500", { message: err }));
});

app.post("/addCountry", ensureLogin, (req, res) => {
  addCountry(req.body)
    .then(() => res.redirect("/countries"))
    .catch((err) => res.render("500", { message: err }));
});

app.get("/editCountry/:id", ensureLogin, async (req, res) => {
  const countryId = req.params.id;
  console.log(`Fetching country with ID: ${countryId}`);

  try {
    const country = await countryData.getCountryById(countryId);
    console.log("Country found:", country);

    if (!country) {
      console.log(`No country found for ID: ${countryId}`);
      return res
        .status(404)
        .render("404", { message: "Country not found", page: "/countries" });
    }

    const subRegions = await countryData.getAllSubRegions();
    console.log("Subregions fetched:", subRegions);

    res.render("editCountry", { country, subRegions });
  } catch (error) {
    console.error("Error fetching country:", error);
    res
      .status(500)
      .render("500", { message: `Error fetching country: ${error.message}` });
  }
});

app.post("/editCountry", ensureLogin, async (req, res) => {
  const {
    id,
    commonName,
    officialName,
    nativeName,
    capital,
    population,
    area,
    subRegionId,
    landlocked,
    languages,
    currencies,
    openStreetMaps,
    flag,
    coatOfArms,
  } = req.body;

  try {
    await countryData.editCountry(id, {
      commonName,
      officialName,
      nativeName,
      capital,
      population: parseInt(population),
      area: parseInt(area),
      subRegionId: parseInt(subRegionId),
      landlocked: landlocked === "on",
      languages,
      currencies,
      openStreetMaps,
      flag,
      coatOfArms,
    });

    res.redirect(`/countries/${id}`);
  } catch (error) {
    res.status(500).render("500", {
      message: `Error updating country: ${error.message}`,
      page: "/editCountry",
    });
  }
});

app.get("/deleteCountry/:id", ensureLogin, async (req, res) => {
  const countryId = req.params.id;
  try {
    await countryData.deleteCountry(countryId);
    res.redirect("/countries");
  } catch (error) {
    res.status(500).render("500", {
      message: `Error deleting country: ${error.message}`,
      page: "/countries",
    });
  }
});

// GET "/" route (Home page)
app.get("/", (req, res) => {
  res.render("home", { page: "/" });
});

// GET "/about" route
app.get("/about", (req, res) => {
  res.render("about", { page: "/about" });
});

// GET "/countries" route
app.get("/countries", async (req, res) => {
    const { region, subRegion } = req.query;
    try {
      let countries;
  
      // Add debug logging
      console.log("Query params:", { region, subRegion });
  
      if (region) {
        countries = await countryData.getCountriesByRegion(region);
      } else if (subRegion) {
        countries = await countryData.getCountriesBySubRegion(subRegion);
      } else {
        countries = await countryData.getAllCountries();
      }
  
      // Map the data properly
      countries = countries.map((country) => ({
        ...country.get({ plain: true }),
        region: country.SubRegion?.region,
        subRegion: country.SubRegion?.subRegion
      }));
  
      res.render("countries", { 
        countries: countries, 
        page: "/countries"
      });
    } catch (error) {
      console.error("Error:", error);
      res.render("500", {
        message: `Error fetching countries: ${error.message}`,
        page: "/countries",
      });
    }
  });

// GET "/countries/:id" route (View a single country)
app.get("/countries/:id", (req, res) => {
  const countryId = req.params.id;
  countryData
    .getCountryById(countryId)
    .then((country) => {
      if (country.SubRegion) {
        country.subRegion = country.SubRegion.subRegion;
        country.region = country.SubRegion.region;
      }
      res.render("country", { 
        country: country,
        page: '/countries' 
      });
    })
    .catch((error) =>
      res
        .status(404)
        .render("404", { message: "No country found with ID: " + countryId })
    );
});

// GET "/addCountry" route (Display add country form)
app.get("/addCountry", (req, res) => {
  getAllSubRegions()
    .then((subRegions) => res.render("addCountry", { subRegions }))
    .catch((err) => res.render("500", { message: err }));
});

app.post("/addCountry", (req, res) => {
  addCountry(req.body)
    .then(() => res.redirect("/countries"))
    .catch((err) => res.render("500", { message: err }));
});

app.get("/editCountry/:id", async (req, res) => {
  const countryId = req.params.id;
  console.log(`Fetching country with ID: ${countryId}`);

  try {
    const country = await countryData.getCountryById(countryId);
    console.log("Country found:", country);

    if (!country) {
      console.log(`No country found for ID: ${countryId}`);
      return res
        .status(404)
        .render("404", { message: "Country not found", page: "/countries" });
    }

    const subRegions = await countryData.getAllSubRegions();
    console.log("Subregions fetched:", subRegions);

    res.render("editCountry", { country, subRegions });
  } catch (error) {
    console.error("Error fetching country:", error);
    res
      .status(500)
      .render("500", { message: `Error fetching country: ${error.message}` });
  }
});

// Update the post route to use editCountry instead of updateCountry
app.post("/editCountry", async (req, res) => {
  const {
    id,
    commonName,
    officialName,
    nativeName,
    capital,
    population,
    area,
    subRegionId,
    landlocked,
    languages,
    currencies,
    openStreetMaps,
    flag,
    coatOfArms,
  } = req.body;

  try {
    await countryData.editCountry(id, {
      commonName,
      officialName,
      nativeName,
      capital,
      population: parseInt(population),
      area: parseInt(area),
      subRegionId: parseInt(subRegionId),
      landlocked: landlocked === "on",
      languages,
      currencies,
      openStreetMaps,
      flag,
      coatOfArms,
    });

    res.redirect(`/countries/${id}`);
  } catch (error) {
    res.status(500).render("500", {
      message: `Error updating country: ${error.message}`,
      page: "/editCountry",
    });
  }
});

// Route to handle deleting a country
app.get("/deleteCountry/:id", async (req, res) => {
  const countryId = req.params.id;
  try {
    await countryData.deleteCountry(countryId);
    res.redirect("/countries");
  } catch (error) {
    res.status(500).render("500", {
      message: `Error deleting country: ${error.message}`,
      page: "/countries",
    });
  }
});

// Updated Authentication Routes
app.get("/login", (req, res) => {
  res.render("login", { page: "/login", errorMessage: null });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/countries");
    })
    .catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName,
        page: "/login",
      });
    });
});

app.get("/register", (req, res) => {
  res.render("register", {
    page: "/register",
    errorMessage: null,
    successMessage: null,
  });
});

app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", {
        successMessage: "User created",
        errorMessage: null,
        page: "/register",
      });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        successMessage: null,
        userName: req.body.userName,
        page: "/register",
      });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// Custom 404 error page for undefined routes
app.use((req, res) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for",
    page: req.path,
  });
});

countryData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(PORT, function () {
      console.log(`app listening on: ${PORT}`);
    });
  })
  .catch(function (err) {
    console.log(`unable to start server: ${err}`);
  });