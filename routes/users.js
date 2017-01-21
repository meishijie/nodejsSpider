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
var boardId = '32361210';//画板ID
var folder = '图片';
var url = 'http://huaban.com/boards/'+boardId+'/?wqeds&limit=20';
// 'http://huaban.com/boards/31435061/?max=981353787&limit=20&wfl=1'
var meizi = [];
var allPinId = [];
var lastId = '';
var nowId = '';
var i = 0;
var y = 0;
var countUrlNext = 0;
var endId = '';
var stopImage = '';
var getTxtId = '';
//
var resUse ;
/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('users', { title: '花瓣图片下载', inputTitle:'画板ID： '+req.query.boardId+'正在下载！。。。' });
    // resUse.send(boardId);
    resUse = res;
    var boardId = req.query.boardId;
    y = 0;
    meizi = [];
    allPinId = [];
    lastId = '';
    nowId = '';
    i = 0;
    countUrlNext = 0;
    endId = '';
    stopImage = '';
    getTxtId = '';
    initStart(boardId);
});
router.get('/j', function(req, res, next) {
    fs.readFile("c://a.txt", function(err, data){
        if(err)
            console.log("读取文件fail " + err);
        else{
            // 读取成功时// 输出字节数组// console.log(data);
            res.json({success: iconv.decode(data, 'utf8')});
            // 把数组转换为gbk中文//var str = iconv.decode(data, 'gbk');// console.log(str);
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
    checkFolder(folder+'/'+boardId,folder+'/'+boardId+'/'+'id.txt');
    //执行入口
    //resUse.send(meizi+'读取页面内容中，请稍等。。。');
    writeTxt('准备数据中。。。');
    //对比txt中的图片id和页面中的第一个图片id是否一致  得出是否更新了
    fs.readFile(folder+'/'+boardId+'/'+'id.txt' , function(err, data){
        if(err)
            console.log("文件夹下没有id.txt" + err);
        else{
            console.log('idtxt中的文字为 '+iconv.decode(data, 'utf8'));
            getTxtId = iconv.decode(data, 'utf8');
        }
    });
    download(url);
}
function checkFolder(myid,needTxt) {
    if (fs.existsSync(myid)) {
        console.log('文件夹'+myid+'存在！');
    }else{
        console.log('创建文件夹'+myid);
        fs.mkdirSync(myid, 0777,function() {
            console.log('文件夹'+myid+'创建完毕！');
            if(needTxt != ''){
                fs.writeFile(needTxt, 'go',function() {
                    console.log('文件id.txt创建完毕！');
                });
            }
        });
    }
}
function download( requrl ) {
    //读取页面内容

    request(requrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
             readData(body);
           // console.log(body);
            //读取变化后的url
        }
    })
}
//单个页面下载所有图片
function readData(data) {
    var $ = cheerio.load(data);
    var allstr=[];
    var reg = /app.page\[\"board\"\]([\s\S]*)/g;
    while(tem=reg.exec($.text())){
        allstr = tem[0];
        //console.log(allstr);
    }
    //var regPinId = /\"pin_id\"\:\d{9}/g;
    var regPinId = /\d{9}(?=, \"user_id\")/g;
    var c = 0;
    while(tem=regPinId.exec(allstr)){
        // if( y == 1 && c == 0){
        //     c++;
        //     console.log(tem);
        // }
        //console.log(tem[0]);
        lastId = tem[0];
    }
    // console.log(lastId);    // var reg = /(?<=(key\"\:\")).[-\w]*/g;
    var reg = /\w{32,46}\-\w{6}/g;
    while(tem=reg.exec($.text())){
        c++;
        //从第二批图片地址开始放入数组  第一批图片都为随机图片大概20个
        if( y >= 1 && c>=3){
            meizi.push(tem[0]);
            // console.log(c);
            // console.log(tem[0]);
        }
        //把第一张图片id保存到变量中等待写入txt
        if( y == 1 && c==3){
            endId = tem[0];
        }
    }
    //把图片地址放入meizi数组
    //var meizi = $('img').toArray();
    // console.log(meizi);
    //console.log('lastId = '+lastId);
    if( countUrlNext ==1 ){
        url = 'http://huaban.com/boards/'+boardId+'/?ixse7khz&max='+lastId+'&limit=20&wfl=1';//设置url的地址加上最后一个pin_id
    }else{
        countUrlNext ++;
        url = 'http://huaban.com/boards/'+boardId+'/?ixse7khz&limit=20&wfl=1';//设置url的地址加上最后一个pin_id
    }

    //对比txt中的图片id和页面中的第一个图片id是否一致  得出是否更新了
    // fs.readFile(folder+'/'+boardId+'/'+'id.txt' , function(err, data){
    //     if(err)
    //         console.log("文件夹下没有id.txt" + err);
    //     else{
    //         console.log('idtxt中的文字为 '+iconv.decode(data, 'utf8'));
    //         getTxtId = iconv.decode(data, 'utf8');
    //     }
    // });
    //console.log('getTxtId = '+getTxtId);
    //console.log('endId = '+endId);
    if( endId == getTxtId && getTxtId != '' ){
        console.log('没有更新图片！');
        return false;
    }else{
        if( lastId == nowId ){
            fs.writeFile("c://a.txt",meizi.length+'个图片正在下载中。。。', function(err){
                if(err)
                    console.log("fail " + err);
                else
                    fs.writeFile("c://a.txt",lastId, function(err){});
            });
            i = 0;

            var imgsrc = 'http://img.hb.aicdn.com/'+meizi[i];
            var filename = parseUrlForFileName(imgsrc);  //生成文件名86467e2d8f21f80d42bfa2f5853f649ed32f07cb317af-n0HQ0Y
            console.log('全部搜索完成，准备下载！');
            //把id写入到idtxt中
            fs.writeFile(folder+'/'+boardId+'/'+'id.txt',endId, function(err){
                if(err)
                    console.log("fail " + err);
                else
                    console.log(endId + "写入idtxt成功");
            });

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
            //循环下载url
            y++;
            console.log('准备下一批--------------------');
            download(url);
            // setTimeout(function () {
            //     //循环下载url
            //     y++;
            //     console.log('准备下一批--------------------');
            //     download(url);
            // }, 1000 * 1);
        }
    }

}
function downloadOnce(myurl,fname,myI) {
    downloadImg(myurl,fname,function() { });
}
var downloadImg = function(uri, myfilename, callback){

    request({uri: uri, encoding:'binary'}, function(err, res, body){
        if (!err && res.statusCode == 200) {
            var imageType = res.headers['content-type'].replace(/image\//g ,"").trim();
            console.log('图片类型'+imageType);  //这里返回图片的类型
            if (err) {
                console.log('err: '+ err);
                return false;
            }
            var ic = 'http://img.hb.aicdn.com/'+getTxtId;
            if(ic == uri ){
                console.log('图片下载更新完成！');
                return false;
            }
            if (imageType == 'jpeg'||imageType == 'png'||imageType =='gif' ||imageType =='jpg') {
                //request(uri).pipe(fs.createWriteStream(folder+'/'+boardId+'/'+myfilename+'.'+imageType)).on('close', function(){} );
                fs.writeFile(folder+'/'+boardId+'/'+myfilename+'.'+imageType, body,'binary', function (err) {
                    if (err) {console.log(err);}
                });
                setTimeout(function () {
                    console.log( myfilename+'下载完成');
                    i++;
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
                                fs.writeFile("c://a.txt",lastId, function(err){});
                                console.log("所有文件下载完成！");
                        });
                        console.log('全部下载完成！');
                        return false;
                    }
                }, 1000);
            }else{
                console.log('非图片类型文件  跳过');
                i++;
                if( i< meizi.length +1){
                    var imgsrc = 'http://img.hb.aicdn.com/'+meizi[i];
                    var filename = parseUrlForFileName(imgsrc);  //生成文件名
                    downloadOnce(imgsrc,filename,i);
                }
                if(i == meizi.length ){
                    fs.writeFile("c://a.txt",lastId, function(err){});
                    console.log('全部下载完成！');
                    return false;
                }
            }
        }else{
            setTimeout(function () {
                console.log( '地址有问题跳过');
                i++;
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
            }, 1000);
        }
        // var imageType = res.headers['content-type'].replace(/image\//g ,"").trim();
        // console.log('图片类型'+imageType);  //这里返回图片的类型
        // // console.log('content-length:', res.headers['content-length']);  //图片大小
        // if (err) {
        //     console.log('err: '+ err);
        //     return false;
        // }
        // if (imageType == 'jpeg'||imageType == 'png'||imageType =='gif' ||imageType =='jpg') {
        //     request(uri).pipe(fs.createWriteStream(folder+'/'+boardId+'/'+myfilename+'.'+imageType)).on('close', function(){} );
        //
        //     setTimeout(function () {
        //         console.log( myfilename+'下载完成');
        //         i++;
        //         // console.log(meizi.length);
        //         // console.log(i == meizi.length);
        //         if( i< meizi.length+1 ){
        //             var imgsrc = 'http://img.hb.aicdn.com/'+meizi[i];
        //             var filename = parseUrlForFileName(imgsrc);  //生成文件名
        //             downloadOnce(imgsrc,filename,i);
        //         }
        //
        //         if(i == meizi.length ){
        //             fs.appendFile("c://a.txt",'所有文件下载完成！', function(err){
        //                 if(err)
        //                     console.log("fail " + err);
        //                 else
        //                     console.log("所有文件下载完成！");
        //             });
        //             console.log('全部下载完成！');
        //             return false;
        //         }
        //     }, 100);
        // }else{
        //     console.log('非图片类型文件  跳过');
        //     i++;
        //     // console.log(meizi.length);
        //     // console.log(i == meizi.length);
        //
        //     if( i< meizi.length +1){
        //         var imgsrc = 'http://img.hb.aicdn.com/'+meizi[i];
        //         var filename = parseUrlForFileName(imgsrc);  //生成文件名
        //         downloadOnce(imgsrc,filename,i);
        //     }
        //     if(i == meizi.length ){
        //
        //         console.log('全部下载完成！');
        //         return false;
        //     }
        // }
    });
};
//
function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
}
function parseUrlForFileName(address) {
    var filename = path.basename(address);
    return filename;
}

module.exports = router;
