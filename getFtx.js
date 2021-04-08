var axios = require('axios');
axios.defaults.timeout = 2500;
// var fs = require('fs');

// 添加请求拦截器
axios.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    return config;
  }, function (error) {
      console.log(error)
    // 对请求错误做些什么
    return Promise.reject(error);
  });

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    return response;
  }, function (error) {
    console.log(error)

    // 对响应错误做点什么
    return Promise.reject(error);
  });
// 获取所有交易对
async function getMarkets() {
    let res = await axios.get('https://ftx.com/api/markets')
    // let markets = res.data.result.filter((market) => {
    //     return market.quoteCurrency === 'USDT'
    // })
    let markets = []
    res.data.result.forEach((market) => {
        if (market.quoteCurrency === 'USDT') {
            markets.push(market.baseCurrency)
            // fs.appendFile('test.txt', `${market.baseCurrency}\n`, (err) => {})
        }
    })
    getAllfutures(markets)
   }

async function getAllfutures(markets) {
    let time = new Date().getTime()
    let res = await axios.get('https://ftx.com/api/funding_rates', {
        start_time: time - 60 * 1000,
        end_time: time
    })
    // 去重，取最近的时间
    let futures = []
    res.data.result.forEach(item => {
        let hasIndex = futures.findIndex(f => {
            return f.future === item.future
        })
        // 如果已经有这个交易对了，那么获取最新的
        if (hasIndex !== -1) {
            if (new Date(item.time).getTime() > new Date(futures[hasIndex].time).getTime()) {
                futures[hasIndex] = item
            }
        } else {
            futures.push(item)
        }
    })
    let hasCurrency = futures.filter(market => {
        let currency = market.future.split('-')[0]
        return markets.indexOf(currency) !== -1
       })
       hasCurrency.sort((a,b) => {
           return b.rate - a.rate
       })
   console.log(hasCurrency)
}
getMarkets()
