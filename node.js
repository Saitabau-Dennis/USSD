const express = require("express");
const bodyParser = require("body-parser");
const africastalking = require("africastalking");

// Initialize Africa's Talking SDK
const options = {
  apiKey: "deae18f681434f31c0232bd2957f305a3dcc045cf570ba71dc7acc525a193053",
  username: "appointment",
};
const AfricasTalking = africastalking(options);
const sms = AfricasTalking.SMS;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Store appointments in memory for simplicity
const appointments = {};

app.post("/ussd", async (req, res) => {
  let { sessionId, serviceCode, phoneNumber, text } = req.body;
  console.log(`Received a request for session: ${sessionId}`); // Log the session ID
  let response = "";
  let parts = text.split("*");

  if (text === "") {
    // This is the first request
    response = `CON Welcome to PetCare Clinic. Choose an option:
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
      // Get the phone number entered by the user
      const enteredPhoneNumber = parts[3];
      appointments[enteredPhoneNumber] = {
        location: parts[1],
        name: parts[2],
        phoneNumber: enteredPhoneNumber,
        date: parts[4],
        time: parts[5],
      };

      // Send an SMS to the user
      const message = `Hello ${parts[2]}, you have successfully booked an appointment on ${parts[4]} at ${parts[5]}.`;
      sms
        .send({ to: enteredPhoneNumber, message: message })
        .then((response) => console.log(response))
        .catch((error) => console.log(error));

      response = `END Your appointment has been booked!`;
    }
  } else if (parts[0] === "2") {
    // User is viewing their appointment
    if (parts.length === 1) {
      response = `CON Enter your phone number:`;
    } else if (parts.length === 2) {
      const enteredPhoneNumber = parts[1];
      console.log("Entered phone number:", enteredPhoneNumber);
      console.log("Stored appointments:", appointments);
      if (appointments[enteredPhoneNumber]) {
        // User has an appointment
        const appointment = appointments[enteredPhoneNumber];
        response = `END Your appointment details:\nDate: ${appointment.date}\nTime: ${appointment.time}`;
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
