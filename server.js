const express = require('express');
const app = express();
const port = process.env.PORT || 5002

const axios = require('axios');
const { parseString } = require('xml2js');
const mongoose = require('mongoose');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Connect to MongoDB (replace 'your_database_url' with your actual MongoDB connection string)
mongoose.connect('mongodb+srv://barbara:feldon@cluster0.6ixp9nq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema for your data
const dataSchema = new mongoose.Schema({
  // Define the structure of your data
  // Adjust this according to the actual structure of the XML response
  HighlandVoltage: String,
  // Add more fields as needed
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
        // Create a new document based on the parsed XML data
        const newData = new Data({
          HighlandVoltage: result.i.HighlandVoltage[0], // Adjust the field names based on your XML structure
          // Add more fields as needed
        });
        const strippedResult = result.replaceAll(" Vdc ", "");
        console.log(strippedResult)
        // Save the document to the database
        await newData.save();
        console.log('Data saved to the database:', newData);
      }
    });
  } catch (error) {
    console.error('Error making API call:', error.message);
  }
}

// Set an interval to make API call every 1 minute (60,000 milliseconds)
setInterval(makeApiCall, 60000);


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});