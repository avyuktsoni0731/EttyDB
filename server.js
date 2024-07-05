const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files (your HTML file)
app.use(express.static('public'));

// Endpoint to receive and store data
app.post('/storeData', (req, res) => {
    const { userInput } = req.body;
    console.log('Received user input:', userInput);

    // Process and store userInput in your database or other storage
    // For this example, we'll just log it

    res.status(200).send('Data stored successfully');
});

// Start server
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
