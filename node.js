const express = require("express");
const bodyParser = require("body-parser");
const africastalking = require("africastalking");
const mongoose = require("mongoose");

//connect to mongodb atlas
mongoose.connect(
  "mongodb+srv://Saitabau:%23Saitabau28@atlascluster.vczjtel.mongodb.net/"
);
// Define a schema for the appointments
const appointmentSchema = new mongoose.Schema({
  location: String,
  name: String,
  phoneNumber: String,
  date: String,
  time: String,
});

// Create a model for the appointments
const Appointment = mongoose.model("Appointment", appointmentSchema);

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
      let appointment = new Appointment({
        location: parts[1],
        name: parts[2],
        phoneNumber: enteredPhoneNumber,
        date: parts[4],
        time: parts[5],
      });
      // Store the appointment in the database
      try {
        await appointment.save();
        console.log("Appointment stored in MongoDB Atlas");
      } catch (err) {
        console.error(err);
      }

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
      // User entered their phone number
      const enteredPhoneNumber = parts[1];
      try {
        const appointments = await Appointment.find({
          phoneNumber: enteredPhoneNumber,
        });
        if (appointments.length === 0) {
          response = `END You have no appointments.`;
        } else {
          let appointmentStrings = appointments.map((appointment) => {
            return `Date: ${appointment.date}, Time: ${appointment.time}`;
          });
          response = `END Your appointments:\n${appointmentStrings.join("\n")}`;
        }
      } catch (err) {
        console.error(err);
        response = `END An error occurred while fetching your appointments.`;
      }
    }
  }
  res.set("Content-Type: text/plain");
  res.send(response);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
