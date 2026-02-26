// Update the hybrid-loader.js file to load and reference the master_normalised.json file correctly.

// Assume the local environment is a development server
const isLocal = window.location.hostname === 'localhost';

// Base URL handling for loading the JSON file
const baseUrl = isLocal ? './path/to/local/' : 'https://your-deployed-url.com/path/to/deployed/';
const jsonFileUrl = `${baseUrl}master_normalised.json`;

// Function to load and process the JSON file
fetch(jsonFileUrl)
    .then(response => response.json())
    .then(data => {
        // Handle the loaded data
        console.log(data);
    })
    .catch(error => {
        console.error('Error loading JSON file:', error);
    });