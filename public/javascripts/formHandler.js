function formHandler() {
    let artistInput = document.getElementById("artistSearch").value;
    let venue = document.getElementById("venueSearch").value;
    let area = document.getElementById("areaSearch").value;

    fetch('/', {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
            artist: artistInput
        })
    })
    .then(res => res.json())
    .then(res => console.log(res));
}
