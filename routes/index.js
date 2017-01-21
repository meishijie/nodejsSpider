var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', { title: '花瓣图片下载', inputTitle:'请输入画板ID' });
});

module.exports = router;
