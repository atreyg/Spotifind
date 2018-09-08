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

    let spotifyArtists = spotify.artistSearch(artist);
    let songkickArtists = songkick.artistSearch(artist);
    let mergedArtists = [];

    Promise.all([spotifyArtists, songkickArtists]).then(res => {
        let normalisedSongkick = res[1].map(element => {
            return element.toLowerCase().replace(/[\W_]+/g, " ");
        });

        mergedArtists = res[0].filter(artist => {
            let normalisedName = artist.name
                .toLowerCase()
                .replace(/[\W_]+/g, " ");
            let index = normalisedSongkick.indexOf(normalisedName);

            if (index === -1) {
                return false;
            } else {
                artist.songkickName = res[1][index];
                normalisedSongkick.splice(index, 1);
                res[1].splice(index, 1);
                return true;
            }
        });

        console.log(mergedArtists);
    });
});

router.post("/", (req, resp, next) => {
    console.log("received post");

    let { artist, area, from, to, discover } = req.body;

    /**
     * TODO : questionable
     */
    if (artist !== "" && area !== "") {
        songkick
            .artistSearch(artist, discover)
            .then(res => {
                artist = res;
                return songkick.areaSearch(area);
            })
            .then(res => {
                area = res;
                return songkick.searchByBoth(artist, area, from, to);
            })
            .then(res => {
                resp.send(res);
            })
            .catch(e => resp.send(e));
    } else if (area !== "") {
        songkick
            .areaSearch(area)
            .then(res => songkick.searchByArea(res, from, to))
            .then(res => resp.send(res))
            .catch(e => resp.send(e));
    } else if (artist !== "") {
        songkick
            .artistSearch(artist, discover)
            .then(res => songkick.searchByArtist(res, from, to))
            .then(res => resp.send(res))
            .catch(e => resp.send(e));
    }
});

module.exports = router;
