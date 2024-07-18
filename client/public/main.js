function gatherInfo() {
  const inputs = Array.from(document.getElementsByClassName("userInput"));
  const userInput = [];
  const id = Date.now().toString();

  // Prompt user for TELEGRAM_CHAT_ID
  const TELEGRAM_CHAT_ID = prompt("Please enter your Telegram chat ID:");
  if (!TELEGRAM_CHAT_ID) {
    alert("Telegram chat ID is required.");
    return;
  }

  inputs.forEach((input) => {
    const type = input.getAttribute("aria-placeholder") || input.placeholder;
    const value = input.value;
    userInput.push({ id: id, type, value });
  });

  // Add TELEGRAM_CHAT_ID to userInput
  userInput.push({ id: id, type: "chatid", value: TELEGRAM_CHAT_ID });

  fetch("http://localhost:8080/storeData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: userInput }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw err;
        });
      }
      return response.json();
    })
    .then((data) => {
      // console.log("Success:", data);
      alert("Data stored successfully!");
    })
    .catch((error) => {
      console.error("Detailed error:", error);
      alert("An error occurred. Please check the console for details.");
    });
}
