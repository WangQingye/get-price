const fs = require('fs')

async function test(p, content) {
  return await fs.appendFileSync(p, content, err => {})
}
exports.writeLine = test