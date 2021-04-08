const {
  http
} = require('./http.js')
async function getAllfutures() {
  let res = await http.get('https://api.btcgateway.pro/linear-swap-api/v1/swap_batch_funding_rate')
  res.data.data.sort((a, b) => {
    return b.funding_rate - a.funding_rate
  })
  console.log(res.data.data)
}
getAllfutures()