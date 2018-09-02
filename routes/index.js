var express = require("express");
var router = express.Router();

const songkick = require("../apis/songkick.js");

/* GET home page. */
router.get("/", (req, res, next) => {
    res.render("index", { title: "Express", type: "get" });
});

/* Handle search requests */
router.post("/", (req, res, next) => {
    //let { artist, venue, area } = req.body;
    //songkick.searchArtist(artist);
    console.log("received post");
    res.send(JSON.stringify({test: "return test val"}));
});

module.exports = router;
