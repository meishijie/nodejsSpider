var express = require('express');
var router = express.Router();



/* GET users listing. */
router.get('/', function(req, res) {
    res.json({success:1});

});



module.exports = router;
