const {
  http
} = require('./http.js')
const {
  writeLine
} = require('./utils/fswrite.js')
async function getEthCandles() {
  let res = await http.get('https://ftx.com/api/markets/ETH-PERP/candles?resolution=900')
  res.data.result.forEach(candle => {
    let [time, open, high, low, close, volume] = candle;
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
  })
}
// getEthCandles()
writeLine('test.txt', 'test')
console.log(writeLine);