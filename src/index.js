
'use strict'

var blessed = require('blessed')
var contrib = require('blessed-contrib')

var screen = blessed.screen({
  smartCSR: true,
  autoPadding: true,
})

screen.title = 'slack client'

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

form.on('submit', function(data) {
  // send text to log
  // console.log(data)
  box.pushLine([data.textarea])
  screen.render()
})
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
  return process.exit(0)
})

screen.render()