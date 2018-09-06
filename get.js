var request = require('request');
var url = 'https://api.omniexplorer.info/v1/transaction/address/1';
var addr = '1NTMakcgVwQpMdGxRQnFKyb3G1FAJysSfz';
var lastBlock = 5399051;
var amount = 0;
var sender = ''; // 转出者
var refer = ''; // 接受者
var time = '';

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
                sendMsg();
                lastBlock = block;
            } else {
                console.log('no new trans');
            }
        }
        setTimeout(getInfo, 5000);
    })
}

function sendMsg() {
    var text = encodeURI(`【乾坤科技】${time} 从 ${sender} 转了 ${amount} UDT 到 ${refer}`);
    request.get('http://api.smsbao.com/sms?u=z926665&p=9e141bad8128e8972b768fe4a6dbe8a3&m=13648002084&c=' + text, function (error, response, body) {});
    request.get('http://api.smsbao.com/sms?u=z926665&p=9e141bad8128e8972b768fe4a6dbe8a3&m=18615747976&c=' + text, function (error, response, body) {});
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
getInfo();