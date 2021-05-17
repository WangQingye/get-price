// fmz@cc527db022780bba898d8c9f8a09667d
// 当前账户资金
let balance = 1
// 开单情况
let openData = null
// 操作的对应节点
let lastCandle = null
// 初始化函数
function init() {
  // 初始化资金和资金倍数
  exchange.SetContractType("swap")
  let account = exchange.GetAccount()
  balance = account.Balance
  Log('开始等待开仓流程，当前账户余额：', balance);
}

function testClose() {
  let rsi = Number(getLastMinuteRSI().rsi)
  lastCandle = getLastMinuteRSI().lastCandle
  // 如果新的rsi等于上一次的，那么说明本次无波动，无需计算后面的逻辑
  if (rsi === openData.lastRSIs[openData.lastRSIs.length - 1]) return
  Log(rsi, openData.lastRSIs)
  if (openData.lastRSIs.length < 2) {
    openData.lastRSIs.push(rsi)
  } else {
    // 如果是做多，那么RSI应该一直增大，如果连续两次减小，说明趋势结束
    if (openData.direction === 'LONG' && rsi <= openData.lastRSIs[1] && openData.lastRSIs[1] <= openData.lastRSIs[0]) {
      closePosition()
      // 如果是做空，那么RSI应该一直减小，如果连续两次增大，说明趋势结束
    } else if (openData.direction === 'SHORT' && rsi >= openData.lastRSIs[1] && openData.lastRSIs[1] >= openData.lastRSIs[0]) {
      closePosition()
    } else {
      // 如果没有触发条件，那么替换RSI
      openData.lastRSIs[0] = openData.lastRSIs[1]
      openData.lastRSIs[1] = rsi
    }
  }
}

function closePosition() {
  exchange.SetDirection(openData.direction === 'SHORT' ? "closesell" : "closebuy")
  _C(openData.direction === 'SHORT' ? exchange.Buy : exchange.Sell, -1, openData.amount)
  let postions = _C(exchange.GetPosition)
  if (postions.length === 0) {
    Log('平单成功')
    Log('当前蜡烛：', new Date(lastCandle.Time).toLocaleString(), lastCandle)
    let account = _C(exchange.GetAccount)
    balance = account.Balance + account.FrozenBalance
    Log('当前账户资金：', balance)
    openData = null
  }
}

function getLastMinuteRSI() {
  let candles = exchange.GetRecords()
  let rsiArr = TA.RSI(candles, 6)
  return {
    rsi: rsiArr[rsiArr.length - 2].toFixed(2),
    lastCandle: candles[candles.length - 1]
  }
}

// 检测开单
function testOpen() {
  let rsiData = getLastMinuteRSI()
  let rsi = Number(rsiData.rsi)
  lastCandle = rsiData.lastCandle
  // 这里注意算出来的RSI是当前蜡烛的上一条
  if (rsi < LOW_RSI) {
    openPosition('LONG')
  } else if (rsi > HIGH_RSI) {
    openPosition('SHORT')
  }

  function openPosition(direction) {
    exchange.SetMarginLevel(10) //设置杠杆为10倍
    exchange.SetDirection(direction === 'SHORT' ? "sell" : "buy")
    let amount = (balance / (lastCandle.Close * 1.01)).toFixed(1) * 10
    let orderId = _C(direction === 'SHORT' ? exchange.Sell : exchange.Buy, -1, amount)
    Log('当前蜡烛：', new Date(lastCandle.Time).toLocaleString(), lastCandle)
    Log(`开${direction}，订单号：`, orderId, '数量：', amount)
    let postions = _C(exchange.GetPosition)
    openData = {
      price: postions[0].Price,
      amount: postions[0].Amount,
      direction: direction,
      openRSI: rsi,
      lastRSIs: [rsi]
    }
    Log('当前仓位：', postions)
  }
}

// 检测是否需要止损
function testCut() {
  let ticker = _C(exchange.GetTicker)
  let nowPirce = ticker.Last
  let percent = (nowPirce - openData.price) / openData.price
  // 计算是否达到止盈条件，止盈后爆仓次数重置
  // 计算是否应该止损，即本次资金已经亏完
  // 止损条件应该是反向波动达到 1 / 杠杆倍数
  if (openData.direction === 'LONG' && percent < -CUT_PERCENT) {
    closePosition()
    Log('止损平多')
  } else if (openData.direction === 'SHORT' && percent > CUT_PERCENT) {
    closePosition()
    Log('止损平空')
  }
}

function main() {
  // 执行一次初始化
  init()
  // 判断当前是开单状态还是等待开单状态
  while (true && balance > 0) {
    // 在选择的蜡烛图整点操作，比如15分钟线，那么只在15，30，45操作
    if (new Date().getMinutes() % CANDLE_TIME === 0) {
      // 当前的开单状态，暂时只一单一单的做
      if (openData) {
        // 判断是否到平仓条件，10秒钟请求一次
        testClose()
      } else {
        // 没有仓位说明当前是等待开单状态
        // 检查当前是否符合开单条件
        testOpen()
      }
    }
    // 还是止一下损
    if (openData) testCut()
    Sleep(1000 * 5)
  }
  // while (true) {
  //   // 当前的开单状态，暂时只一单一单的做
  //   if (openData) {
  //     // 判断是否到平仓条件，10秒钟请求一次
  //     testClose()
  //     Sleep(1000 * 60 * CANDLE_TIME)
  //   } else {
  //     // 没有仓位说明当前是等待开单状态
  //     // 检查当前是否符合开单条件
  //     testOpen()
  //     Sleep(1000 * 60 * CANDLE_TIME)
  //   }
  // }
  // Sleep(10000)
}