var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", (req, res, next) => {
    res.render("index", { title: "Express", type: "get" });
});

router.post("/", (req, res, next) => {
    res.render("index", { title: "Express", type: "post" });
});

module.exports = router;
