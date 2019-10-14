var request = require('request');
var { sendMail } = require('./mail.js');
var nowprice1 = 0;
var nowprice2 = 0;
var lastBianHash = 0;
function getAccount()
{
    request({
        url: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x6f259637dcd74c767781e37bc6133cd6a68aa161&address=0xfa4b5be3f2f84f56703c42eb22142744e95a2c58&tag=latest&apikey=YourApiKeyToken',
        proxy: "http://127.0.0.1:1080"
    }, (err, res, body) =>
    {
        if (err) {
            console.log('err:', err);
        } else {
            try {
                body = JSON.parse(body);
                let now = body.result.slice(0, -18);
                console.log(now);
                if (!nowprice1) {
                    nowprice1 = now;
                } else if (nowprice1 != now) {
                    let gap = now - nowprice1;
                    if (Math.abs(gap) > 1000000) {
                        let text = gap > 0 ? '转入' : '转出';
                        sendMail(`中转账户${text}了${Math.abs(gap)}的HT`)
                    }
                }
            } catch (error) {
                console.log('error:', error);
            }
        }
        setTimeout(getAccount, 30000);
    });
}
function getAccount1()
{
    request({
        url: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x6f259637dcd74c767781e37bc6133cd6a68aa161&address=0x0000000000000000000000000000000000000000&tag=latest&apikey=YourApiKeyToken',
        proxy: "http://127.0.0.1:1080"
    }, (err, res, body) =>
    {
        if (err) {
            console.log('err:', err);
        } else {
            try {
                body = JSON.parse(body);
                let now = body.result.slice(0, -18);
                console.log(now);
                if (!nowprice2) {
                    nowprice2 = now;
                } else if (nowprice2 != now) {
                    let gap = now - nowprice2;
                    if (Math.abs(gap) > 1000000) {
                        let text = gap > 0 ? '转入' : '转出';
                        sendMail(`重点账户${text}了${Math.abs(gap)}的HT`)
                    }
                }
            } catch (error) {
                console.log('error:', error);
            }
        }
        setTimeout(getAccount1, 30000);
    });
}
function getBian()
{
    request({
        url: 'https://explorer.binance.org/api/v1/txs?page=1&rows=15&address=bnb1ultyhpw2p2ktvr68swz56570lgj2rdsadq3ym2&txType=BURN_TOKEN',
        proxy: "http://127.0.0.1:1080"
    }, (err, res, body) =>
    {
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
                }
                console.log(lastBianHash);
            } catch (error) {
                console.log('error:', error);
            }
        }
        setTimeout(getBian, 30000);
    });
}
getAccount1();
getAccount();
getBian();