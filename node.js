const express = require("express");
const bodyParser = require("body-parser");
const africastalking = require("africastalking");
const mongoose = require("mongoose");

//connect to mongodb atlas
mongoose
  .connect(
    "mongodb+srv://Saitabau:%23Saitabau28@atlascluster.vczjtel.mongodb.net/"
  )
  .catch((error) => console.error(error));

// Define a schema for the appointments
const saccoSchema = new mongoose.Schema({
  name: String,
  idNumber: String,
  phoneNumber: String,
  pin: String,
});

// Create a model for the appointments
const Sacco = mongoose.model("Sacco", saccoSchema);

const LoanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sacco',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const Loan = mongoose.model('Loan', LoanSchema);

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
let sacco = {};

app.post("/ussd", async (req, res) => {
  let response = "";
  let { sessionId, serviceCode, phoneNumber, text } = req.body;
  console.log(`Received a request for session: ${sessionId}`); // Log the session ID
   
  let parts = text.split("*");

  if (parts[0] === "") {
    // New session, show initial options
    return res.send(
      "CON Hi there, welcome to Optimum Sacco\n1. View your account\n2. Register"
    );
  } else if (parts[0] === "1") {
    // View Account
    if (!parts[1]) {
      // Ask for PIN
      return res.send("CON Enter your PIN:");
    } else if (!parts[2]) {
      // Validate PIN and show options
      const user = await Sacco.findOne({ pin: parts[1] });
      if (user) {
        // User found, show account details
        return res.send(
          `CON Welcome ${user.name} \n1. Check Saving Statement\n2. Predict What to Save\n3. Start Saving\n4. Get Loan`
        );
      } else {
        return res.send("END Invalid PIN");
      }
    } else if (parts[2] === "3") {
      // Get Loan
      if (!parts[3]) {
        // Ask for loan amount
        return res.send("CON Enter loan amount:");
      } else {
        // Save loan to database and show confirmation
        const user = await Sacco.findOne({ pin: parts[1] }); // Retrieve user again
        if (user) {
          const newLoan = new Loan({
            userId: user._id,
            amount: parts[3],
          });
          await newLoan.save();
          return res.send("END Your loan request has been received.");
        } else {
          return res.send("END User not found."); // Handle case where user is not found
        }
      }
    }
  } else if (parts[0] === "2") {
    // Register
    if (!parts[1]) {
      // Ask for name
      return res.send("CON Enter your name:");
    } else if (!parts[2]) {
      // Ask for ID number
      return res.send("CON Enter your ID number:");
    } else if (!parts[3]) {
      // Ask for phone number
      return res.send("CON Enter your phone number:");
    } else if (!parts[4]) {
      // Ask for PIN
      return res.send("CON Set your PIN:");
    } else {
      // Save user to database and show options
      const newUser = new Sacco({
        name: parts[1],
        idNumber: parts[2],
        phoneNumber: phoneNumber,
        pin: parts[4],
      });
      await newUser.save();
      // Send SMS
      if (
        newUser.phoneNumber &&
        /^(\+\d{1,3})?\d{10}$/.test(phoneNumber)
      ) {
        const smsOptions = {
          to: [
            newUser.phoneNumber.startsWith("+")
              ? phoneNumber
              : "+254" + phoneNumber.slice(-9),
          ],
          message: `Hello ${newUser.name}, welcome to Optimum Sacco. You have successfully registered!`,
        };
        sms
          .send(smsOptions)
          .then((response) => console.log(response))
          .catch((error) => console.error(error));
      } else {
        console.error("Invalid phone number");
      }
      return res.send(
        "CON You have successfully registered"
      );
    }
  }
  res.set("Content-Type:text/plain");
  return res.send(response);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
