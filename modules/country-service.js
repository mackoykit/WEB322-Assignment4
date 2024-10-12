/********************************************************************************
 *  WEB322 – Assignment 02
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: ____Honer Mina____ Student ID: ___142518232___ Date: _____30/09/2024___
 *
 ********************************************************************************/

// country-service.js

const countryData = require("../data/countryData");
const subRegionData = require("../data/subRegionData");

let countries = [];

// Initialize function to populate countries array
function initialize() {
  return new Promise((resolve, reject) => {
    try {
      countries = countryData.map((country) => {
        const subRegionObj = subRegionData.find(
          (subRegion) => subRegion.id === country.subRegionId
        );
        return {
          ...country,
          subRegionObj: subRegionObj || null,
        };
      });
      resolve(); // Resolve when the countries array is populated
    } catch (error) {
      reject("Error initializing countries: " + error.message);
    }
  });
}

// Get all countries
function getAllCountries() {
  return new Promise((resolve, reject) => {
    if (countries.length > 0) {
      resolve(countries);
    } else {
      reject("No countries found");
    }
  });
}

// Get countries by ID
function getCountryById(id) {
  return new Promise((resolve, reject) => {
    const country = countries.find((country) => country.id === id);
    if (country) {
      resolve(country);
    } else {
      reject("Unable to find requested country");
    }
  });
}

// Get countries by subRegion
function getCountriesBySubRegion(subRegion) {
  return new Promise((resolve, reject) => {
    const lowerCaseSubRegion = subRegion.toLowerCase();
    const filteredCountries = countries.filter(
      (country) =>
        country.subRegionObj &&
        country.subRegionObj.subRegion
          .toLowerCase()
          .includes(lowerCaseSubRegion)
    );

    if (filteredCountries.length > 0) {
      resolve(filteredCountries);
    } else {
      reject("Unable to find requested countries");
    }
  });
}

// Get countries by region
function getCountriesByRegion(region) {
  return new Promise((resolve, reject) => {
    const lowerCaseRegion = region.toLowerCase();
    const filteredCountries = countries.filter(
      (country) =>
        country.subRegionObj &&
        country.subRegionObj.region.toLowerCase().includes(lowerCaseRegion)
    );

    if (filteredCountries.length > 0) {
      resolve(filteredCountries);
    } else {
      reject("Unable to find requested countries");
    }
  });
}

// Exporting functions
module.exports = {
  initialize,
  getAllCountries,
  getCountryById,
  getCountriesBySubRegion,
  getCountriesByRegion,
};
