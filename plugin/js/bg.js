if (!chrome.runtime) {
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}

function funcCreator() {
    var func = arguments[0];
    var args = [].slice.call(arguments, 1);
    var newFunc = function () {
        return func.apply(null, args);
    };
    return newFunc;
}

function genNotify(icon, body, msg) {
    var options = {
        type: "basic",
        message: msg,
        title: body,
        iconUrl: icon
    };
    var notification = chrome.notifications.create("", options, function cb(id) {});
    window.setTimeout(function() { chrome.notifications.clear(notification, function cb(wasCleared) {}); }, 3000);
}

if (!localStorage['TbToken'] || !localStorage['SelectedAdzoneId'] || !localStorage['SelectedSiteId']) {
    loadAdzons();
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "alimamaLogin") {

    } else if (request.method == "getAuction") {
        //sendResponse({click_url: 'test', commission_rate: 6});
        if (localStorage['MemberId'] && request.url.indexOf(localStorage['MemberId']) != -1) {
            return;
        }
        if (!localStorage['TbToken'] || !localStorage['SelectedAdzoneId'] || !localStorage['SelectedSiteId']) {
            loadAdzons();
        }

        if (localStorage['SelectedAdzoneId'] && localStorage['SelectedSiteId'] && localStorage['TbToken']) {
            var xhr = new XMLHttpRequest();
            var itemid = request.itemid;
            var auctionCodeObj = null;
            var auctionListObj = null;

            try {
                //getAuctionCode
                var URL = "http://pub.alimama.com/common/code/getAuctionCode.json?auctionid=" + itemid;
                URL += "&adzoneid=" + localStorage['SelectedAdzoneId'] + "&siteid=" + localStorage['SelectedSiteId'] + "&t=" + new Date().getTime() + "&_tb_token_=" + localStorage['TbToken'] + "&_input_charset=utf-8";
                xhr.open("GET", URL, false);
                //xhr.onreadystatechange = funcCreator(getAuctionCode, xhr, auctionCodeObj);
                xhr.send();
                if (xhr.status == 200) {
                    try {
                        auctionCodeObj = JSON.parse(xhr.responseText);
                    } catch (err) {
                        auctionCodeObj = null;
                    }
                }

                //searchAuctionList
                URL = "http://pub.alimama.com/pubauc/searchAuctionList.json?q=" + encodeURIComponent(request.url);;
                URL += "&t=" + new Date().getTime() + "&_tb_token_=" + localStorage['TbToken'];
                URL += "&toPage=1&perPagesize=40";
                xhr.open("GET", URL, false);
                //xhr.onreadystatechange = funcCreator(getAuctionList, xhr);
                xhr.send()
                if (xhr.status == 200) {
                    try {
                        auctionListObj = JSON.parse(xhr.responseText);
                    } catch(err) {
                        auctionListObj = null;
                    }
                }
            } catch (err){
            }

            // response
            var respObj = {}
            if (auctionListObj &&
                    auctionListObj.data) {
                if (auctionListObj.data.pagelist &&
                    auctionListObj.data.pagelist.length == 1) {
                    var commissionRatePercent = auctionListObj.data.pagelist[0].commissionRatePercent;
                    var calCommission = auctionListObj.data.pagelist[0].calCommission;
                    if (auctionCodeObj.data && auctionCodeObj.data.eliteUrl) {
                        var clickUrl = auctionCodeObj.data.eliteUrl;
                        respObj.click_url = clickUrl;
                        respObj.commission_rate = commissionRatePercent * 100;
                        respObj.cal_commission = calCommission;
                        sendResponse(respObj);
                    } else {
                        genNotify('', 'Auction Code Error', 'Please login alimama, and create your own adzones');
                    }
                } else {
                    sendResponse({});
                }
            } else {
                genNotify('', 'Get Auction List Error', 'Please login alimama, and create your own adzones');
            }

        } else {
            genNotify('', 'No AdZone Found', 'Please login alimama, and create your own adzones');
        }
    }
});
