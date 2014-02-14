
Function.prototype.bind = function () {
    if (arguments.length < 2 && (typeof arguments[0]==='undefined')) {
        return this;
    }
    var _slice = Array.prototype.slice;
    var __method = this, args = _slice.call(arguments,0), context = args.shift();
    return function() {
        return __method.apply(context, args.concat(_slice.call(arguments,0)));
    }
}

Function.prototype.delay = function() {
    if (arguments.length < 2 && (typeof arguments[0]==='undefined')) {
        return this;
    }
    console.log('delay: ' + arguments[0]);
    var __method = this;
    var delayFun = function() {
        setTimeout(__method, arguments[0]);
    };
    return delayFun;
}

function enterLoginPage(status) {
    console.log(new Date().getTime() + ': enter enterLoginPage');
    if (status != 'success') {
        console.log('get url: ' + this.loginURL + ' failed');
        this.returnResult({error: -3});
        return ;
    }
    var checkLogin = this.checkLoginPage();
    if (checkLogin == 1) {
        this.injectJQuery();
        var loginUrl = this.page.evaluate(function () {
            return $('#content').find('iframe').attr('src');
        });
        console.log('get login url: ', loginUrl);
        this.doLogin(loginUrl);
    } else if(checkLogin == 0){
        console.log('enter query page');
        var token = false;
        var ts = false;
        if (this.queryCTX.itemId) {
            for (var i = 0; i < this.page.cookies.length; i++) {
                if (this.page.cookies[i].name == '_tb_token_') {
                    this.canQuery = true;
                    var token = this.page.cookies[i].value;
                    var ts = new Date().getTime();
                }
            }
            if (this.canQuery && token && ts) {
                this.doQuery(token, ts, this.queryCTX.itemId);
            } else {
                console.log('can not get token');
                this.returnResult({error: -5});
            }
        }
    } else {
        console.log('enter unkonw page, update your app');
        this.returnResult({error: -2});
    }
    return ;
}

function generalTimeout() {
    console.log('timeout when get query page');
    console.log(this.page.url);
    console.log(this.page.content);
    //console.log('ul style: ' + this.getAttr("ul.dropdown-list", 'style'));
    //console.log('search type: ' + this.getAttr("input[name='searchType']", 'value'));
    //console.log('query: ' + this.getAttr("#q", 'value'));
    this.returnResult({error: -1});
}

function getAuctionCode() {
    if (status != 'success') {
        console.log('get url: ' + this.page.url + ' failed');
        this.returnResult({error: -7});
        return ;
    }
    var auctionCode = this.page.content;
    console.log(this.page.content);
    var auctionCodeObj = JSON.stringify(auctionCode);
    if(auctionCodeObj &&
            auctionCodeObj.data &&
            auctionCodeObj.data.clickUrl) {
        this.queryCTX.result['data']['click_url'] = auctionCodeObj.data.clickUrl;
        console.log('click_url: ' + this.queryCTX.result['data']['click_url']);
        this.returnResult(this.queryCTX.result);
    } else {
        this.returnResult({error: -8});
    }
}

function getSearchAuctionList() {
    if (status != 'success') {
        console.log('get url: ' + this.page.url + ' failed');
        this.returnResult({error: -3});
        return ;
    }
    var searchAuctionList = this.page.content;
    console.log(this.page.content);
    var searchAuctionListObj = JSON.stringify(searchAuctionList);
    if (searchAuctionListObj && 
            searchAuctionListObj.data && 
            searchAuctionListObj.data.pagelist && 
            searchAuctionListObj.data.pagelist.length == 1) {
        var commissionRatePercent = searchAuctionListObj.data.pagelist[0].commissionRatePercent;
        console.log(commissionRatePercent);
        this.queryCTX.result = {
            error: 0,
            data: {
                commission_rate: commissionRatePercent
            }
        }
        var auctionCodeURL = this.getAuctionCodeURL;
        auctionCodeURL += '?auctionid=' + this.queryCTX.itemId + '&adzoneid=' + this.adzoneid;
        auctionCodeURL += '&siteid=' + this.siteid + '&t=' + new Date().getTime() + '&_tb_token_=' + this.queryCTX.token;
        this.page.open(auctionCodeURL, getAuctionCode.bind(this));
    } else {
        this.returnResult({error: -6});
    }
}

function onCodeAreaError(msg, trace) {
    var content = this.page.content;
    var matches = content.split("textarea");
    if (matches.length == 4) {
        this.queryCTX.result['data']['click_url'] = matches[2].split('>')[1].split('<')[0];
        console.log('click_url: ' + this.queryCTX.result['data']['click_url']);
        this.returnResult(this.queryCTX.result);
    } else {
        this.returnResult({error: -4});
    }
    this.page.onError = null;
};

function onCodeArea(status) {
    if (status != 'success') {
        this.page.onError = onCodeAreaError.bind(this);
    } else {
        this.queryCTX.result['data']['click_url'] = this.getHtml('#J_codeArea');
        this.returnResult(this.queryCTX.result);
    }
}

function onPopUp() {
    this.click("a[mx-owner='vf-dialog']", '#vf-dialog');
    this.waitFor('#magix_vf_code', null, onCodeArea.bind(this), generalTimeout.bind(this), 1000);
}

function onResultPage() {
    console.log('on result page');
    console.log('query: ' + this.getAttr("#q", 'value'));
    var commission_rate = this.page.evaluate(function () {
        var tr = $('#J_item_list').find('tbody').find('tr:first');
        if (tr.length > 0) {
            var td = tr.find('td');
            var ret = '';
            td.each(function (index) {
                if (index == 3) {
                    ret = $(this).find('span').html();
                }
            });
            return ret;
        } else {
            return '';
        }
    });
    console.log('commission_rate: ' + commission_rate);
    this.queryCTX.result = {
        error: 0,
        data: {
            commission_rate: (commission_rate.split('%')[0]) * 100
        }
    }
    this.click('#J_item_list.btn');
    this.waitFor('#vf-dialog', onPopUp.bind(this), generalTimeout.bind(this), 1000);
    //var query_url = "http://u.alimama.com/union/spread/common/allCode.htm?specialType=item&auction_id=" + this.queryCTX.itemId;
    //this.page.open(query_url, onCodeArea.bind(this));

}

exports.aliLogin = function(loginURL, user, password) {
    this.loginURL = loginURL;
    this.searchAuctionListURL = 'http://pub.alimama.com/pubauc/searchAuctionList.json';
    this.getAuctionCodeURL = 'http://pub.alimama.com/common/code/getAuctionCode.json';
    this.adzoneid=15964722;
    this.siteid=5312357;
    this.user = user;
    this.password = password;
    this.page = require('webpage').create();
    this.canQuery = false;
    this.page.viewportSize = { width: 1360, height: 768 };
    this.page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.57 Safari/537.17';
};

exports.aliLogin.prototype = {
    returnResult: function(result) {
        if (result.error != 0) {
            this.canQuery = false;
        }
        if(this.queryCTX && this.queryCTX.callback) {
            this.queryCTX.callback(this.queryCTX.param, result);
        }
        this.queryCTX = {};
        this.page.content = '';
    },
    isIdle: function() {
        return this.queryCTX != {};
    },
    injectJQuery: function() {
        var unInjected = this.page.evaluate(function () {
            return (typeof window.jqueryInjected) === 'undefined';
        });
        if (unInjected) {
            this.page.injectJs('./jquery.min.js');
        }
        this.page.evaluate(function () {
            window.jqueryInjected = true;
        });
    },
    waitFor: function(selector, scope, onReady, onTimeout, timeout) {
        var testfn = function(selector, scope) {
            return this.domExists(selector, scope);
        }.bind(this);
        var start = new Date().getTime();
        var condition = false;
        var interval = setInterval(function() {
            if((new Date().getTime() - start < timeout) && !condition) {
                condition = testfn(selector, scope);
            } else {
                clearInterval(interval);
                if(!condition) {
                    onTimeout();
                } else {
                    onReady();
                }
            }
        }, 250);
    },
    domExists: function(selector, scope) {
        this.injectJQuery();
        return this.page.evaluate(function (selector, scope) {
            if (scope) {
                if ($(scope).length > 0) {
                    return $(scope).find(selector).length > 0;
                } else {
                    return false;
                }
            } else {
                return $(selector) && $(selector).length > 0;
            }
        }, selector, scope);
    },
    getPosition: function(selector) {
        this.injectJQuery();
        var pos = this.page.evaluate(function (selector) {
            var el = $(selector);
            var x = 0, y = 0;
            x = (el.offset().left + el.width() / 2);
            y = (el.offset().top + el.height() / 2);
            return [x, y];
        }, selector);
        return pos;
    },
    getBounds: function(selector) {
        var pos = this.page.evaluate(function (selector) {
            var el = document.querySelector(selector);
            var bounds = el.getBoundingClientRect();
            return bounds;
        }, selector);
        return pos;
    },
    fillContent: function(selector, scope, content, pos2) {
        if (this.domExists(selector, scope)) {
            var pos = pos2 ? pos2: this.getPosition(selector);
            if (pos != null) {
                console.log(selector+ ' pos: [' + pos[0] + ',' + pos[1] + ']');
                this.page.sendEvent.apply(this.page, ['click'].concat(pos));
                this.page.sendEvent.apply(this.page, ['keypress', content]);
            } else {
                console.log(selector+ ' position not found to fill');
            }
        } else {
            console.log(selector+ ' not found to fill');
        }
    },
    click: function(selector, scope, pos2) {
        if (this.domExists(selector, scope)) {
            var pos = pos2 ? pos2: this.getPosition(selector);
            if (pos != null) {
                console.log(selector+ ' pos: [' + pos[0] + ',' + pos[1] + ']');
                this.page.sendEvent.apply(this.page, ['click'].concat(pos));
            } else {
                console.log(selector+ ' position not found to click');
            }
        } else {
            console.log(selector+ ' not found for click');
        }
    },
    getAttr: function(selector, str) {
        this.injectJQuery();
        return this.page.evaluate(function (selector, str) {
            return $(selector).attr(str);
        }, selector, str);
    },
    setAttr: function(selector, str, val) {
        this.injectJQuery();
        this.page.evaluate(function (selector, str, val) {
            $(selector).attr(str, val);
        }, selector, str, val);
    },
    getHtml: function(selector) {
        this.injectJQuery();
        return this.page.evaluate(function (selector) {
            return $(selector).html();
        }, selector);
    },
    setHtml: function(selector, val) {
        this.injectJQuery();
        return this.page.evaluate(function (selector, val) {
            return $(selector).html(val);
        }, selector, val);
    },
    fillUserPass: function() {
        if (this.getAttr('#TPL_username_1', 'value') != '') {
            this.setAttr('#TPL_username_1', 'value', '');
        }
        this.fillContent('#TPL_username_1', null, this.user);
        console.log('user: ' + this.getAttr('#TPL_username_1', 'value'));
        this.fillContent('#TPL_password_1', null, this.password);
        //console.log('password: ' + this.getAttr('#TPL_password_1', 'value'));
        //then(param);
        this.injectJQuery();
        //this.page.evaluate(function () {
        //    $('#J_SubmitStatic').click();
        //});
        this.click('#J_SubmitStatic');
    },
    doLogin: function(loginUrl) {
        this.page.open(loginUrl, function(status) {
            if (status != 'success') {
                console.log('open login url failed');
                this.returnResult({error: -3});
                return ;
            }
            this.injectJQuery();
            setTimeout(this.fillUserPass.bind(this), 500);
            //setTimeout(this.fillUserPass.bind(this), 1000, this.click.bind(this), ['#J_SubmitStatic', null, [680, 145]]);
            this.waitFor('#magix_vf_root', null, enterLoginPage.bind(this), generalTimeout.bind(this), 20000);
            
        }.bind(this));
    },
    checkLoginPage: function() {
        // 1: login page, 0: query page, -1: unknow page
        this.injectJQuery();
        return this.page.evaluate(function() {
            if ($('#q').length > 0) {
               return 0;
            } else if ($('#content').find('iframe').length > 0) {
               return 1;
            } else {
               return -1;
            }
        });
    },
    doQuery: function(token, ts, itemid) {
        //this.injectJQuery();
        //this.setAttr("input[name='searchType']", 'value', '3');
        //this.setAttr("#q", 'searchtype', '3');
        //this.setAttr("#q", 'value', 'id=' + this.queryCTX.itemId);
        //setTimeout(this.click.bind(this), 1000, 'a.search-btn');
        //this.waitFor('#J_item_list', null, onResultPage.bind(this), generalTimeout.bind(this), 10000);
        var searchAuctionListURL = this.searchAuctionListURL;
        searchAuctionListURL += '?q=id%3D' + itemid + '&t=' + ts + '&_tb_token_=' + token;
        console.log(searchAuctionListURL);
        this.queryCTX.token = token;
        this.page.open(searchAuctionListURL, getSearchAuctionList.bind(this))
    },
    getTbk: function(itemId, cb, param) {
        this.queryCTX = {
            itemId: itemId,
            param: param,
            callback: cb
        };
        console.log(new Date().getTime() + ': try to open url ' + this.loginURL);
        this.page.open(this.loginURL, enterLoginPage.bind(this));
    }
};
