//Express boilerplate
var express = require("express");
var router = express.Router();

//Importing libraries to make API calls, and pug for rendering
const songkick = require("../apis/songkick.js");
const spotify = require("../apis/spotify.js");
const pug = require("pug");

//Pug template for the initial search results
const compiledSearchHTML = pug.compileFile("./views/searchResults.pug");

//Render index.pug on intial page load
router.get("/", (req, res, next) => {
    res.render("index");
});

//Handle initial search results
router.post("/search", (req, resp, next) => {
    //Deconstruct request body to variables
    let { artist, area } = req.body;

    //Depending on input, search artists and/or areas
    let promiseChain = [];
    if (artist !== "") {
        promiseChain.push(spotify.artistSearch(artist));
        promiseChain.push(songkick.artistSearch(artist));
    }

    if (area !== "") {
        promiseChain.push(songkick.areaSearch(area));
    }

    //Waiting till all results are back
    Promise.all(promiseChain)
        .then(res => {
            //Creating a results object that will be updated with results from searches
            let result = { artists: null, areas: null, html: null };

            if (res.length === 3) {
                //If an an artist is searched for, ensure artist can be matched on songkick and spotify before including in results
                result.artists = findCommonArtists(res[0], res[1]);
                result.areas = res[2];
            } else if (res.length === 2) {
                result.artists = findCommonArtists(res[0], res[1]);
            } else if (res.length === 1) {
                result.areas = res[0];
            }

            //Check whether a field is searched for, but no results have been found.
            checkNotFound(result, "artists");
            checkNotFound(result, "areas");

            //Store html string for search in the result object
            result.html = compiledSearchHTML(result);

            resp.send(result);
        })
        .catch(err => {
            resp.send({ message: err.message });
        });
});

//Handle secondary search with specific artists and areas
router.post("/events", (req, resp, next) => {
    //Deconstruct request object to variables
    let { artist, area, from, to } = req.body;

    //Search for events based on the combination of inputs provided from the search window
    let promiseAction;
    if (artist !== null && area !== null) {
        promiseAction = songkick.searchByBoth(artist, area, from, to);
    } else if (area !== null) {
        promiseAction = songkick.searchByArea(area, from, to);
    } else if (artist !== null) {
        promiseAction = songkick.searchByArtist(artist, from, to);
    }

    let grouped;
    promiseAction
        .then(res => {
            let uniqueResults = removeDuplicateEvents(res);
            grouped = groupByArtists(uniqueResults);
            return findTracks(grouped);
        })
        .then(res => {
            for (let i = 0; i < res.length; i++) {
                if (
                    typeof res[i] !== "undefined" &&
                    grouped.hasOwnProperty(res[i][0].artist)
                ) {
                    let key = res[i][0].artist;
                    grouped[key].tracks = [];
                    for (let j = 0; j < res[i].length; j++) {
                        grouped[key].tracks.push(res[i][j]);
                    }
                }
            }
            resp.send(grouped);
        })
        .catch(e => {
            resp.send({ message: e.message });
        });
});

/**
 * Filters results to remove duplicate events (possible if multiple areas in close proximity selected)
 * @param {array} res array of event objects
 * @returns {array} array of unique event objects
 */
function removeDuplicateEvents(res) {
    let ids = [];

    return res.filter(item => {
        if (ids.includes(item.id)) {
            return false;
        }

        ids.push(item.id);
        return true;
    });
}

/**
 * Group array of events by artist name to create an events object, with unique artist names as keys.
 * @param {array} res events as an array
 * @returns {object} events as an object grouped by unique artists
 */
function groupByArtists(res) {
    let events = {};
    for (let i = 0; i < res.length; i++) {
        let artist = res[i].grouping;
        if (!events[artist]) {
            events[artist] = { events: [] };
        }

        events[artist].events.push(res[i]);
    }
    return events;
}

/**
 * Compares results from both services and combines information from both into one common result.
 * If an artist is not found on both platforms, they are excluded from results.
 * @param {array} spotifyFinds search results
 * @param {array} songkickFinds
 */
function findCommonArtists(spotifyFinds, songkickFinds) {
    //Standard for artist names that are stylised differently on the services
    //Converts to lowercase, and replaces special characters with spaces
    let normalisedSongkick = songkickFinds.map(element => {
        return element.toLowerCase().replace(/[\W_]+/g, " ");
    });

    return spotifyFinds.filter(artist => {
        //Retains orignal name on spotify, but normalises in a new variable for comparison
        let normalisedName = artist.name.toLowerCase().replace(/[\W_]+/g, " ");
        let index = normalisedSongkick.indexOf(normalisedName);

        if (index === -1) {
            return false;
        } else {
            //Add additional information to information found from spotify
            artist.songkickName = songkickFinds[index];
            artist.state = "nosearch";
            normalisedSongkick.splice(index, 1);
            songkickFinds.splice(index, 1);
            return true;
        }
    });
}

/**
 * Check whether a searched field could not
 * @param {object} result Object with results found from searches.
 * @param {string} key String representation of the key that is being checked for.
 */
function checkNotFound(result, key) {
    if (result[key] !== null && result[key].length === 0) {
        throw new Error(
            "Could not find the " +
                key +
                " searched for. Please check your search query."
        );
    }
}

function findTracks(grouped) {
    let promiseChain = [];
    Object.keys(grouped).forEach(artist => {
        promiseChain.push(
            spotify.artistSearch(artist).then(res => {
                if (res.length === 0) {
                    return;
                } else {
                    return spotify.findSongs(res[0].id);
                }
            })
        );
    });

    return Promise.all(promiseChain);
}

module.exports = router;
