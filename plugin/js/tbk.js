if (!chrome.runtime) {
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}

Rebate = {
    start: function() {
        url = document.location.href;
        var res = Rebate.checkURL(url);
        if(res === false) {
            return;
        }
        if ('ju' != res && 'spu' != res && 'a.m' != res) {
            res = 'item';
        }
        var item_id = Rebate.getItemId(url, res);
        //alert(item_id);
        if(item_id === false) {
            return;
        }
        chrome.runtime.sendMessage({method: "getAuction", itemid: item_id, url: url}, function(obj) {
            Rebate.initEasyDarg(obj);
        });
    },
    initEasyDarg: function(obj) {
        var width = document.body.clientWidth - 200;
        var div = document.createElement('div');
        div.id = 'dragbox';
        try {
            document.body.appendChild(div);
        } catch (e) {
            document.appendChild(div);
        }
        var c_url = obj.click_url == null ? '#' : obj.click_url;
        var c_rate = obj.commission_rate == null ? '0' :(obj.commission_rate/100).toFixed(2);
        var html = '<a href="' + c_url + '"> 返利' + c_rate + '%</a>';
        $('#dragbox').html(html);
        $('#dragbox').attr('style','background-color: yellow; padding: 15px; border: 2px solid orange; width: 180px; cursor: move; position: absolute; z-index: 10000000000; top: 250px; left: ' + width + 'px;');
        $("#dragbox").draggable();
    },
    getItemId: function(url, key) {
        var itemIDPattern = {
            "ju": ["item_id\\=\\d+", "itemId\\=\\d+"],
            "spu": ["default_item_id=\d+", {
                "pattern": "spu-\d+-\d+",
                "delimiter": "-",
                "offset": "2"
            }],
            "item": ["id=\\d+", "item_num=\\d+", "item_num_id=\\d+", "item_id=\\d+"],
            "a.m": ["i\\d+"]
        };
        var patterns = itemIDPattern[key];
        for (var i = 0; i < patterns.length; i++) {
            var pattern = patterns[i];
            var offset = 1;
            var delimiter = '=';
            if (Object == typeof(pattern)) {
                pattern = pattern.pattern;
                offset = pattern.offset;
                delimiter = pattern.delimiter;
            }
            var matches = url.match(pattern);
            if (matches) {
                if ('a.m' == key) {
                    return matches[0].replace("i", "");
                } else {
                    return matches[0].split(delimiter)[offset];
                }
            }
        }
        return false;
    },
    checkURL: function(url) {
        var pattern = "^(http|https)://(item|item\\.beta|item\\.lp|ju|detail|chaoshi|spu|a.m)\\.(taobao|tmall)\\.com/";
        var matches = url.match(new RegExp(pattern, 'i'));
        if(matches) {
            return matches[2];
        }
        return false;
    }  
};
Rebate.start();
