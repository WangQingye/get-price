var request = require('request');
var fs = require('fs');
var url = 'https://api.omniexplorer.info/v1/transaction/address/1';
var addr = '1NTMakcgVwQpMdGxRQnFKyb3G1FAJysSfz';
var lastBlock = 5399051;
var amount = 0;
var sender = ''; // 转出者
var refer = ''; // 接受者
var time = '';

/* ---------------------------------交易所账户----------------------- */
var url1 = 'https://api.omniexplorer.info/v1/address/addr';
var addr1 = '1KYiKJEfdJtap9QX2v9BXJMpz2SfU4pgZw';
/* 用来记录24小时内的价格 */
var accountArr = [];

function getInfo2() {
    request.post({
        url: url1,
        form: {
            addr: addr1
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                let tempNum = JSON.parse(body).balance[0].value.slice(0, 8);
                let time = formatDate(new Date().getTime());
                fs.appendFileSync('./exchangehouse.txt', `${time}:${tempNum}` + "\r\n");
                /* 5分钟一存，48是四小时 */
                if (accountArr.length < 48) {
                    accountArr.push(tempNum);
                } else {
                    /* 替换一个新的 */
                    accountArr.splice(0, 1);
                    accountArr.push(tempNum);
                }
                let maxNum = Math.max(...accountArr);
                let minNum = Math.min(...accountArr);
                let p1 = (tempNum - minNum) / minNum;
                let p2 = (tempNum - maxNum) / maxNum;
                let ratio = Math.abs(p1) > Math.abs(p2) ? p1 : p2;
                if (Math.abs(ratio) > 0.2) {
                    // 从新计算，并保留当前值
                    accountArr = [tempNum];
                    if (ratio > 0) {
                        sendMsg(1, Math.abs(ratio));
                    } else {
                        sendMsg(2, Math.abs(ratio));
                    }
                }
            } catch (error) {
                console.log(error);
            }
        } else {
            console.log('getinfo2 no data');
        }
    })
    setTimeout(getInfo2, 300000);
}

function getInfo() {
    request.post({
        url: url,
        form: {
            addr: addr
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // 每一次转账的区块号为唯一标示
            var lastTrans = JSON.parse(body).transactions[0];
            var block = lastTrans.block;
            if (block !== lastBlock) {
                amount = lastTrans.amount.split('.')[0] / 10000000 + 'KW';
                // 收款账户等于地址说明是转入
                sender = addrToName(lastTrans.sendingaddress);
                refer = addrToName(lastTrans.referenceaddress);
                time = formatDate(lastTrans.blocktime * 1000);
                sendMsg(0);
                lastBlock = block;
            } else {
                console.log('no new trans');
            }
        }
        setTimeout(getInfo, 50000);
    })
}

function sendMsg(flag, ratio) {
    var text;
    switch (flag) {
        case 0:
            text = encodeURI(`【乾坤科技】${time} 从 ${sender} 转了 ${amount} UDT 到 ${refer}`);
            break;
        case 1:
            text = encodeURI(`【乾坤科技】交易所4h内增加了${ratio} 从 ${0} 转了 ${0} UDT 到 ${0}`);
            break;
        case 2:
            text = encodeURI(`【乾坤科技】交易所4h内减少了${ratio} 从 ${0} 转了 ${0} UDT 到 ${0}`);
            break;
        case 3:
            text = encodeURI(`【乾坤科技】脚本哥：${newMsg} 从 ${0} 转了 ${0} UDT 到 ${0}`);
            break;
        default:
            break;
    }
    request.get('http://api.smsbao.com/sms?u=z926665&p=9e141bad8128e8972b768fe4a6dbe8a3&m=13648002084&c=' + text, function (error, response, body) {});
    request.get('http://api.smsbao.com/sms?u=z926665&p=9e141bad8128e8972b768fe4a6dbe8a3&m=18615747976&c=' + text, function (error, response, body) {
        if (error) {
            sendMsg(flag);
        }
    });
};

function addrToName(addr) {
    switch (addr) {
        case '3MbYQMMmSkC3AgWkj9FMo5LsPTW1zBTwXL':
            return '源头';
            break;
        case '1NTMakcgVwQpMdGxRQnFKyb3G1FAJysSfz':
            return '中转站';
            break;
        case '1KYiKJEfdJtap9QX2v9BXJMpz2SfU4pgZw':
            return '屠宰场';
            break;
        default:
            return '未知账号';
            break;
    }
}

function formatDate(date) {
    var date = new Date(date);
    var year = date.getFullYear();
    var month = date.getMonth() + 1; //js从0开始取
    var date1 = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var second = date.getSeconds();
    return year + "年" + month + "月" + date1 + "日" + hour + "时" + minutes + "分" + second + "秒";
}

/* ---------------------------------脚本哥----------------------- */
const cheerio = require('cheerio');
// 脚本哥最新的一条，每次去对比，不一样了就发送短信
var newMsg = '';

function getInfo3() {
    request('https://www.tradingview.com/u/qmty/', (err, res, body) => {
        console.log(err);
        if (err) {
            getInfo3();
            return;
        }
        var $ = cheerio.load(body.toString());
        let temp = $('.tv-widget-idea__title-name')[0].children[0].data;
        if (temp !== newMsg) {
            newMsg = temp;
            sendMsg(3);
            console.log('new');
        }
        setTimeout(getInfo3, 300000);
    });
}

getInfo();
getInfo2();
getInfo3();