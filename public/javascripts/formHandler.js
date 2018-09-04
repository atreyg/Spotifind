function formHandler() {
    let artistInput = document.getElementById("artistSearch").value;
    let areaInput = document.getElementById("areaSearch").value;
    let fromInput = document.getElementById("fromDate").value;
    let toInput = document.getElementById("toDate").value;

    fetch("/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
            artist: artistInput,
            area: areaInput,
            from: fromInput,
            to: toInput
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
