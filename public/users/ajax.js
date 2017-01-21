/**
 * Created by higou on 2017/1/12.
 */
$(function(){
    var params ={
        username: $("#username").val(),
        password: $("#password").val()
    };

    setInterval("aj()",5000);

});
function aj() {
    $.ajax({
        data: {},
        url: '/users/j',
        type:'get',
        dataType: 'json',
        cache: false,
        timeout: 1000,
        success: function(data){
            //var tt = $.parseJSON(data);
            // for(i in data ){
            //     alert(i);           //获得属性
            //     alert(data[1]);  //获得属性值
            // }
            //alert(data['success']);
            $("#allBoard").text(data['success']);
            //alert(data.toString());
        },
        error: function(jqXHR, textStatus, errorThrown){
            //alert( errorThrown);
        }
    });
}