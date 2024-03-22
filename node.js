const express = require('express');
const bodyParser = require('body-parser');
const africastalking = require('africastalking');

// Initialize Africa's Talking SDK
const options = {
    apiKey: 'bfaac7b9b7f99e500fcfad8a04a2312d1a56383279ee6923d8a81bbe343d874f',         
    username: 'appointment',
};
const AfricasTalking = africastalking(options);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/ussd', (req, res) => {
    let { sessionId, serviceCode, phoneNumber, text } = req.body;
    let response = '';
    console.log('text:', text); 
    let parts = text.split('*');
    console.log('parts:', parts);
    if (text === '') {
        // This is the first request
        response = `CON Welcome to Vet Booking. Choose an option:
        1. Book an appointment
        2. See your appointment`;
    } else if (parts.length === 1) {
        // User selected 1. Book an appointment
        response = `CON Enter your location:`;
    } else if (parts.length === 2) {
        // User entered location
        response = `CON Enter your name:`;
    } else if (parts.length === 3) {
        // User entered name
        response = `CON Enter your number:`;
    } else if (parts.length === 4) {
        // User entered email
        response = `CON Enter your preferred appointment date (DD-MM-YYYY):`;
    } else if (parts.length === 5) {
        // User entered appointment date
        response = `CON Enter your preferred appointment time (HH:MM):`;
    } else if (parts.length === 6) {
        // User entered appointment time
        response = `END Your appointment has been booked!`;
    }

    res.set('Content-Type: text/plain');
    res.send(response);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});