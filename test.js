const {
  http
} = require('./http.js')
const {
  writeLine
} = require('./utils/fswrite.js')
const fs = require('fs')

// 某一阶段15分钟蜡烛图
let Candles15 = fs.readFileSync('15.txt', 'utf-8')

// 当前开单和关单index
let openIndex = null
let closeIndex = null

// 当前是否是多单
let isUp = null

// 获取历史蜡烛图
async function getEthCandles() {
  let res = await http.get('https://ftx.com/api/markets/ETH-PERP/candles?resolution=900')
  // findOpenPoint(res.data.result, 0)
  await writeLine('15.txt', JSON.stringify(res.data.result))
}
// 寻找开单点
function findOpenPoint(allCandles, startIndex) {
  for (let index = startIndex; index < allCandles.length; index++) {
    const candle = allCandles[index];
    let flag = testCandle(candle)
  }
}
// 开单策略
function testCandle(candle) {
  let [time, open, high, low, close, volume] = candle;
  // 上影，下影，实体
  let highNeedle, lowNeedle, substance
  if (open - close > 0) {
    // 如果是跌的话那么实体的上影应该是 最高价减去开盘价 (high - open)
    highNeedle = high - open;
    lowNeedle = close - low;
    substance = open - close;
  } else {
    // 如果是涨的话那么实体的上影应该是 最高价减去收盘价 (high - close)
    highNeedle = high - close;
    lowNeedle = open - low;
    substance = close - open;
  }
  // 波动值，如果波动太小，则没有意义
  let wavePercent = (high - low) / low * 100;
  // 波动值BTC可以小一点，其他的要达到1%
  if (wavePercent < 1) {
    if (item == 'BTC' && wavePercent > 0.5) {
      // btc的波动可以小一点去操作，后期可以根据不同币种设置阈值
    } else {
      console.log(`${item}的波动值${wavePercent}%，波动太小，没有意义`);
      return;
    }
  }

  if (highNeedle / substance > 3 && lowNeedle / substance > 3) {
    // 上下都超3倍，十字针先不管吧
    return false
  } else if (highNeedle / substance > 3) {
    // 上长针 - 上涨无力 - 开空
    return 'down'
  } else if (lowNeedle / substance > 3) {
    // 下长针 - 下跌无力 - 开多
    return 'up'
  } else {
    return false
  }
}

console.log(JSON.parse(ethCandle).length)
// getEthCandles()