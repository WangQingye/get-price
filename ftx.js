var request = require('request');
var {
    sendMail
} = require('./utils/email');
var timeMinutes = 15;
var coins = ['LTC', 'BTC', 'ETH', 'BCH', 'EOS', 'BSV', 'ETC'];
var lastBianHash = 0;
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
            // https://ftx.com/api/futures/${item}-PERP/mark_candles/recent?resolution=${timeMinutes * 60}
            request.get({
                url: `https://www.okex.com/api/spot/v3/instruments/${item}-USDT/candles?granularity=${timeMinutes * 60}`,
                proxy: 'http://127.0.0.1:1080'
            }, function (err, res, body) {
                try {
                    body = JSON.parse(body)[1];
                } catch (error) {
                    console.log(error);
                    return;
                }
                if (body) {
                    let [time, open, high, low, close, volume] = body;
                    // console.log(item);
                    // console.log(body);
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
                    // 波动值，如果波动太小，则没有意义
                    let wavePercent = (high - low) / low * 100;
                    // 波动值BTC可以小一点，其他的要达到1%
                    if (wavePercent < 1) {
                        if (item == 'BTC' && wavePercent > 0.5) {} else {
                            console.log(`${item}的波动值${wavePercent}%，波动太小，没有意义`);
                            return;
                        }
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
                        console.log(`${item}足够波动但是无针`)
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
        if (results.length) {
            console.log(results);
            sendMail(results.join(','));
        }
    })
}

function getBian() {
    request({
        url: 'https://explorer.binance.org/api/v1/txs?page=1&rows=15&address=bnb1ultyhpw2p2ktvr68swz56570lgj2rdsadq3ym2&txType=BURN_TOKEN',
        proxy: "http://127.0.0.1:1080"
    }, (err, res, body) => {
        if (err) {
            console.log('err:', err);
        } else {
            try {
                body = JSON.parse(body);
                let now = body.txArray[0].txHash
                if (!lastBianHash) {
                    lastBianHash = now;
                } else if (lastBianHash != now) {
                    sendMail(`币安账户有了新动作`)
                    lastBianHash = now;
                }
                console.log(lastBianHash);
            } catch (error) {
                console.log('error:', error);
            }
        }
    });
}
setInterval(() => {
    let minute = new Date().getMinutes();
    console.log(minute);
    if (minute % timeMinutes == 0) {
        getPrices();
    }
    // getBian();
}, 60000);