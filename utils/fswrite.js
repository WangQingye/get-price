const fs = require('fs')

function test(p, content) {
  fs.appendFileSync(p, content, err => {})
}
exports.writeLine = test