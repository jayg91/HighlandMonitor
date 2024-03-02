const moment = require('moment-timezone');

const express = require('express');
const app = express();
const port = process.env.PORT || 5002

const axios = require('axios');
const { parseString } = require('xml2js');
const xml2js = require('xml2js');
const mongoose = require('mongoose');
const { Double, Decimal128 } = require('mongodb');

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://barbara:feldon@cluster0.6ixp9nq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema for your data
const dataSchema = new mongoose.Schema({
  // Define the structure of your data
  // Adjust this according to the actual structure of the XML response
  HighlandVoltage: Number,
  // Add more fields as needed
  Date: Date,
});

// Create a model based on the schema
const Data = mongoose.model('Data', dataSchema);

// Set the API endpoint URL
const apiUrl = 'http://166.164.227.184/UHCapi.xml?cmd=adc&HighlandVoltage';

// Function to make API call, decode XML response, and save to database
async function makeApiCall() {
  try {
    // Make the API call
    const response = await axios.get(apiUrl);

    // Parse the XML response
    parseString(response.data, async (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err.message);
      } else {
        //Formatting Current Date/Time
        const currentDate = new Date();
        const timeZone = 'US/Pacific';

        const convertedDate = moment(currentDate).tz(timeZone);
        console.log(convertedDate)

        //Converting Voltage from String to Double "12.00 Vdc => 12.00"
        const numericVoltage = parseFloat(result.i.HighlandVoltage[0].match(/[\d.]+/)[0]);
        console.log(numericVoltage)

        // Create a new document based on the parsed XML data
        const newData = new Data({
          HighlandVoltage: numericVoltage, // Adjust the field names based on your XML structure
          // Add more fields as needed
          Date: convertedDate,
        });

        // Save the document to the database
        await newData.save();
        console.log('Data saved to the database:', newData);
      }
    });
  } catch (error) {
    console.error('Error making API call:', error.message);
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

//API Endpoint to retrieve and export data as XML
app.get('/api/data/getVoltage', async (req, res) => {
  try {
    const voltageData = await Data.find({});
    res.json(voltageData);
  } catch (error) {
    console.error('Error: ', error);
  }
});

// Set an interval to make API call every 1 minute (60,000 milliseconds)
setInterval(makeApiCall, 3600000);


app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});