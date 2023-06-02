const vm = require('vm')
const fs = require('fs')
const path = require('path')

const tsc = path.join(path.dirname(require.resolve('typescript')), 'tsc.js')
const tscScript = vm.createScript(fs.readFileSync(tsc, 'utf8'), tsc)

let options = {
  nodeLib: false,
  targetES5: true,
  moduleKind: 'commonjs',
  emitOnError: false,
  exitOnError: true,
  tmpDir: path.join(__dirname, './.temp'),
  lib: ['DOM', 'ScriptHost', 'ES5', 'ES6', 'ES7', 'esnext'],
  excludes: 'node_modules',
}

module.exports = function (opts) {
  options = merge(options, opts)
}

require.extensions['.ts'] = function (module) {
  let jsname = compileTS(module)
  runJS(jsname, module)
}

function isModified(tsname, jsname) {
  let tsMTime = fs.statSync(tsname).mtime
  let jsMTime = 0

  try {
    jsMTime = fs.statSync(jsname).mtime
  } catch (e) {
    //catch if file does not exists
  }

  return tsMTime > jsMTime
}

/**
 * Compiles TypeScript file, returns js file path
 * @return {string} js file path
 */
function compileTS(module) {
  let exitCode = 0
  let tmpDir = options.tmpDir
  let jsname = path.join(tmpDir, path.basename(module.filename, '.ts') + '.js')

  if (!isModified(module.filename, jsname)) {
    return jsname
  }

  let argv = [
    'node',
    'tsc.js',
    !!options.emitOnError ? '' : '--noEmitOnError',
    '--target',
    options.targetES5 ? 'ES5' : 'ES3',
    !!options.moduleKind ? '--module' : '',
    !!options.moduleKind ? options.moduleKind : '',
    '--outDir',
    tmpDir,
    '--lib',
    Array.isArray(options.lib) ? options.lib.join(',') : options.lib,
    module.filename,
  ]

  if (options.excludes) {
    argv = argv.concat(['--excludeDirectories', options.excludes])
  }

  let proc = merge(merge({}, process), {
    argv: compact(argv),
    exit: function (code) {
      if (code !== 0 && options.exitOnError) {
        console.error(
          'Fatal Error. Unable to compile TypeScript file. Exiting.'
        )
        process.exit(code)
      }
      exitCode = code
    },
  })

  let sandbox = {
    process: proc,
    require: require,
    module: module,
    Buffer: Buffer,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    __filename: tsc,
  }

  tscScript.runInNewContext(sandbox)
  if (exitCode !== 0) {
    throw new Error('Unable to compile TypeScript file.')
  }

  return jsname
}

function runJS(jsname, module) {
  let content = fs.readFileSync(jsname, 'utf8')

  let sandbox = {}
  for (let k in global) {
    sandbox[k] = global[k]
  }
  sandbox.require = module.require.bind(module)
  sandbox.exports = module.exports
  sandbox.__filename = jsname
  sandbox.__dirname = path.dirname(module.filename)
  sandbox.module = module
  sandbox.global = sandbox
  sandbox.root = global

  return vm.runInNewContext(content, sandbox, { filename: jsname })
}

function merge(a, b) {
  if (a && b) {
    for (let key in b) {
      a[key] = b[key]
    }
  }
  return a
}

function compact(arr) {
  let narr = []
  arr.forEach(function (data) {
    if (data) narr.push(data)
  })
  return narr
}
