const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;

const TELEGRAM_BOT_TOKEN = "6894974714:AAEbOAZb0Oz1q8uXvMD6FqIAX1oTAZaZU7g";
const TELEGRAM_CHAT_ID = "1026814070";

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files (your HTML file)
app.use(express.static("public"));

app.post("/storeData", async (req, res) => {
  const { userInput } = req.body;
  console.log("Received user input:", userInput);

  // Format the message for Telegram
  const message = `Received user input: ${JSON.stringify(userInput)}`;

  // Send the message to the Telegram bot
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
