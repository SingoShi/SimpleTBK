
// decorate a function with more argument
function funcCreator() {
    var func = arguments[0];
    var args = [].slice.call(arguments, 1);
    var newFunc = function () {
        return func.apply(null, args);
    };
    return newFunc;
}

function getCookie(url, name, _onGetTbToken, _drawPopup) {
    var findCookie = false;
    chrome.cookies.get({url: url, name: name}, function(cookie) {
        if (cookie) {
            console.log("get cookie for " + url + "." + name + cookie.value);
            findCookie = true;
            _onGetTbToken(cookie.value, _drawPopup);
        }
    });
    if (!findCookie) {
        if (_drawPopup) {
            _drawPopup([]);
        }
        //genNotify('', 'No Cookie Found', 'Please login alimama');
    }
}

function genNotify(icon, body, msg) {
    var notification = webkitNotifications.createNotification(icon, body, msg);
    notification.show();
    window.setTimeout(function(){ notification.cancel(); }, 3000);
}

function getAdZones(xhr, _drawPopup) {
    if (xhr.readyState == 4) {
        if (xhr.status == 200) {
            try {
                var adZonesObj = JSON.parse(xhr.responseText);
            } catch(err) {
                var adZonesObj = null;
            }
            if (adZonesObj && adZonesObj.data) {
                var adzones = []
                if (adZonesObj.data.appAdzones) {
                    adzones = adzones.concat(adZonesObj.data.appAdzones);
                }
                if (adZonesObj.data.otherAdzones) {
                    adzones = adzones.concat(adZonesObj.data.otherAdzones);
                }
                if (adZonesObj.data.webAdzones) {
                    adzones = adzones.concat(adZonesObj.data.webAdzones);
                }
                localStorage['AdZones'] = JSON.stringify(adzones);
                if (_drawPopup) {
                    _drawPopup(adzones);
                }
            } else {
                genNotify('', 'No AdZone Found', 'Please login alimama, and create your own adzones');
                if (_drawPopup) {
                    _drawPopup([]);
                }
            }
        }
    }
}

function onGetTbToken(tbToken, _drawPopup) {
    localStorage['TbToken'] = tbToken;
    var URL = 'http://pub.alimama.com/common/adzone/newSelfAdzone2.json?tag=29&t=' + new Date().getTime() + '&_tb_token_=' + tbToken;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", URL, true);
    xhr.onreadystatechange = funcCreator(getAdZones, xhr, _drawPopup);
    xhr.send()
}

function drawPopup(adzones) {
    var currentZone = localStorage['CurrentZone'];
    var menu = $('.menu');
    menu.empty();
    for (var i = 0; i < adzones.length; i++) {
        for(var j = 0; j < adzones[i].sub.length; j++) {
            var zonename = adzones[i].name + '_' + adzones[i].sub[j].name;
            var html = '<div class="item">';
            if (currentZone == zonename || !currentZone) {
                html += '<div class="adzone icon fa fa-check-square-o"></div>';
                if (!currentZone) {
                    currentZone = localStorage['CurrentZone'] = zonename;
                    localStorage['SelectedAdzoneId'] = adzones[i].id;
                    localStorage['SelectedSiteId'] = adzones[i].sub[j].id;
                }
                var tmp = adzones[i].name.split('_');
                localStorage['MemberId'] = tmp[tmp.length - 1];
            } else {
                html += '<div class="adzone icon fa fa-square-o"></div>';
            }
            html += '<div adzoneid=' + adzones[i].id + ' siteid=' + adzones[i].sub[j].id + ' style="display: inline-block;">' + zonename + '</div>';
            html += '</div>';
            var item = $(html);
            menu.append(item);
        }
    }
    menu.append($('<div class="separator"></div>'));
    menu.append($('<div class="item"><a class="alimamaLogin" href="http://www.alimama.com/member/login.htm">Alimama Login</a></div>'));
    menu.append($('<div class="separator"></div>'));
    menu.append($('<div class="item"><a href="">about</a></div>'));
    $('.adzone').click(function() {
        $('.fa-check-square-o').attr('class', 'adzone icon fa fa-square-o');
        $(this).attr('class', 'adzone icon fa fa-check-square-o');
        localStorage['CurrentZone'] = $(this).next().html();
        localStorage['SelectedAdzoneId'] = $(this).next().attr('adzoneid');
        localStorage['SelectedSiteId'] = $(this).next().attr('siteid');
    });
    $('.alimamaLogin').click(function() {
        chrome.tabs.create({"url":$(this).attr('href'), "selected":true});
    })
}

function loadAdzons(_drawPopup) {
    var content = localStorage['AdZones'];
    try {
        var adZoneObjs = JSON.parse(content);
    } catch (err) {
        adZoneObjs = []
    }
    if (adZoneObjs.length == 0) {
        getCookie('http://pub.alimama.com', '_tb_token_', onGetTbToken, _drawPopup)
    } else {
        if (_drawPopup) {
            _drawPopup(adZoneObjs);
        }
    }
}

function init() {
    loadAdzons(drawPopup);
}

window.onload = init;
