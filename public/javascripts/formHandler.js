function formHandler() {
    let artistInput = document.getElementById("artistSearch").value.trim();
    let areaInput = document.getElementById("areaSearch").value.trim();

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

    fetch("/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
            artist: artistInput,
            area: areaInput
        })
    })
        .then(res => res.json())
        .then(res => {
            if (typeof res.message !== "undefined") {
                handleError(res);
            } else {
                renderSearchSelection(res);
            }
        });
}

function renderSearchSelection(searchResults) {
    let renderString = "";

    if (searchResults.artists) {
        let artistString = "";
        let num = searchResults.artists.length;
        artistString += `<h1 class='ui header'> ${num} artist(s) found that match search </h1>
            <h3 class='ui header'>Select who to search for below. Toggle through the states of:
            'search', 'discovery', and 'don't search' by clicking on the artist cards.
            </h3><div class='ui link cards'>`;

        for (let i = 0; i < num; i++) {
            artistString += createArtistResultDiv(searchResults.artists[i]);
        }

        renderString += artistString + "</div>";
    }

    if (searchResults.areas) {
        let areaString = "";
        let num = searchResults.areas.length;
        areaString += `<h1 class='ui header'> ${num} area(s) found that match search </h1>
            <h3 class='ui header'>Select where to search below. Toggle through the states of:
            'search' and 'don't search' by clicking on the area cards.
            </h3><div class='ui link cards'>`;

        for (let i = 0; i < num; i++) {
            areaString += createAreaResultDiv(searchResults.areas[i]);
        }

        renderString += areaString + "</div>";
    }

    let searchContainer = document.getElementById("searchContainer");
    searchContainer.setAttribute("style", "visibility: visible");
    searchContainer.innerHTML = renderString;
    searchContainer.innerHTML +=
        "<a><button id='findEventsBtn' class='ui button'>Find Events</button></a>";

    document
        .getElementById("findEventsBtn")
        .addEventListener("click", function() {
            searchEvents(searchResults);
        });
    attachCardEvents(searchResults);
}

function searchEvents(results) {
    let areas = null;
    let artists = null;

    if (results.areas !== null) {
        areas = results.areas.filter(area => area.state !== "nosearch");
        if (areas.length === 0) {
            alert(
                "Please select an area, or remove any input from the field and query again"
            );
            return;
        }
    }

    if (results.artists !== null) {
        artists = results.artists.filter(artist => artist.state !== "nosearch");
        if (artists.length === 0) {
            alert(
                "Please select an artist, or remove any input from the field and query again"
            );
            return;
        }
    }

    makeEventSearchCall(artists, areas);
    closeSearchWindow();
}

function closeSearchWindow() {
    let searchContainer = document.getElementById("searchContainer");
    searchContainer.setAttribute("style", "visibility: hidden");
    searchContainer.innerHTML = "";
}

function makeEventSearchCall(artists, areas) {
    let fromInput = document.getElementById("fromDate").value;
    let toInput = document.getElementById("toDate").value;

    if (fromInput === "") {
        let currentDate = new Date().toISOString();
        fromInput = currentDate.substring(0, currentDate.indexOf("T"));
    }
    if (toInput === "") {
        toInput =
            parseInt(fromInput.substring(0, 4)) + 10 + fromInput.substring(4);
    }

    mapHandler.clearMap();
    clearSideBar();

    fetch("/events", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
            artist: artists,
            area: areas,
            from: fromInput,
            to: toInput
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

function createAreaResultDiv(result) {
    return `<div class="card">
        <div class="content">
            <div class="header">${result.city}</div>
            <div class="meta">${result.widerArea}</div>
        </div>
        <div class="extra content">
            <span class="left floated search">
                <i class="toggle off icon"></i>
                Search
            </span>
        </div>
    </div>`;
}

function attachCardEvents(searchResults) {
    let cards = document.getElementsByClassName("card");
    for (let i = 0; i < cards.length; i++) {
        let header = cards[i].getElementsByClassName("header")[0];
        let data = null;
        if (searchResults.artists !== null) {
            for (let i = 0; i < searchResults.artists.length; i++) {
                if (searchResults.artists[i].name === header.innerHTML) {
                    data = searchResults.artists[i];
                    break;
                }
            }
        }

        if (searchResults.areas !== null && data === null) {
            for (let i = 0; i < searchResults.areas.length; i++) {
                if (
                    searchResults.areas[i].city === header.innerHTML &&
                    searchResults.areas[i].widerArea ===
                        header.nextElementSibling.innerHTML
                ) {
                    data = searchResults.areas[i];
                    break;
                }
            }
        }

        cards[i].addEventListener("click", function(e) {
            toggleCardState(this, data);
        });
    }
}

function toggleCardState(card, resultData) {
    let states;

    if (resultData.hasOwnProperty("city")) {
        states = ["nosearch", "search"];
    } else {
        states = ["nosearch", "search", "similar"];
    }

    let currentState = states.indexOf(resultData.state);
    currentState = (currentState + 1) % states.length;
    resultData.state = states[currentState];

    card.getElementsByClassName("content")[0].className =
        "content " + resultData.state;

    //Toggle icons
    let icons = card.getElementsByTagName("i");
    if (resultData.state === "nosearch") {
        icons[0].className = "toggle off icon";
        if (icons[1]) {
            icons[1].className = "toggle off icon";
        }
    } else if (resultData.state === "search") {
        icons[0].className = "toggle on icon";
    } else if (resultData.state === "similar") {
        icons[1].className = "toggle on icon";
    }
}

function createArtistResultDiv(result) {
    return `<div class="card" style="width:200px;height:300px">
        <div class="ui image" style="height:150px;overflow:hidden">
            <img src='${result.images[0].url}' style="min-height:100%">
        </div>
        <div class="content">
            <div class="header">${result.name}</div>
            <div class="meta">${result.genres}</div>
        </div>
        <div class="extra content">
            <span class="left floated search">
                <i class="toggle off icon"></i>
                Search
            </span>
            <span class="right floated toggle">
                <i class="toggle off icon"></i>
                Discovery
            </span>
        </div>
    </div>`;
}

function handleError(err) {
    alert(err.message);
}

function renderSidebarHTML(input) {
    console.log(input);
    let renderString = "";
    for (let artistGroup in input) {
        let artistEvents = input[artistGroup].events;
        renderString +=
            "<h3 class='ui header'>" + artistEvents[0].grouping + "</h3>";
        if (input[artistGroup].tracks[0].preview_url !== null) {
            renderString +=
                "<span class='musicPlayer'><audio controls><source src='" +
                input[artistGroup].tracks[0].preview_url +
                "' type='audio/mpeg'</audio></span>";
        }
        artistEvents.forEach(event => {
            renderString += individualMenuItem(event);
        });
    }

    document.getElementById("sidebar").innerHTML = renderString;

    attachEvents();
}

function clearSideBar() {
    document.getElementById("sidebar").innerHTML = "";
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
    let d = event.startDate
        .split("-")
        .reverse()
        .join("/");

    let singleRender = `<div class='item'>
        <div class='content'>
            <div class='header'><span>${event.displayName}<span> </div>
            <div class='meta'><span>${event.venue} - ${d}</span></div> 
            <div class='meta'><span>${event.city}</span></div>       
        </div>    
    </div>`;

    return singleRender;
}
