var express = require("express");
var router = express.Router();

const songkick = require("../apis/songkick.js");

/* GET home page. */
router.get("/", (req, res, next) => {
    res.render("index");
});

/* Handle search requests */
router.post("/", (req, res, next) => {
    console.log("received post");
    let { artist, area, from, to } = req.body;

    songkick
        .searchArtist(artist)
        .then(output => {
            res.send(JSON.stringify(output));
        })
        .catch(e => {
            //TODO Specific errors
            res.send(e);
        });
});

module.exports = router;
