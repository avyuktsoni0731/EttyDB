const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const CryptoJS = require("crypto-js");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const SECRET_KEY = "key";
const TELEGRAM_BOT_TOKEN = "6894974714:AAEbOAZb0Oz1q8uXvMD6FqIAX1oTAZaZU7g";
const TELEGRAM_BOT_TOKEN_2 = "6939916007:AAF5h7hwD2-E8YVWXSO9SWii20-wAQIovVQ";
const TELEGRAM_CHAT_ID = "-1002209368311";
const url =
  "mongodb+srv://stk_as:sarthakavyukt@ettydb.zx8rijw.mongodb.net/?retryWrites=true&w=majority&appName=EttyDB"; // Replace with your MongoDB server URL if it's different
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = client.db("EttyDB");
const collection = db.collection("test");

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

    //MongoDB
    await client.connect();
    console.log("Connected successfully to server");

    const insertResult = await collection.insertOne({
      chat_id: TELEGRAM_CHAT_ID,
      text_id: decryptedData[0]["id"],
      text: decryptedData,
    });
    //
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
  } catch (error) {
    console.error("Error storing data:", error);
    res.status(500).send("Failed to store data");
  } finally {
    await client.close();
    console.log("Server closed");
  }
});

app.get("/fetchData", async (req, res) => {
  try {
    const resultDict = {};
    const findResult = collection.find({ chat_id: TELEGRAM_CHAT_ID });
    await findResult.forEach((doc) => {
      const text_id = doc.text_id;
      if (!resultDict[text_id]) {
        resultDict[text_id] = {};
      }
      doc.text.forEach((item) => {
        resultDict[text_id][item.type] = item.value;
      });
    });

    console.log("Filtered entries:", resultDict);
    res.status(200).json(resultDict);
  } catch (error) {
    console.error("Error fetching data from Telegram:", error);
    res.status(500).send("Failed to fetch data from Telegram");
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});

app.get("/editData", async (req, res) => {
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
      console.log('Raw data from Telegram:', data);

      const messages = data.result
      .filter(update => (update.channel_post && update.channel_post.text) || (update.edited_channel_post && update.edited_channel_post.text))
      .map(update => {
        if (update.channel_post) {
          return update.channel_post.text;
        } else if (update.edited_channel_post) {
          return update.edited_channel_post.text;
        }
      })
      .filter(text => {
        try {
          JSON.parse(text);
          return true;
              } catch (e) {
                  return false;
              }
          });

      console.log('Filtered messages:', messages);

      const entries = messages.reduce((acc, message) => {
          const data = JSON.parse(message);
          data.forEach(item => {
              if (!acc[item.id]) {
                  acc[item.id] = {};
              }
              acc[item.id][item.type] = item.value;
          });
          return acc;
      }, {});

      console.log('Processed entries:', entries);

      res.status(200).json(entries);
  } catch (error) {
      console.error("Error fetching data from Telegram:", error);
      res.status(500).send("Failed to fetch data from Telegram");
  }
});