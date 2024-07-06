function gatherInfo() {
  const inputs = Array.from(document.getElementsByClassName("userInput"));
  const SECRET_KEY = "key";
  const userInput = [];
  const id = Date.now().toString();

  inputs.forEach((input) => {
    const type = input.getAttribute("aria-placeholder") || input.placeholder;
    const value = input.value;

    // Hash the password using SHA-256 if the field type is 'password'
    if (type.toLowerCase() === "password") {
      const hashedPassword = CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
      userInput.push({ type, value: hashedPassword });
    } else {
      userInput.push({ id: id, type, value });
    }
  });

  const encryptedData = CryptoJS.AES.encrypt(
    JSON.stringify(userInput),
    SECRET_KEY
  ).toString();

  fetch("http://localhost:8080/storeData", {
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

//Verify
function verifyInfo() {
  const inputs = Array.from(document.getElementsByClassName("verifyInput"));
  const SECRET_KEY = "key";
  const userInput = [];

  inputs.forEach((input) => {
    const type = input.getAttribute("aria-placeholder") || input.placeholder;
    const value = input.value;

    // Hash the password using SHA-256 if the field type is 'password'
    if (type.toLowerCase() === "password") {
      const hashedPassword = CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
      userInput.push({ type, value: hashedPassword });
    } else {
      userInput.push({ type, value });
    }
  });

  const encryptedData = CryptoJS.AES.encrypt(
    JSON.stringify(userInput),
    SECRET_KEY
  ).toString();

  fetch("http://localhost:8080/verifyData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: encryptedData }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Password verified successfully");
      } else {
        alert("Invalid credentials");
      }
    })
    .catch((error) => {
      console.error("Error verifying data:", error);
    });
}
