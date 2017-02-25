
'use strict'
/**
 * envyslack
 * @author Werner Roets <werner@io.co.za>
 * @author Ant Cosentino <ant@io.co.za>
 * @license MIT
 */

const DEV = true

// Imports
const fs = require('fs')
const os = require('os')
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const SlackWebClient = require('@slack/client').WebClient

// Constants
const VERSION = require("../package.json").version
const DEFAULT_USER_CONFIG = {
  userDir: os.homedir() + "/.slackenvy"
}
const SLACK_ENVY_USER_DIR = DEFAULT_USER_CONFIG.userDir || process.env.SLACK_ENVY_USER_DIR || os.homedir() + "/.slackenvy"
const LOG_FILE = DEFAULT_USER_CONFIG.logFile || SLACK_ENVY_USER_DIR + "/log.txt"
const USER_CONFIG_FILE = DEFAULT_USER_CONFIG.userConfigFile || SLACK_ENVY_USER_DIR + "/config.json"
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN || 'xoxp-2524370452-45287580466-146541873717-43e8aa923862396de16b5914d6be7e6e'

// Global
var swc = null
var channels= []
var write_streams = {
  log: null,
  user_config: null
}

function initLog(callback) {
  fs.access(SLACK_ENVY_USER_DIR, fs.constants.F_OK, err => {
    if(err) {
      fs.mkdir(SLACK_ENVY_USER_DIR, err => {
        if(err) {
          throw "ONE"
        } else {
          fs.writeFile(LOG_FILE, "# slackenvy log\n", err => {
            if(err) {
              throw "TWO"
            } else {
              write_streams.user_config = fs.createWriteStream(LOG_FILE)
              callback()
            }
          })
        }
      })
    } else {
      fs.writeFile(LOG_FILE, "# slackenvy log\n", err => {
        if(err) {
          throw "THREE"
        } else {
          callback()
        }
      })
    }
  })
}

/**
 * Initialise the user config file at SLACK_ENVY_USER_DIR
 */
function initUserConfig(callback) {
  fs.access(SLACK_ENVY_USER_DIR, fs.constants.F_OK, err => {
    if(err) {
      fs.mkdir(SLACK_ENVY_USER_DIR, err => {
        if(err) {
          throw err
        } else {
          fs.writeFile(SLACK_ENVY_USER_DIR + "/config.json", JSON.stringify(DEFAULT_USER_CONFIG), err => {
            if(err) {
              throw err
            } else {
              write_streams.user_config = fs.createWriteStream(USER_CONFIG_PATH)
              callback()
            }
          })
        }
      })
    } else {
      fs.writeFile(SLACK_ENVY_USER_DIR + "/config.json", JSON.stringify(DEFAULT_USER_CONFIG), err => {
        if(err) {
          throw err
        } else {
          callback()
        }
      })
    }
  })
}

function log(text, callback) {
  write_streams.log.write(text + "\n")
  callback()
}

function boot(callback) {
  initLog(() => {
    initUserConfig(() => {
      swc = new SlackWebClient(SLACK_API_TOKEN)
      swc.channels.list(function(err, info) {
        if (err) {
          log(err,() => {
            callback(err)
          })
        } else {
          channels = info.channels
          callback()
        }
      })
    })
  })
}

boot(() => {})
function shut_down() {
  write_streams.log.end()
  write_stream.user_config.end()
  return process.exit(0)
}



// Init screen
var screen = blessed.screen({
  smartCSR: true,
  autoPadding: true,
})

screen.title = 'slack client'

// Channel message box
var box = blessed.box({
  parent: screen,
  scrollable: true,
  alwaysScroll: true,
  // fg: 'green',
  label: 'Channel message log',
  width: '90%',
  height: '80%',
  valign: 'bottom',
  left: 0,
  top: 0,
  tags: true,
  border: {
    type: 'line',
    fg: 'white'
  }
})

// Message input form
var form = blessed.form({
  parent: screen,
  label: 'Message input',
  name: 'form',
  top: '80%',
  left: 0,
  width: '100%',
  height: '20%',
  border: {type: 'line', fg: 'yellow'}
})

// Message input textarea
var textarea = blessed.textarea({
  parent: form,
  type: 'textarea',
  keys: true,
  // name: 'textarea',
  input: true,
  inputOnFocus: true,
  // vi: true,
  height: '20%',
  // ileft: '0%',
  width: '90%',
  // left: '0%',
  // top: '0%',

})


textarea.key('enter', function(ch, key) {
  box.pushLine([textarea.getValue(), "shift " + key.shift, "ctrl " + key.ctrl, "meta " + key.meta])
  textarea.clearValue()
  screen.render()
})

textarea.key('S-enter', function(ch, key) {
  fs.writeFile("./log", JSON.stringify([ch, key]), 'utf8', (err) => {
    if(err) throw err
  })
})

// form.on('submit', function(data) {
//   // send text to log
//   // console.log(data)
//   fs.writeFile("./" + Date.now().toString(), data.txextarea, 'utf8', (err) => {
//     throw err
//   })
//   box.pushLine([data.textarea])
//   screen.render()
// })
// textarea.on('cancel', function() {
//   // clear the text
//   textarea.clearValue()
// })
// textarea.on('action', function() {
//   // the user did one of two things
// })

// screen.append(log)

form.focusNext()

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  shut_down()
})

screen.render()