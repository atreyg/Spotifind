function formHandler() {
    let artistInput = document.getElementById("artistSearch").value;
    let venueInput = document.getElementById("venueSearch").value;
    let areaInput = document.getElementById("areaSearch").value;

    fetch("/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
            artist: artistInput,
            venue: venueInput,
            area: areaInput
        })
    })
        .then(res => res.json())
        .then(res => {
            mapHandler.addEvents(res);
            renderSidebarHTML(res);
        });
}

function renderSidebarHTML(events) {
    let renderString = "";
    events.forEach(event => {
        renderString += individualMenuItem(event);
    });
    console.log("hi");
    document.getElementById("sidebar").innerHTML = renderString;
    console.log(document.getElementById("sidebar"));
}

function individualMenuItem(event) {
    let singleRender = `<div class='item'>
        <div class='content'>
            <div class='header'><span>${event.displayName}<span></div>
            <div class='meta'><span>${event.venue}</span></div> 
            <div class='meta'><span>${event.city}</span></div>       
        </div>    
    </div>`;

    return singleRender;
}
