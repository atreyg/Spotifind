function formHandler() {
    let artistInput = document.getElementById("artistSearch").value.trim();
    let areaInput = document.getElementById("areaSearch").value.trim();
    let fromInput = document.getElementById("fromDate").value;
    let toInput = document.getElementById("toDate").value;
    let discoverInput = document.getElementById("similarArtists").checked;

    if (fromInput === "") {
        let currentDate = new Date().toISOString();
        fromInput = currentDate.substring(0, currentDate.indexOf("T"));
    }
    if (toInput === "") {
        toInput =
            parseInt(fromInput.substring(0, 4)) + 10 + fromInput.substring(4);
    }

    if (artistInput === "" && areaInput === "") {
        let sidebar = document.getElementById("sidebar");
        sidebar.innerHTML =
            "Please enter either an artist name or area! <br />" +
            sidebar.innerHTML;

        /**
         * TODO : fix error ux design
         */

        document.getElementById("submitBtn").style.backgroundColor = "red";

        return false;
    }

    fetch("/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
            artist: artistInput,
            area: areaInput,
            from: fromInput,
            to: toInput,
            discover: discoverInput
        })
    })
        .then(res => res.json())
        .then(res => {
            if (typeof res.message !== "undefined") {
                handleError(res);
            } else {
                mapHandler.addEvents(res);
                renderSidebarHTML(res);
            }
        });
}

function handleError(err) {
    alert(err.message);
}

function renderSidebarHTML(events) {
    let renderString = "";
    events.forEach(event => {
        renderString += individualMenuItem(event);
    });
    document.getElementById("sidebar").innerHTML = renderString;

    attachEvents();
}

function attachEvents() {
    let items = document.getElementsByClassName("item");
    items[0].setAttribute("id", "focused");
    for (let i = 0; i < items.length; i++) {
        items[i].addEventListener("click", function(e) {
            setActiveEvent(i);
        });
    }
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
