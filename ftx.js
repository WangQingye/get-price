var request = require('request');
var {sendMail} = require('./utils/email');
var timeMinutes = 15;
var coins = ['LTC', 'BTC', 'ETH', 'BCH', 'EOS', 'BSV', 'ETC']
// {"result": {
//         "close": 66.84,
//         "high": 67.21,
//         "low": 66.74,
//         "open": 67.08,
//         "startTime": "2019-09-24T01:15:00+00:00",
//         "time": 1569287700000,
//         "volume": 4287.8404
//     },
//     "success": true}

function getPrices() {
    let promises = [];
    let results = [];
    coins.forEach(item => {
        promises.push(new Promise((resolve, reject) => {
            request.get(`https://ftx.com/api/futures/${item}-PERP/mark_candles/recent?resolution=${timeMinutes * 60}`, function (err, res, body) {
                body = JSON.parse(body);
                if (body.success) {
                    let {
                        open,
                        close,
                        low,
                        high
                    } = body.result[body.result.length - 2];
                    // console.log(body.result);
                    // console.log(body.result[body.result.length - 2]);
                    // console.log(`${coin}-----open:${open},close:${close}`);
                    // 上影，下影，实体
                    let highNeedle, lowNeedle, substance
                    if (open - close > 0) {
                        // 如果是跌的话那么实体的上影应该是 最高价减去开盘价 (high - open)
                        highNeedle = high - open;
                        lowNeedle = close - low;
                        substance = open - close;
                    } else {
                        // 如果是涨的话那么实体的上影应该是 最高价减去开盘价 (high - close)
                        highNeedle = high - close;
                        lowNeedle = open - low;
                        substance = close - open;
                    }
                    if (highNeedle / substance > 3 && lowNeedle / substance > 3) {
                        // 上下都超3倍，十字针先不管吧
                    } else if (highNeedle / substance > 3) {
                        // 上长针
                        results.push(`${item}上长针`);
                    } else if (lowNeedle / substance > 3) {
                        // 下长针
                        results.push(`${item}下长针`);
                    } else {
                        console.log(`${item}在这段时间什么也没发生`);
                    }
                    resolve();
                } else {
                    reject();
                }
            })
        }))
    })
    Promise.all(promises).then(res => {
        console.log('全部获取完成');
        console.log(results);
        if (results.length) {
            sendMail(results.join(','));
        }
    })
}
setInterval(() => {
    let minute = new Date().getMinutes();
    console.log(minute);
    if (minute % timeMinutes == 0) {
        getPrices();
    }
}, 60000);