var express = require('express');
var router = express.Router();
var app = express();
var iconv = require('iconv-lite');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var Fiber = require('fibers');

var canNext = true;
var boardId = '25570548';//画板ID
var folder = '图片'
var url = 'http://huaban.com/boards/'+boardId+'/?ixse7khz&limit=30&wfl=1';
// 'http://huaban.com/boards/31435061/?max=981353787&limit=20&wfl=1'
var meizi = [];
var allPinId = [];
var lastId = '';
var nowId = '';
var i = 0;

//
var resUse ;

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('users', { title: '花瓣图片下载', inputTitle:'画板ID： '+req.query.boardId+'正在下载！。。。' });
    // resUse.send(boardId);
    resUse = res;
    var boardId = req.query.boardId;
    initStart(boardId);
});
router.get('/j', function(req, res, next) {
    fs.readFile("c://a.txt", function(err, data){
        if(err)
            console.log("读取文件fail " + err);
        else{
            res.json({success: iconv.decode(data, 'utf8')});
            // 把数组转换为gbk中文
            //var str = iconv.decode(data, 'gbk');
            // console.log(str);
        }
    });
});


function writeTxt( txt ){
    fs.writeFile("c://a.txt",txt, function(err){
        if(err)
            console.log("fail " + err);
        else
            console.log("写入内容"+txt);
    });
}
function initStart(bid) {
    if( !bid ){
        return false;
    }
    boardId = bid;
    //检测是否有同名文件夹
    checkFolder(folder);
    checkFolder(folder+'/'+boardId);
    //执行入口
    //resUse.send(meizi+'读取页面内容中，请稍等。。。');
    writeTxt('准备数据中。。。');
    download(url);
}

function checkFolder(myid) {

    if (fs.existsSync(myid)) {
        console.log('文件夹'+myid+'存在！');
    }else{
        console.log('创建文件夹'+myid);
        fs.mkdirSync(myid, 0777,function() {
            console.log('文件夹'+myid+'创建完毕！');
        });
    }

}

function download( requrl ) {
    //读取页面内容

    request(requrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            readData(body);
            //读取变化后的url
        }
    })
}

//单个页面下载所有图片
function readData(data) {
    var $ = cheerio.load(data);
    //var regPinId = /\"pin_id\"\:\d{9}/g;
    var regPinId = /\d{9}(?=, \"user_id\")/g;
    while(tem=regPinId.exec($.text())){
        // console.log(tem[0]);
        lastId = tem[0];
    }

    // console.log(lastId);
    // var reg = /(?<=(key\"\:\")).[-\w]*/g;
    var reg = /\w{32,46}\-\w{6}/g;
    while(tem=reg.exec($.text())){
        //console.log(tem[0]);
        meizi.push(tem[0]);
    }
    //把图片地址放入meizi数组
    //var meizi = $('img').toArray();
    // console.log(meizi);
    url = 'http://huaban.com/boards/'+boardId+'/?ixse7khz&max='+lastId+'&limit=30&wfl=1';//设置url的地址加上最后一个pin_id
    // var oneSecond = 1000 * 0.1; // one second = 1000 x 1 ms
    //console.log(lastId);
    //console.log(nowId);
    //console.log(  meizi.length );

    if( lastId == nowId ){
        fs.writeFile("c://a.txt",meizi.length+'个图片正在下载中。。。', function(err){
            if(err)
                console.log("fail " + err);
            else
                console.log("写入文件ok");
        });
        i = 0;
        var imgsrc = 'http://img.hb.aicdn.com/'+meizi[i];
        var filename = parseUrlForFileName(imgsrc);  //生成文件名
        console.log('全部搜索完成，准备下载！');
        downloadOnce(imgsrc,filename,i);
        // for( var m in meizi ){
        // console.log( path.basename(meizi[m].attribs.src));
        // var imgsrc = 'http://img.hb.aicdn.com/'+meizi[m];
        //console.log(imgsrc);
        // var filename = parseUrlForFileName(imgsrc);  //生成文件名
        //downloadOnce(imgsrc,filename,i);
        // downloadImg(imgsrc,filename,function() {
        //     console.log(filename + ' 下载完成！');
        // });
        // }
    }else
    {
        nowId = lastId;
        setTimeout(function () {
            //循环下载url
            console.log('准备下一批--------------------');
            download(url);
        }, 1000 * 0.1);
    }
}

function downloadOnce(myurl,fname,myI) {
    downloadImg(myurl,fname,function() { });
}
var downloadImg = function(uri, myfilename, callback){
    console.log(uri+'开始下载');
    request(uri, function(err, res, body){
        var imageType = res.headers['content-type'].replace(/image\//g ,"").trim();
        console.log('图片类型'+imageType);  //这里返回图片的类型
        // console.log('content-length:', res.headers['content-length']);  //图片大小
        if (err) {
            console.log('err: '+ err);
            return false;
        }
        if (imageType == 'jpeg'||imageType == 'png'||imageType =='gif' ||imageType =='jpg') {
            request(uri).pipe(fs.createWriteStream(folder+'/'+boardId+'/'+myfilename+'.'+imageType))
                .on('error',function () {
                    setTimeout(function () {
                        console.log( myfilename+'下载完成');
                        i++;
                        // console.log(meizi.length);
                        // console.log(i == meizi.length);
                        if( i< meizi.length+1 ){
                            var imgsrc = 'http://img.hb.aicdn.com/'+meizi[i];
                            var filename = parseUrlForFileName(imgsrc);  //生成文件名
                            downloadOnce(imgsrc,filename,i);
                        }

                        if(i == meizi.length ){
                            fs.appendFile("c://a.txt",'所有文件下载完成！', function(err){
                                if(err)
                                    console.log("fail " + err);
                                else
                                    console.log("所有文件下载完成！");
                            });
                            console.log('全部下载完成！');
                            return false;
                        }
                    }, 100);
            })
                .on('close', function(){
                setTimeout(function () {
                    console.log( myfilename+'下载完成');
                    i++;
                    // console.log(meizi.length);
                    // console.log(i == meizi.length);
                    if( i< meizi.length+1 ){
                        var imgsrc = 'http://img.hb.aicdn.com/'+meizi[i];
                        var filename = parseUrlForFileName(imgsrc);  //生成文件名
                        downloadOnce(imgsrc,filename,i);
                    }

                    if(i == meizi.length ){
                        fs.appendFile("c://a.txt",'所有文件下载完成！', function(err){
                            if(err)
                                console.log("fail " + err);
                            else
                                console.log("所有文件下载完成！");
                        });
                        console.log('全部下载完成！');
                        return false;
                    }
                }, 100);

            } );
        }else{
            console.log('非图片类型文件  跳过');
            i++;
            // console.log(meizi.length);
            // console.log(i == meizi.length);

            if( i< meizi.length +1){
                var imgsrc = 'http://img.hb.aicdn.com/'+meizi[i];
                var filename = parseUrlForFileName(imgsrc);  //生成文件名
                downloadOnce(imgsrc,filename,i);
            }
            if(i == meizi.length ){

                console.log('全部下载完成！');
                return false;
            }
        }

        //调用request的管道来下载到 images文件夹下
        // Fiber(function () {
        //     var httpFiber = Fiber.current;
        //     request(uri).pipe(fs.createWriteStream('images/'+filename+'.'+ ccc )).on('error',callback).on('close', function(){  httpFiber.run();  });  //调用request的管道来下载到 images文件夹下
        //     Fiber.yield();
        // }).run();
    });
};
//
function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};
function parseUrlForFileName(address) {
    var filename = path.basename(address);
    return filename;
}



module.exports = router;
