const express = require("express");
const bodyParser = require("body-parser");
const africastalking = require("africastalking");

// Initialize Africa's Talking SDK
const options = {
  apiKey: "bfaac7b9b7f99e500fcfad8a04a2312d1a56383279ee6923d8a81bbe343d874f",
  username: "appointment",
};
const AfricasTalking = africastalking(options);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Store appointments in memory for simplicity
const appointments = {};

app.post("/ussd", (req, res) => {
  let { sessionId, serviceCode, phoneNumber, text } = req.body;
  let response = "";
  let parts = text.split("*");

  if (text === "") {
    // This is the first request
    response = `CON Welcome to Vet Booking. Choose an option:
        1. Book an appointment
        2. See your appointment`;
  } else if (parts[0] === "1") {
    // User is booking an appointment
    if (parts.length === 1) {
      response = `CON Enter your location:`;
    } else if (parts.length === 2) {
      response = `CON Enter your name:`;
    } else if (parts.length === 3) {
      response = `CON Enter your phone number:`;
    } else if (parts.length === 4) {
      response = `CON Enter your preferred appointment date (DD-MM-YYYY):`;
    } else if (parts.length === 5) {
      response = `CON Enter your preferred appointment time (HH:MM):`;
    } else if (parts.length === 6) {
      // User entered appointment time
      // Store the appointment details
      appointments[phoneNumber] = {
        location: parts[1],
        name: parts[2],
        phoneNumber: parts[3],
        date: parts[4],
        time: parts[5],
      };
      response = `END Your appointment has been booked!`;
    }
  }   else if (parts[0] === '2') {
        // User is viewing their appointment
        if (parts.length === 1) {
            response = `CON Enter your phone number:`;
        } else if (parts.length === 2) {
            const enteredPhoneNumber = parts[1];
            console.log('Entered phone number:', enteredPhoneNumber); 
            console.log('Stored appointments:', appointments); 
            if (appointments[enteredPhoneNumber]) {
                // User has an appointment
                const appointment = appointments[enteredPhoneNumber];
                response = `END Your appointment details:\nLocation: ${appointment.location}\nName: ${appointment.name}\nPhoneNumber: ${appointment.phoneNumber}\nDate: ${appointment.date}\nTime: ${appointment.time}`;
            } else {
                // User does not have an appointment
                response = `END You do not have any appointments.`;
            }
        }
    }

  res.set("Content-Type: text/plain");
  res.send(response);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
