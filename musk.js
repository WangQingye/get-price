const puppeteer = require('puppeteer')
var {
  sendMail
} = require('./mail.js');
let browser;
let newTweet = ''
async function initBrowser() {
  browser = await (puppeteer.launch({
    userDataDir: 'puppeteer-user-dir',
    //设置超时时间
    timeout: 15000,
    //如果是访问https页面 此属性会忽略https错误
    ignoreHTTPSErrors: true,
    // 打开开发者工具, 当此值为true时, headless总为false
    devtools: false,
    // 关闭headless模式, 不会打开浏览器
    headless: false
  }));
}
async function getUrl() {
  if (!browser) await initBrowser()
  const page = await browser.newPage();
  setInterval(async () => {
    // https://twitter.com/elonmusk/with_replies
    await page.goto('https://twitter.com/q0VK4IYxhfjpHw8/with_replies');
    // 如果第一次没取到，那么有可能是页面加载慢，那就等3秒钟，再取一次
    await page.waitFor(5000);
    let info = await getResult()
    if (newTweet !== info[0]) {
      console.log('发送邮件')
      sendMail('老马新tweet:' + info[0])
      newTweet = info[0]
    }
    console.log(info[0])
  }, 10000)
  async function getResult() {
    let result = await page.evaluate(() => {
      let els = document.querySelectorAll('span')
      let texts = []
      for (let i = 0; i < els.length; i++) {
        const element = els[i];
        // if (element.textContent === 'Elon Musk') {
        if (element.textContent === '王清野') {
          try {
            let text = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[0].children[0].children[0].textContent
            if (text.indexOf('@') === 0) {
              text = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[1].children[0].children[0].textContent
            }
            console.log(text + '321321312')
            texts.push(text)
          } catch (error) {

          }
        }
      }
      return texts
    })
    return result
  }
}
getUrl()
// export function closeBrowser() {
//   browser.close()
// }