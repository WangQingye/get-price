// fmz@8d18119f273c0488d131dbd6df48afb1
// 当前账户资金
let balance = 1
// 开单情况
let openData = null
// 操作的对应节点
let lastCandle = null
// 胜率计算
let winStatus = {
  winTime: 0,
  loseTime: 0,
  totalTime: 0,
  // 连续失败次数
  continueFailTime: 0,
  // 最大连续失败次数
  maxContinueFailTime: 0
}



// 初始化函数
function init() {
  // 初始化资金和资金倍数
  exchange.SetContractType("swap")
  let account = exchange.GetAccount()
  nowMargin = MARGIN_LEVEL
  balance = account.Balance
  Log('开始等待开仓流程，当前账户余额：', balance);
}

function testClose() {
  let signal = getSignal()
  if (signal === 'CLOSE-SHORT') {
    closePosition()
  } else if (signal === 'CLOSE-LONG') {
    closePosition()
  }
}

function closePosition() {
  exchange.SetDirection(openData.direction === 'SHORT' ? "closesell" : "closebuy")
  _C(openData.direction === 'SHORT' ? exchange.Buy : exchange.Sell, -1, openData.amount)
  let postions = _C(exchange.GetPosition)
  if (postions.length === 0) {
    Log('平单成功')
    Log('当前蜡烛：', new Date(lastCandle.Time).toLocaleString(), lastCandle)
    // 开单前资金
    let oldBalance = balance
    // 平单后资金
    let account = _C(exchange.GetAccount)
    balance = account.Balance + account.FrozenBalance
    if (balance > oldBalance) {
      winStatus.winTime++
      winStatus.continueFailTime = 0
    } else {
      winStatus.loseTime++
      winStatus.continueFailTime++
      if (winStatus.continueFailTime > winStatus.maxContinueFailTime) {
        winStatus.maxContinueFailTime = winStatus.continueFailTime
      }
    }
    Log('当前账户资金：', balance)
    Log('胜率情况：', winStatus)
    openData = null
  }
}

function getSignal() {
  let candles = exchange.GetRecords()
  lastCandle = candles[candles.length - 1]
  let EMA5 = TA.EMA(candles, 5)
  let EMA10 = TA.EMA(candles, 10)
  let MACD = TA.MACD(candles, 12, 26, 9)
  let RSI = TA.RSI(candles, 6)
  let KDJ = TA.KDJ(candles, 9, 3, 3)
  let emaData = {
    5: EMA5.slice(-3, -1),
    10: EMA10.slice(-3, -1)
  }
  let kdjData = {
    k: KDJ[0][KDJ[0].length - 2],
    d: KDJ[1][KDJ[1].length - 2],
    j: KDJ[2][KDJ[2].length - 2]
  }
  if (isMacdDownCross(MACD)) return openData && openData.direction === 'LONG' ? 'CLOSE-LONG' : 'SHORT'
  if (isMacdUpCross(MACD)) return openData && openData.direction === 'SHORT' ? 'CLOSE-SHORT' : 'LONG'
  // if (openData && kdjData.j < 20) return 'CLOSE-SHORT'
  // if (kdjData.j < 0) return 'LONG'
  // if (openData && kdjData.j > 80) return 'CLOSE-LONG'
  // Log('5:', EMA5.slice(-3, -1))
  // Log('10:', EMA10.slice(-3, -1))
  // Log('RSI', RSI.slice(-5))
  // Log('K', KDJ[0].slice(-5))
  // Log('D', KDJ[1].slice(-5))
  // Log('J', KDJ[2].slice(-5))
}

// 检测开单
function testOpen() {
  let signal = getSignal()
  if (signal === 'SHORT') {
    openPosition('SHORT')
  } else if (signal === 'LONG') {
    // openPosition('LONG')
  }
}

function openPosition(direction) {
  // nowMargin = MARGIN_LEVEL * Math.pow(2, winStatus.continueFailTime)
  Log('当前杠杆数：', nowMargin)
  exchange.SetMarginLevel(nowMargin) //设置杠杆为10倍
  exchange.SetDirection(direction === 'SHORT' ? "sell" : "buy")
  let amount = (balance / (lastCandle.Close * 1.01)).toFixed(1) * nowMargin
  let orderId = _C(direction === 'SHORT' ? exchange.Sell : exchange.Buy, -1, amount)
  Log('当前蜡烛：', new Date(lastCandle.Time).toLocaleString(), lastCandle)
  Log(`开${direction}，订单号：`, orderId, '数量：', amount)
  let postions = _C(exchange.GetPosition)
  openData = {
    price: postions[0].Price,
    amount: postions[0].Amount,
    direction: direction
  }
  Log('当前仓位：', postions)
}
// 检测是否需要止损
function testCut() {
  let ticker = _C(exchange.GetTicker)
  let nowPirce = ticker.Last
  let percent = (nowPirce - openData.price) / openData.price * 100 * nowMargin
  if (openData.direction === 'LONG' && percent < -CUT_PERCENT) {
    closePosition()
    Log('止损平多')
  } else if (openData.direction === 'SHORT' && percent > CUT_PERCENT) {
    closePosition()
    Log('止损平空')
  } else if (openData.direction === 'LONG' && percent > WIN_PERCENT) {
    closePosition()
    Log('止盈平多')
  } else if (openData.direction === 'SHORT' && percent < -WIN_PERCENT) {
    closePosition()
    Log('止盈平空')
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
}
// ema上穿
function isEmaUpCross(emaData) {
  // 下穿的情况是上一条的5大于10，而下一条变成了10大于5，就说明5下穿了10
  // if (emaData[5][0] > emaData[10][0] && emaData[5][1] < emaData[10][1]) {
  //   openPosition('SHORT')
  // 上穿的情况是上一条的5小于10，而下一条变成了5大于10，就说明5上穿了10
  if (emaData[5][0] < emaData[10][0] && emaData[5][1] > emaData[10][1]) {
    return true
  }
}
// ema下穿
function isEmaDownCross(emaData) {
  // 下穿的情况是上一条的5大于10，而下一条变成了10大于5，就说明5下穿了10
  if (emaData[5][0] > emaData[10][0] && emaData[5][1] < emaData[10][1]) {
    return true
  }
}
// macd上穿
function isMacdUpCross(MACD) {
  // 添加一个限制，必须有明确的趋势，比如在穿插之前的前两个小时，不能有交叉，说明是真的趋势反转
  let testMacdData = {
    DIF: MACD[0].slice(-11, -3),
    DEM: MACD[1].slice(-11, -3)
  }
  let flag = true
  for (let i = 0; i < testMacdData.DIF.length; i++) {
    if (testMacdData.DIF[i] < testMacdData.DEM[i]) {
      flag = true
    } else {
      flag = false
      break;
    }
  }
  if (!flag) return false
  let macdData = {
    DIF: MACD[0].slice(-3, -1),
    DEM: MACD[1].slice(-3, -1)
  }
  // 上穿的情况是上一条的5小于10，而下一条变成了5大于10，就说明5上穿了10
  if (macdData['DIF'][0] < macdData['DEM'][0] && macdData['DIF'][1] > macdData['DEM'][1]) {
    // 再添加一个限制，当前的macd值要有一定的间距，不能离得太近，否则说明趋势不明显(但是这个条件只适用于在开单的时候，平单的时候不用特别觉得趋势明显，只要碰到了，就说明趋势差不多可以平了)
    let lastDIF = MACD[0].slice(-2)[0]
    let lastDEM = MACD[1].slice(-2)[0]
    let per = Math.abs((lastDIF - lastDEM) / lastDIF * 100)
    if (per < MACD_ANGLE && !openData) {
      return false
    }
    return true
  }
}
// macd下穿
function isMacdDownCross(MACD) {
  // 添加一个限制，必须有明确的趋势，比如在穿插之前的前两个小时，不能有交叉，说明是真的趋势反转
  let testMacdData = {
    DIF: MACD[0].slice(-11, -3),
    DEM: MACD[1].slice(-11, -3)
  }
  let flag = true
  for (let i = 0; i < testMacdData.DIF.length; i++) {
    if (testMacdData.DIF[i] > testMacdData.DEM[i]) {
      flag = true
    } else {
      flag = false
      break;
    }
  }
  if (!flag) return false
  let macdData = {
    DIF: MACD[0].slice(-3, -1),
    DEM: MACD[1].slice(-3, -1)
  }
  // 下穿的情况是上一条的5大于10，而下一条变成了10大于5，就说明5下穿了10
  if (macdData['DIF'][0] > macdData['DEM'][0] && macdData['DIF'][1] < macdData['DEM'][1]) {
    // 再添加一个限制，当前的macd值要有一定的间距，不能离得太近，否则说明趋势不明显(但是这个条件只适用于在开单的时候，平单的时候不用特别觉得趋势明显，只要碰到了，就说明趋势差不多可以平了)
    let lastDIF = MACD[0].slice(-2)[0]
    let lastDEM = MACD[1].slice(-2)[0]
    let per = Math.abs((lastDIF - lastDEM) / lastDIF * 100)
    if (per < MACD_ANGLE && !openData) {
      return false
    }
    return true
  }
}