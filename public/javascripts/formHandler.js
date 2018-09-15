/**
 * Searches for artists/areas based on user input into form when button clicked.
 * Initiates process to search for events.
 */
function formHandler() {
    //Store relevant DOM elements
    let artistInput = document.getElementById("artistSearch").value.trim();
    let areaInput = document.getElementById("areaSearch").value.trim();
    let submitBtn = document.getElementById("submitBtn");

    //Check whether either artist or area is provided
    if (!hasMinimumInput(artistInput, areaInput, submitBtn)) {
        return false;
    }

    //Setup close button event for search window
    document
        .getElementById("closeBtn")
        .addEventListener("click", closeSearchWindow);

    startButtonLoading(submitBtn);

    //Request to server to provide search results
    fetchHandler("/search", {
        artist: artistInput,
        area: areaInput
    }).then(res => {
        stopButtonLoading(submitBtn);

        //Handle error elegantly else proceed with normal rendering of search results
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

/**
 * Check whether atleast the area or artist field has been filled.
 * One of the two is required to proceed.
 * @param {*} artistInput DOMElement
 * @param {*} areaInput
 * @param {*} submitBtn
 */
function hasMinimumInput(artistInput, areaInput, submitBtn) {
    if (artistInput === "" && areaInput === "") {
        //CSS shake animation and alert to provide feedback to user
        submitBtn.classList.add("shaker");
        submitBtn.classList.replace("primary", "red");
        alert("Please enter an artist or area to search for.");
        submitBtn.classList.remove("shaker");

        //Ensure form submission doesn't proceed
        return false;
    }
    return true;
}

/**
 * Produce the search results dialog on the UI
 * @param {*} searchHTML HTML string to represent the search results
 */
function renderSearchSelection(searchHTML) {
    //Activate overlay so user can not click search again
    document
        .getElementById("overlay")
        .setAttribute("style", "visibility: visible");

    //Add the HTML
    document.getElementById("subSearchContainer").innerHTML = searchHTML;
}

/**
 * Reset the search results dialog to prepare for the next set of searches.
 */
function closeSearchWindow() {
    //Deactive overlay
    document
        .getElementById("overlay")
        .setAttribute("style", "visibility: hidden");

    //Clear the HTML to reset for the next result
    document.getElementById("subSearchContainer").innerHTML = "";
}

/**
 * Recreates the find events button to allow event listener to be updated, without multiple attached events.
 * @param {*} searchResults Search results for the intial user artist and/or area search.
 */
function updateSearchEventButton(searchResults) {
    //Recreate the findEventsBtn node
    let findEventsBtn = document.getElementById("findEventsBtn");
    let clone = findEventsBtn.cloneNode(true);
    findEventsBtn.parentNode.replaceChild(clone, findEventsBtn);

    //Set the click event listener with updated search results
    clone.addEventListener("click", function(e) {
        searchEvents(searchResults);
    });
}

/**
 * Search for events with selected areas and artists
 * @param {*} searchResults Search results for the intial user artist and/or area search.
 */
function searchEvents(searchResults) {
    //Find the selected options from the list of search options potentially provided
    let areas = findSelectedItems("areas", searchResults);
    let artists = findSelectedItems("artists", searchResults);

    //Return on failure of the find and don't proceed with event search
    if (areas === -1 || artists === -1) {
        return;
    }

    makeEventSearchCall(artists, areas);
}

/**
 * Find a filtered item list of the cards selected for the event search
 * @param {*} itemType String representation of the key to search for
 * @param {*} results Search results for the intial user artist and/or area search.
 * @returns filtered list of selected items, or -1 on failure
 */
function findSelectedItems(itemType, results) {
    let filtered = null;

    //Check the itemType was searched for initially, and not intentionally left blank
    if (results[itemType] !== null) {
        filtered = results[itemType].filter(item => item.state !== "nosearch");
        //Alert and fail function when nothing selected
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

/**
 * Add event listeners to the search cards on click, to toggle their search status
 * @param {*} searchResults Search results for the intial user artist and/or area search.
 */
function attachCardEvents(searchResults) {
    //Array of DOM representations of the search results;
    let cards = document.getElementsByClassName("card");

    for (let i = 0; i < cards.length; i++) {
        //Identifier of card used to relink with searchResults
        let header = cards[i].getElementsByClassName("header")[0];
        let data = null;
        //If artists were searched for
        if (searchResults.artists !== null) {
            //Iterate and find the data associated with this card
            for (let i = 0; i < searchResults.artists.length; i++) {
                if (searchResults.artists[i].name === header.innerHTML) {
                    data = searchResults.artists[i];
                    break;
                }
            }
        }

        //If areas were searched for and data hasn't been found (card must be an area card)
        if (searchResults.areas !== null && data === null) {
            //Iterate and find the data associated with this card
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

        //Toggle the card state on click
        cards[i].addEventListener("click", function(e) {
            toggleCardState(this, data);
        });
    }
}

/**
 * Iterate through the possible card states (setting a card to search, no search, etc), updating the UI concurrently.
 * @param {*} card DOMElement of the card
 * @param {*} resultData data associated with the card
 */
function toggleCardState(card, resultData) {
    //Get array of icons
    let icons = card.getElementsByTagName("i");
    let states;

    //Assign appropriate states based on if area or artist card
    if (icons.length === 2) {
        states = ["nosearch", "search", "discover"];
    } else {
        states = ["nosearch", "search"];
    }

    //Cycle to the next state in the states array
    let currentState = states.indexOf(resultData.state);
    currentState = (currentState + 1) % states.length;
    resultData.state = states[currentState];

    //Update class name to change content background color
    card.getElementsByClassName("content")[0].className =
        "content " + resultData.state;

    //Toggle 'search' and 'discovery' icons based on current state
    if (resultData.state === "nosearch") {
        icons[0].className = "toggle off icon";
        if (icons[1]) {
            icons[1].className = "toggle off icon";
        }
    } else if (resultData.state === "search") {
        icons[0].className = "toggle on icon";
    } else if (resultData.state === "discover") {
        icons[1].className = "toggle on icon";
    }
}

/**
 * Send a request to the server to search for events by the selected parameters.
 * @param {*} artists selected artists from search window or null
 * @param {*} areas selected areas from search window or null
 */
function makeEventSearchCall(artists, areas) {
    let dates = getDateValues();

    let findEventsBtn = document.getElementById("findEventsBtn");
    startButtonLoading(findEventsBtn);

    //Send the request
    fetchHandler("/events", {
        artist: artists,
        area: areas,
        from: dates[0],
        to: dates[1]
    }).then(res => {
        //Reset previous search results
        mapHandler.clearMap();
        clearSideBar();
        stopButtonLoading(findEventsBtn);
        closeSearchWindow();

        //Handle error gracefully
        if (typeof res.message !== "undefined") {
            handleError(res);
        } else {
            renderSidebarHTML(res.html);
            delete res.html;
            attachSidebarEvents();
            mapHandler.addEvents(res);
        }
    });
}

/**
 * Set the sidebar to display the HTML compiled by the server about sidebar events
 * @param {*} sidebarHTML HTML string representing the sidebar contents
 */
function renderSidebarHTML(sidebarHTML) {
    document.getElementById("sidebar").innerHTML = sidebarHTML;
}

/**
 * Add click event listeners to the event list in the sidebar.
 * Associates them to the corresponding marker
 */
function attachSidebarEvents() {
    let items = document.getElementsByClassName("item");
    //Set first item to focus
    items[0].setAttribute("id", "focused");

    for (let i = 0; i < items.length; i++) {
        items[i].addEventListener("click", function(e) {
            //function in mapUpdates.js file
            setActiveEvent(i);
        });
    }
}

/**
 * Retrieve date values from the DOM elements.
 * Replace empty values with defaults.
 */
function getDateValues() {
    //Get DOM values
    let fromInput = document.getElementById("fromDate").value;
    let toInput = document.getElementById("toDate").value;

    //Replace an empty 'from' field with today's date
    if (fromInput === "") {
        let currentDate = new Date().toISOString();
        fromInput = currentDate.substring(0, currentDate.indexOf("T"));
    }
    //Replace an empty 'to' field with a date 10 years from the from date
    if (toInput === "") {
        toInput =
            parseInt(fromInput.substring(0, 4)) + 10 + fromInput.substring(4);
    }

    return [fromInput, toInput];
}

/**
 * Handle errors sent by the server, gracefully on the client side via an alert
 * @param {*} err Error object
 */
function handleError(err) {
    alert(err.message);
}

/**
 * Clear the sidebar of all contents
 */
function clearSideBar() {
    document.getElementById("sidebar").innerHTML = "";
}

/**
 * Show a loading animation on the button
 * @param {} button a DOM button element
 */
function startButtonLoading(button) {
    button.className = "ui primary loading button";
}

/**
 * Stop a loading animation on the button
 * @param {} button a DOM button element
 */
function stopButtonLoading(button) {
    button.className = "ui primary button";
}

/**
 * Helper function to create fetch requests with basic requirements preassembled.
 * @param {*} endpoint where the request will be sent to on the server
 * @param {*} bodyObject object that needs to be sent in the body of the request
 */
function fetchHandler(endpoint, bodyObject) {
    return fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(bodyObject)
    }).then(res => res.json());
}
