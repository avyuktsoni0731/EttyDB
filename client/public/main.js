function gatherInfo() {
    const inputs = Array.from(document.getElementsByClassName('userInput'));
    const userInput = {};
    for(let i in inputs){
        userInput[i] = inputs[i].value;
    }
    fetch('http://localhost:8080/storeData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userInput: userInput }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to store data');
        }
        console.log('Data stored successfully');
    })
    .catch(error => {
        console.error('Error storing data:', error);
    });
}
