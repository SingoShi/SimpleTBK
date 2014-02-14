var server = require('webserver').create();
var system = require('system');
var child_process = require("child_process");
var alimama = require('./alimama')

function parseParam (str) {
    var obj = {};
    if (str == 'undefined') {
        return obj;
    }
    var list = str.split('&');
    for(var i = 0; i < list.length; i++) {
        var key = list[i].split('=')[0];
        var val = list[i].split('=')[1];
        obj[key] = val; 
    }
    return obj;
}

function return404(request, response) {
    response.statusCode = 404;
    response.write('');
    response.close();
}

function handleTbk (response, result) {
    response.statusCode = 200;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.write(JSON.stringify(result.data));
    response.close();
}

//system.stdout.write('username: ');
//var user = system.stdin.readLine();
//var child = child_process.spawn("python",  ["./password.py"]);
//child.stdout.on("data", function (data) {
    //var password = data.replace('\n', '');
    var url = "http://pub.alimama.com/index.htm?spm=0.0.0.0.w2ZucB#!/promo/self/items";
    var loginObj = new alimama.aliLogin(url, '', '');
    loginObj.getTbk();

    var service = server.listen('0.0.0.0:80', function(request, response) {
        console.log(request.url);
        var uri = request.url;
        var app = uri.split('?')[0];
        var param = (uri.split('?').length == 2) ? parseParam(uri.split('?')[1]): {};
        var item_id = (param && param['item_id']) ? param['item_id'] : null;
        console.log('app: ' + app + ', item_id: ' + item_id);
        if (app == '/tbk' && item_id) {
            loginObj.getTbk(item_id, handleTbk, response);
        } else {
            return404(request, response)
        }
    });
//});

