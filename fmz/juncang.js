// fmz@eaa74a9c1f02e2ddcf140890b591deae
// 基价格需要计算波动率
let lastBuyPrice = null

function testNeedJucang() {
  let ticker = _C(exchange.GetTicker)
  let price = ticker.Last
  // 如果波动大于设置的百分比
  if (Math.abs(lastBuyPrice - price) / lastBuyPrice * 100 > BASE_PERCENT) {
    doJuncang(ticker)
  }
}

function doJuncang(inTicker) {
  let ticker = inTicker || _C(exchange.GetTicker)
  let price = ticker.Last
  let account = _C(exchange.GetAccount)
  // 当前usdt
  let usdt = account.Balance
  // 当前币数
  let stock = account.Stocks
  let stockValue = Math.floor(stock * price)
  // 差值
  let value = Math.abs(Math.floor((stockValue - usdt)))
  if ((value / 2) < 10) {
    Log('波动值低于最小交易额:', value / 2)
    return
  }
  // 如果币值大于usdt，那么应该卖币
  // 注意市价单后面的数量，买入是UDST数，卖出是币数
  if (stockValue > usdt) {
    let sellNum = (value / 2 / price).toFixed(4)
    exchange.Sell(-1, Number(sellNum))
  } else {
    let buyNum = value / 2
    exchange.Buy(-1, Math.floor(buyNum))
  }
  account = _C(exchange.GetAccount)
  lastBuyPrice = price
  Log('均仓完成', '当前账户USDT：', account.Balance, '当前币数：', account.Stocks, '总价值约：', account.Balance + (account.Stocks * price))
}

function main() {
  // 如果是基于价格，程序开始先做一次均仓，完成资产初始化
  if (BASE_PERCENT) doJuncang()
  while (true) {
    if (BASE_TIME) {
      // 基于时间就直接定时执行均仓
      doJuncang()
      Sleep(1000 * 60 * BASE_TIME)
    } else if (BASE_PERCENT) {
      // 基于价格的话需要先去计算价格波动
      testNeedJucang()
      Sleep(1000 * 60 * 5)
    }
  }
}