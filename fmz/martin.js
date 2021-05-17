// fmz@fac7cf9b41caaeefb4af983bd96b1cba
// 当前账户资金
let balance = 1
// 当前资金倍数
let mutiple = 1
// 基础倍数金额
let mutipleMoney = 0
// 杠杆倍数
let marginLevel = 1
// 开单情况
let openData = null
// 操作的对应节点
let lastCandle = null
// 获取总资金应该分成多少份
function getMutipleMoneyTime(boomTime) {
  let time = 0
  for (let i = 0; i <= boomTime; i++) {
    time += Math.pow(2, i)
  }
  return time
}
// 计算杠杆倍数
function calMargin() {
  // 每一份资金，乘以杠杆倍数，乘以波动率，等于盈利百分比
  return Math.ceil(WIN_PERCENT / WAVE_PERCENT / (1 / getMutipleMoneyTime(BOOM_TIME)))
}
// 初始化函数
function init() {
  // 初始化资金和资金倍数
  exchange.SetContractType("swap")
  let account = exchange.GetAccount()
  balance = account.Balance
  // 初始化倍数为1
  mutiple = 1
  // 初始化基础倍数的金额
  mutipleMoney = Math.floor(balance / getMutipleMoneyTime(BOOM_TIME))
  // 计算杠杆倍数
  marginLevel = calMargin()
  Log('开始等待开仓流程，当前账户余额：', balance);
  Log('当前账户单位资金：', mutipleMoney);
  Log('当前杠杆倍数：', marginLevel);
}

// 止盈后的刷新函数
function refresh() {
  // 重新计算单位money
  mutipleMoney = Math.floor(balance / getMutipleMoneyTime(BOOM_TIME))
  // 资金倍数变为1
  mutiple = 1
  Log('开始等待开仓流程，当前账户余额：', balance);
  Log('当前账户单位资金：', mutipleMoney);
}

function testClose() {
  let ticker = _C(exchange.GetTicker)
  let nowPirce = ticker.Last
  let percent = (nowPirce - openData.price) / openData.price
  // 计算是否达到止盈条件，止盈后爆仓次数重置
  // 计算是否应该止损，即本次资金已经亏完
  // 止损条件应该是反向波动达到 1 / 杠杆倍数
  if (openData.direction === 'LONG') {
    if (percent > WAVE_PERCENT) {
      closePosition()
      refresh()
      Log('止赢平单')
    } else if (percent < -(1 / marginLevel)) {
      closePosition()
      mutiple++
      Log('止损平单', '当前爆仓次数：', mutiple - 1, "#ff0000")
    }
  } else if (openData.direction === 'SHORT') {
    if (percent < -WAVE_PERCENT) {
      closePosition()
      refresh()
      Log('止赢平单')
    } else if (percent > (1 / marginLevel)) {
      closePosition()
      mutiple++
      Log('止损平单', '当前爆仓次数：', mutiple - 1, "#ff0000")
    }
  }

  function closePosition() {
    exchange.SetDirection(openData.direction === 'SHORT' ? "closesell" : "closebuy")
    _C(openData.direction === 'SHORT' ? exchange.Buy : exchange.Sell, -1, openData.amount)
    Log('平单价格：', nowPirce)
    let postions = _C(exchange.GetPosition)
    if (postions.length === 0) {
      let account = _C(exchange.GetAccount)
      balance = account.Balance + account.FrozenBalance
      Log('当前账户资金：', balance)
      openData = null
    }
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

function testOpen() {
  let rsiData = getLastMinuteRSI()
  let rsi = rsiData.rsi
  lastCandle = rsiData.lastCandle
  // 这里注意算出来的RSI是当前蜡烛的上一条
  if (rsi < LOW_RSI) {
    openPosition('LONG')
  } else if (rsi > HIGH_RSI) {
    // openPosition('SHORT')
  }

  function openPosition(direction) {
    exchange.SetMarginLevel(marginLevel) //设置杠杆
    exchange.SetDirection(direction === 'SHORT' ? "sell" : "buy")
    // 本次下单的金额为 基础金额 * 2^已爆仓次数
    let thisTimeMoney = mutipleMoney * Math.pow(2, mutiple - 1)
    if (thisTimeMoney > balance) {
      Log('game over', '从头再来')
      refresh()
      return
    }
    let amount = (thisTimeMoney / (lastCandle.Close * 1.01)).toFixed(1)
    let orderId = _C(direction === 'SHORT' ? exchange.Sell : exchange.Buy, -1, amount * marginLevel)
    // Log('当前蜡烛：', new Date(lastCandle.Time).toLocaleString(), lastCandle)
    Log(`开${direction}单, 金额：`, thisTimeMoney, '数量：', amount * marginLevel)
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

function main() {
  // 执行一次初始化
  init()
  // 判断当前是开单状态还是等待开单状态
  while (true) {
    // 当前的开单状态，暂时只一单一单的做
    if (openData) {
      // 判断是否到平仓条件，10秒钟请求一次
      testClose()
      Sleep(1000 * 10)
    } else {
      // 没有仓位说明当前是等待开单状态
      // 检查当前是否符合开单条件
      testOpen()
      Sleep(1000 * 60 * CANDLE_TIME)
    }
  }
}