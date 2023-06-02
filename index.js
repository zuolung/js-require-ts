const fs = require('fs')
const path = require('path')
const tempDir = path.join(__dirname, '.temp')
const { spawn } = require('child_process')

module.exports = function requireTs(target, tsConfigPath) {
  const targetArr = target.split('/')
  const fName = targetArr[targetArr.length - 1].replace('.ts', '')
  const tempFile = path.join(tempDir, `${fName}.js`)

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }

  let spawnParams = [
    'tsc',
    target,
    '--outDir',
    tempDir,
    '--resolveJsonModule',
    '--esModuleInterop',
    '--module',
    'commonjs',
    '--target',
    'es5',
  ]

  if (tsConfigPath) {
    spawnParams = spawnParams.concat(['-p', tsConfigPath])
  }

  const cp = spawn(`npx`, spawnParams)

  return new Promise((resolve, reject) => {
    cp.stderr.on('data', (err) => {
      reject(err.toString())
    })

    cp.on('close', () => {
      const result = require(tempFile)

      resolve(result)
    })
  })
}
