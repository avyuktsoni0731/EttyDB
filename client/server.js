const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const cors = require("cors");
const CryptoJS = require("crypto-js");
const { MongoClient } = require("mongodb");

require("dotenv").config();
app.use(cors());

const SECRET_KEY = process.env.SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_TOKEN_2 = process.env.TELEGRAM_BOT_TOKEN_2;
const url = process.env.MONGODB_URI;

const client = new MongoClient(`${url}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = client.db("EttyDB");
const collection = db.collection("test");

app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files from the "public" directory

app.get("/embed.js", (req, res) => {
  const chatId = req.query.chat_id;
  if (!chatId) {
    res.status(400).send("Chat ID is required");
    return;
  }

  const scriptContent = `
    // embed.js content
    document.addEventListener("DOMContentLoaded", function() {
      console.log("Embed script loaded with chat ID: ${chatId}");
      window.TELEGRAM_CHAT_ID = "${chatId}";
    });
  `;

  res.setHeader("Content-Type", "application/javascript");
  res.send(scriptContent);
});

app.post("/storeData", async (req, res) => {
  console.log("Received request to /storeData");

  if (!req.body || !req.body.data) {
    console.error("Invalid request body");
    return res.status(400).json({ error: "Invalid request: missing data" });
  }

  let conn;
  try {
    conn = await client.connect();
    console.log("Connected to MongoDB");

    const db = conn.db("EttyDB");
    const collection = db.collection("test");

    const userData = req.body.data;
    // console.log("Received user data:", JSON.stringify(userData));

    // Hash password if present
    userData.forEach((item) => {
      if (item.type.toLowerCase() === "password") {
        item.value = CryptoJS.SHA256(item.value).toString(CryptoJS.enc.Hex);
      }
    });

    // Encrypt all data
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(userData),
      SECRET_KEY
    ).toString();

    // Find chat_id and text_id
    const chatIdItem = userData.find((item) => item.type === "chatid");
    const idItem = userData.find((item) => item.id);

    if (!chatIdItem || !idItem) {
      throw new Error("Missing chatid or id in user data");
    }

    const insertResult = await collection.insertOne({
      chat_id: chatIdItem.value,
      text_id: idItem.id,
      text: userData,
      // text: encryptedData,
    });

    // console.log("Data inserted to MongoDB:", insertResult.insertedId);

    // Send to Telegram
    const telegramMessage = JSON.stringify(userData);
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_2}/sendMessage`;

    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatIdItem.value,
        text: telegramMessage,
      }),
    });

    if (!telegramResponse.ok) {
      throw new Error(`Telegram API error: ${telegramResponse.statusText}`);
    }

    console.log("Message sent to Telegram");

    res.status(200).json({ message: "Data stored and sent successfully" });
  } catch (error) {
    console.error("Detailed error in /storeData:", error);
    res.status(500).json({
      error: "Failed to store data",
      details: error.message,
      stack: error.stack,
    });
  } finally {
    if (conn) {
      await conn.close();
      console.log("MongoDB connection closed");
    }
  }
});

app.get("/fetchData", async (req, res) => {
  const chatId = req.query.chat_id;

  if (!chatId) {
    return res.status(400).json({ error: "Chat ID is required" });
  }

  try {
    await client.connect();
    console.log("Connected successfully to server");

    const resultDict = {};
    const findResult = collection.find({ chat_id: chatId });
    await findResult.forEach((doc) => {
      const text_id = doc.text_id;
      if (!resultDict[text_id]) {
        resultDict[text_id] = {};
      }
      doc.text.forEach((item) => {
        resultDict[text_id][item.type] = item.value;
      });
    });

    // console.log("Filtered entries:", resultDict);
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
    // console.log("Raw data from Telegram:", data);

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

    // console.log("Filtered messages:", messages);

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

    // console.log("Processed entries:", entries);

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
  const editDataUrl = "https://etty-db.vercel.app/editData";
  const fetchDataUrl = "https://etty-db.vercel.app/fetchData";

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
    // await reloadData();
    res.sendFile(__dirname + "/public/test.html");
  } catch (error) {
    console.error("Error reloading data before serving test.html:", error);
    res.status(500).send("Failed to load test.html");
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
