const {
  http
} = require('./http.js')
const {
  writeLine
} = require('./utils/fswrite.js')
const fs = require('fs')
const moment = require('moment')

let START_TIME = '2021-03-01 00:00:00'
let END_TIME = '2021-03-31 00:00:00'
// console.log(moment(START_TIME).valueOf())
// 某一阶段15分钟蜡烛图
// let Candles15 = JSON.parse(fs.readFileSync('15.txt', 'utf-8'))



// 获取1分钟历史蜡烛图
async function getEthCandles15() {
  // let startTime = Candles15[0].time / 1000
  let startTime = new Date(START_TIME).getTime()
  let endTime = new Date(END_TIME).getTime()
  let limit = (endTime - startTime) / (15 * 60 * 1000)
  // let startTime = (new Date().getTime() - 5 * 60 * 1000) / 1000
  // let endTime = new Date().getTime() / 1000
  // let endTime = Candles15[Candles15.length - 1].time / 1000
  let res = await http.get(`https://ftx.com/api/markets/ETH-PERP/candles?resolution=900&start_time=${startTime / 1000}&end_time=${endTime / 1000}$limit=5000`)      
  // findOpenPoint(res.data.result, 0)
  // console.log(res.data.result[res.data.result.length - 1])
  console.log(res.data.result.length)
  await writeLine('15.txt', JSON.stringify(res.data.result))
  // await writeLine('15.txt', JSON.stringify(res.data.result))
}
getEthCandles15()