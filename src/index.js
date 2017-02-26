'use strict'

/**
 * polarbear
 * @author Werner Roets <werner@io.co.za>
 * @author Ant Cosentino <ant@io.co.za>
 * @license MIT
 */

const CWD = process.cwd()
const ARGV = require('minimist')(process.argv.slice(2))
const DEV = ARGV.dev || false

// IMPORTS
const fs = require('fs')
const os = require('os')
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const SlackWebClient = require('@slack/client').WebClient

// CONSTANTS
const PACKAGE_NAME = require(CWD + '/package.json').name
const VERSION = require(CWD + "/package.json").version

const USER_FOLDER = DEV ? CWD + "/." + PACKAGE_NAME
                        : process.env.WORKING_TITLE_USER_FOLDER
                        || os.homedir() + "/." + PACKAGE_NAME

const LOG_FILE = DEV ? CWD + "/." + PACKAGE_NAME + "/log.txt"
                     : USER_FOLDER + "/log.txt"

const USER_CONFIG_FILE = DEV ? CWD + '/.' + PACKAGE_NAME + '/config.json'
                             : USER_FOLDER + "/config.json"

const SLACK_API_TOKEN = DEV ? require(CWD + "/slack_dev_token.json")
                            : process.env.SLACK_API_TOKEN

// SLACK GLOBALS
var swc = null
var channels= []
var write_streams = {
  log: null,
  user_config: null
}

// BLESSED GLOBALS
const blessedProgram = blessed.program()
var gui = {
  screen: null,
  messageBox: null,
  form: null,
  textinput: null
}

function initLog(callback) {
  fs.access(USER_FOLDER, fs.constants.F_OK, err => {
    if(err) {
      fs.mkdir(USER_FOLDER, err => {
        if(err) {
          throw err
        } else {
          fs.writeFile(LOG_FILE, PACKAGE_NAME + "  log\n", err => {
            if(err) {
              throw err
            } else {
              write_streams.log = fs.createWriteStream(LOG_FILE)
              callback()
            }
          })
        }
      })
    } else {
      fs.writeFile(LOG_FILE, PACKAGE_NAME + " log\n", err => {
        if(err) {
          throw err
        } else {
          write_streams.log = fs.createWriteStream(LOG_FILE)
          callback()
        }
      })
    }
  })
}

/**
 * Initialise the user config file
 */
function initUserConfig(callback) {
  fs.access(USER_FOLDER, fs.constants.F_OK, err => {
    if(err) {
      fs.mkdir(USER_FOLDER, err => {
        if(err) {
          throw err
        } else {
          fs.writeFile(USER_FOLDER + "/config.json", "{}", err => {
            if(err) {
              throw err
            } else {
              write_streams.user_config = fs.createWriteStream(USER_FOLDER + "/config.json")
              callback()
            }
          })
        }
      })
    } else {
      fs.writeFile(USER_FOLDER + "/config.json", "{}", err => {
        if(err) {
          throw err
        } else {
          write_streams.user_config = fs.createWriteStream(USER_FOLDER + "/config.json")
          callback()
        }
      })
    }
  })
}



function initBlessed(callback) {

  gui.screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
  })

  screen.title = PACKAGE_NAME

  // Channel message box
  var box = blessed.box({
    parent: screen,
    scrollable: true,
    alwaysScroll: true,
    // fg: 'green',
    label: channels[0].name,
    width: '100%',
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
  var inputBox = blessed.textarea({
    parent: screen,
    bottom: 0,
    width: '100%',
    height: '20%',
    border: {
      type: 'line',
      fg: 'yellow'
    }
  })
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    shut_down()
  })

  screen.render()
}

function log(text, callback) {
  write_streams.log.write(text + "\n")
  callback()
}

/**
 * Initialise
 */
function boot(callback) {
  blessedProgram.clear();
  blessedProgram.write(PACKAGE_NAME + " is starting up...")
  var icon = blessed.image({
    parent: gui.screen,
    top: 0,
    left: 0,
    type: 'overlay',
    width: 'shrink',
    height: 'shrink',
    file: __dirname + '/nosmoking.png',
    search: false
  });

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
          initBlessed(() => {
            callback()
          })
        }
      })
    })
  })
}

function shut_down() {
  blessedProgram.clear();
  blessedProgram.disableMouse();
  blessedProgram.showCursor();
  blessedProgram.normalBuffer();
  write_streams.log.end()
  write_streams.user_config.end()
  return process.exit(0)
}


boot((err) => {
  if(err) {
    throw err
  } else {
    // ready and waiting
  }
})
