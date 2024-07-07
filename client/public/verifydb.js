function verifyInfo() {
    fetch("http://localhost:8080/fetchData")
      .then((response) => response.json())
      .then((data) => {
        for(let item in data){
            // console.log(item);
            // console.log(data[item]);
            console.log(data[item].username);
            console.log(data[item].password);
        }
        const inputs = Array.from(document.getElementsByClassName("verifyInput"));
        const userInput = [];

        inputs.forEach((input) => {
            const type = input.getAttribute("aria-placeholder") || input.placeholder;
            const value = input.value;
            userInput.push({ type, value });
        });
        let login_status="Failed"
        for(let item in data){
            if(data[item].username == userInput[0].value && data[item].password == userInput[1].value){
                login_status="Success"
            }
        }
        console.log(login_status);

      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
}
