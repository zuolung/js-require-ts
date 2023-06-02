const fs = require('fs')
const path = require('path')
const tempDir = path.join(__dirname, '.temp')
const { spawn } = require('child_process')

module.exports = function requireTs(target, excludes = []) {
  if (!fs.existsSync(target)) {
    return console.error('requireTs target not exist')
  }

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }

  let spawnParams = [
    './main.js',
    target,
    excludes.length ? excludes.split(',') : '',
  ]

  return new Promise((resolve, reject) => {
    const cp = spawn(`node`, spawnParams)

    cp.stderr.on('data', (err) => {
      console.error('requireTs error:', err.toString())
      reject(err.toString())
    })

    cp.on('close', () => {
      const targetArr = target.split('/')
      const fName = targetArr[targetArr.length - 1].replace('.ts', '')
      const tempFile = path.join(tempDir, `${fName}.js`)
      const result = require(tempFile)

      resolve(result)
    })
  })
}
