var express = require("express");
var router = express.Router();

const songkick = require("../apis/songkick.js");
const spotify = require("../apis/spotify.js");

/* GET home page. */
router.get("/", (req, res, next) => {
    res.render("index");
});

/* Handle search requests */
router.post("/search", (req, resp, next) => {
    let { artist, area } = req.body;
    let promiseChain = [];
    let result = { artists: null, areas: null };

    if (artist !== "") {
        promiseChain.push(spotify.artistSearch(artist));
        promiseChain.push(songkick.artistSearch(artist));
    }

    if (area !== "") {
        promiseChain.push(songkick.areaSearch(area));
    }

    Promise.all(promiseChain)
        .then(res => {
            if (res.length === 3) {
                result.artists = findCommonArtists(res[0], res[1]);
                result.areas = res[2];
            } else if (res.length === 2) {
                result.artists = findCommonArtists(res[0], res[1]);
            } else if (res.length === 1) {
                result.areas = res[0];
            }

            if (result.artists !== null && result.artists.length === 0) {
                throw new Error(
                    "Could not find the artist searched for. Please check your search query."
                );
            }

            if (result.areas !== null && result.areas.length === 0) {
                throw new Error(
                    "Could not find the area searched for. Please check your search query."
                );
            }

            resp.send(result);
        })
        .catch(err => {
            resp.send({ message: err.message });
        });
});

router.post("/events", (req, resp, next) => {
    console.log("received post");

    let { artist, area, from, to } = req.body;
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
            grouped = groupByArtists(res);
            return findTracks(grouped);
        })
        .then(res => {
            for (let i = 0; i < res.length; i++) {

                if(typeof res[i] !== 'undefined' && grouped.hasOwnProperty(res[i][0].artist)){
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
            resp.send({ message: e.message })
        });
});

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

function findTracks(grouped) {
    let promiseChain = [];
    Object.keys(grouped).forEach(artist => {
        promiseChain.push(
            spotify.artistSearch(artist).then(res => {
                if(res.length === 0){
                    return;
                }else{
                    return spotify.findSongs(res[0].id);
                }
            })
        );
    });

    return Promise.all(promiseChain);
}

function findCommonArtists(spotifyFinds, songkickFinds) {
    let normalisedSongkick = songkickFinds.map(element => {
        return element.toLowerCase().replace(/[\W_]+/g, " ");
    });

    return spotifyFinds.filter(artist => {
        let normalisedName = artist.name.toLowerCase().replace(/[\W_]+/g, " ");
        let index = normalisedSongkick.indexOf(normalisedName);

        if (index === -1) {
            return false;
        } else {
            artist.songkickName = songkickFinds[index];
            artist.state = "nosearch";
            normalisedSongkick.splice(index, 1);
            songkickFinds.splice(index, 1);
            return true;
        }
    });
}

module.exports = router;
