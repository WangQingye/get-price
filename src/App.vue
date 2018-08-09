<template>
  <div id="app">
    <HelloWorld/>
    <h1>BTC:</h1>
    <p v-if="priceB">{{`bitfinex：${priceB}`}}</p>
    <p v-if="priceA">{{`binance：${priceA}`}}</p>
  </div>
</template>

<script>
import fetch from './base/fetch'
import HelloWorld from './components/HelloWorld'

export default {
  name: 'App',
  data() {
    return {
      priceB: null,
      priceA: null,
    }
  },
  created() {
    // this.getBtcFromB();
    this.getBtcFromA();
  },
  methods: {
    async getBtcFromB(){
      setTimeout(async () => {
        // let res = await fetch('https://api.bitfinex.com/v2/tickers', {symbols:'tBTCUSD'});
        let res = await fetch('https://api.bitfinex.com/v2/ticker/tBTCUSD');
        this.priceB = res[6];
        console.log(res);
        this.getBtcFromB();
      }, 6000);
    },
    async getBtcFromA(){
      setTimeout(async () => {
        // let res = await fetch('https://api.bitfinex.com/v2/tickers', {symbols:'tBTCUSD'});
        let res = await fetch('https://api.binance.com/api/v1/ticker/price?symbol=BTCUSDT');
        this.priceA = res.price;
        console.log(res);
        this.getBtcFromA();
      }, 6000);
    }
  },
  components: {
    HelloWorld
  }
}
</script>

<style>
</style>
