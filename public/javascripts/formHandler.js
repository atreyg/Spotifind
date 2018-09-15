/**
 * Searches for artists/areas based on user input once search
 *
 */
function formHandler() {
    //Access relevant DOM elements
    let artistInput = document.getElementById("artistSearch").value.trim();
    let areaInput = document.getElementById("areaSearch").value.trim();
    let submitBtn = document.getElementById("submitBtn");

    //Check whether either artist, or area is provided
    if (!hasMinimumInput(artistInput, areaInput, submitBtn)) {
        return false;
    }

    //Setup close button event
    document
        .getElementById("closeBtn")
        .addEventListener("click", closeSearchWindow);

    startButtonLoading(submitBtn);

    fetchHandler("/search", {
        artist: artistInput,
        area: areaInput
    }).then(res => {
        stopButtonLoading(submitBtn);
        if (typeof res.message !== "undefined") {
            handleError(res);
        } else {
            renderSearchSelection(res.html);
            delete res.html;
            updateSearchEventButton(res);
            attachCardEvents(res);
        }
    });
}

function fetchHandler(endpoint, bodyObject) {
    return fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(bodyObject)
    }).then(res => res.json());
}

function hasMinimumInput(artistInput, areaInput, submitBtn) {
    if (artistInput === "" && areaInput === "") {
        submitBtn.classList.add("shaker");
        submitBtn.classList.replace("primary", "red");

        alert("Please enter an artist or area to search for.");
        return false;
    }

    return true;
}

function renderSearchSelection(searchHTML) {
    document
        .getElementById("overlay")
        .setAttribute("style", "visibility: visible");
    let searchContainer = document.getElementById("subSearchContainer");

    searchContainer.innerHTML = searchHTML;
}

function updateSearchEventButton(searchResults) {
    let findEventsBtn = document.getElementById("findEventsBtn");
    let clone = findEventsBtn.cloneNode(true);

    findEventsBtn.parentNode.replaceChild(clone, findEventsBtn);

    clone.addEventListener("click", function(e) {
        searchEvents(searchResults);
    });
}

function searchEvents(results) {
    let areas = findSelectedItems("areas", results);
    let artists = findSelectedItems("artists", results);

    if (areas === -1 || artists === -1) {
        return;
    }

    makeEventSearchCall(artists, areas);
}

function findSelectedItems(itemType, results) {
    let filtered = null;

    if (results[itemType] !== null) {
        filtered = results[itemType].filter(item => item.state === "search");
        if (filtered.length === 0) {
            alert(
                "Please select " +
                    itemType +
                    " or remove any input from the field and query again"
            );
            return -1;
        }
    }
    return filtered;
}

function closeSearchWindow() {
    document
        .getElementById("overlay")
        .setAttribute("style", "visibility: hidden");
    document.getElementById("subSearchContainer").innerHTML = "";
}

function getDateValues() {
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

    return [fromInput, toInput];
}

function makeEventSearchCall(artists, areas) {
    let dates = getDateValues();
    let findEventsBtn = document.getElementById("findEventsBtn");
    startButtonLoading(findEventsBtn);

    fetchHandler("/events", {
        artist: artists,
        area: areas,
        from: dates[0],
        to: dates[1]
    }).then(res => {
        mapHandler.clearMap();
        clearSideBar();
        stopButtonLoading(findEventsBtn);
        closeSearchWindow();

        if (typeof res.message !== "undefined") {
            handleError(res);
        } else {
            mapHandler.addEvents(res);
            renderSidebarHTML(res);
        }
    });
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
    let states = ["nosearch", "search"];

    let currentState = states.indexOf(resultData.state);
    currentState = (currentState + 1) % states.length;
    resultData.state = states[currentState];

    card.getElementsByClassName("content")[0].className =
        "content " + resultData.state;

    //Toggle icons
    let icons = card.getElementsByTagName("i");
    if (resultData.state === "nosearch") {
        icons[0].className = "toggle off icon";
    } else if (resultData.state === "search") {
        icons[0].className = "toggle on icon";
    }
}

function handleError(err) {
    alert(err.message);
}

function renderSidebarHTML(input) {
    let renderString = "";
    for (let artistGroup in input) {
        let artistEvents = input[artistGroup].events;
        renderString +=
            "<h3 class='ui header'>" + artistEvents[0].grouping + "</h3>";
        if (
            typeof input[artistGroup].tracks !== "undefined" &&
            input[artistGroup].tracks[0].preview_url !== null
        ) {
            let topTrack = input[artistGroup].tracks[0];
            renderString +=
                "<div>Preview: " +
                topTrack.name +
                "<audio controls><source src='" +
                topTrack.preview_url +
                "' type='audio/mpeg'</audio></div>";
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
            <div class='meta'><span>${event.city}</span><a href="${
        event.uri
    }" target="_blank">More info...</a></div>          
        </div>    
    </div>`;

    return singleRender;
}

function startButtonLoading(button) {
    button.className = "ui primary loading button";
}

function stopButtonLoading(button) {
    button.className = "ui primary button";
}
