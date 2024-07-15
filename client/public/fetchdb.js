document.addEventListener("DOMContentLoaded", function () {
  fetch("http://localhost:8080/fetchData")
    .then((response) => response.json())
    .then((data) => {
      console.log("Fetched data:", data);
      // console.log("Fetched data:", JSON.stringify(data));

      const elements = document.querySelectorAll("[data-id][data-field]");
      elements.forEach((element) => {
        const id = element.getAttribute("data-id");
        const field = element.getAttribute("data-field");
        if (data[id] && data[id][field]) {
          element.textContent = data[id][field];
        }
      });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
});
