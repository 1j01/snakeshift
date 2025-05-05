
// Notes on Kindle 4.x browser:
// - `onerror` or `addEventListener('error', ...)` is not supported! Very hard to tell what's going wrong.
// - `const` is supported but may be treated like `var`
// - `let` is not supported
// - `for...of` is not supported
// - `Array.from` and/or `Array.prototype.map` and/or `Array.prototype.join` is not supported
// - `JSON` is not supported (I've tried to include a polyfill with @vitejs/plugin-legacy, but that's not working, maybe because this is just a script tag and not a module?)
// - `{variableAsKey}` is not supported
// - Canvas is supported

const originalConsole = window.console
window.console = {}

function logOnPage(message) {
  const pre = document.getElementById('debug-output')
  const div = document.createElement('div')
  div.textContent = message
  pre.appendChild(div)
}
function logEverywhere(a, b, c, d) {
  // Format message
  //const message = Array.from(arguments).join(' ')
  //const args = new Array(arguments.length).map(i => arguments[i])
  //const message = args.join(' ')
  var message = ''
  for (var i = 0; i < arguments.length; i++) {
    message += arguments[i]
    if (i < arguments.length - 1) {
      message += ' '
    }
  }
  // Log on page
  logOnPage(message)
  // Log on devtools console
  try {
    const method = "log"
    originalConsole[method].apply(originalConsole, arguments)
  } catch (e) {
    logOnPage(e)
  }
  // Log on server
  try {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/log', true)
    //xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Content-Type', 'text/plain')
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status !== 200) {
          logOnPage('Failed to log on server: ' + xhr.status + ' ' + xhr.statusText + ' ' + xhr.responseText)
        }
      }
    }
    //xhr.send(JSON.stringify({ message: message }))
    //xhr.send(message)
  } catch (e) {
    logOnPage(e)
  }
}

//const methods = ['log', 'warn', 'error', 'debug', 'info', 'trace']
//for (var i = 0; i < methods.length; i++) {
//  const method = methods[i]

console.log = logEverywhere
console.warn = logEverywhere
console.error = logEverywhere
console.debug = logEverywhere
console.info = logEverywhere
console.trace = logEverywhere

console.log("This is a log message")
console.warn("This is a warning message")
console.log("eval('1 + 1') is", eval('1 + 1'))
console.log("window.addEventListener", window.addEventListener)
console.log("window.onerror", window.onerror)

//const methods = ['log', 'warn', 'error', 'debug', 'info', 'trace', 'table', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'timeLog', 'count', 'assert', 'clear', 'dir', 'dirxml', 'profile', 'profileEnd', 'timeStamp', 'context', 'memory', 'exception', 'table', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'timeLog', 'count', 'assert', 'clear', 'dir', 'dirxml']
//for (var i = 0; i < methods.length; i++) {
//  const method = methods[i]
//  console.log(method)//, 'is', console[method] === originalConsole[method] ? 'the same as' : 'different from', 'original console.')
//}
try {
  const method = 'log'
  console.log(method, 'is', console[method] === originalConsole[method] ? 'the same as' : 'different from', 'original console.')
} catch (e) {
  console.error(e)
}

function handleCommand(code) {
  console.log(">", code)
  try {
    const result = eval(code)
    console.log("<", result)
  } catch (e) {
    console.error(e)
  }
}

function sendCommand(code) {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/command', true)
  xhr.setRequestHeader('Content-Type', 'text/plain')
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status !== 200) {
        logOnPage('Failed to send command to server: ' + xhr.status + ' ' + xhr.statusText + ' ' + xhr.responseText)
      }
    }
  }
  xhr.send(code)
}

var receivingCommands = true
function receiveCommand(code) {
  if (!receivingCommands) {
    return
  }

  const xhr = new XMLHttpRequest()
  xhr.open('GET', '/get-command', true)
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const code = xhr.responseText
        if (code) {
          handleCommand(code)
        }
      } else {
        logOnPage('Failed to receive command from server: ' + xhr.status + ' ' + xhr.statusText + ' ' + xhr.responseText)
      }
    }
  }
  xhr.send()
}
//setInterval(receiveCommand, 1000)

const input = document.getElementById('debug-input')
input.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    const code = input.value
    handleCommand(code)
    receivingCommands = false
    sendCommand(code)
  }
})
