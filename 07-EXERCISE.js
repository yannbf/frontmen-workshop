#!/usr/bin/env node

/**
 * Exercise: add a comment `// get` or `// set` or `// set & get`
 * at the end of each line of code you think does one of those three cases.
 *
 * Not every line needs to be commented.
 */

if (process.getuid()) {
  console.error('Run as root');
  process.exit(1);
}

var diff = require('ansi-diff-stream')();
var input = require('neat-input')();
var fs = require('fs');
var path = require('path');

var FOLDER = '/sys/class/backlight/intel_backlight';
var BRIGHTNESS_FILE = path.join(FOLDER, 'brightness');
var MAX_BRIGHTNESS_FILE = path.join(FOLDER, 'max_brightness');
var MAX = readInt(MAX_BRIGHTNESS_FILE);

var pct = Math.floor(100 * readInt(BRIGHTNESS_FILE) / MAX);
var inc = 5;

var ws = fs.createWriteStream(BRIGHTNESS_FILE);

input.on('right', function() {
  pct += inc;
  if (pct > 100) pct = 100;
  update();
});

input.on('left', function() {
  pct -= inc;
  if (pct < 0) pct = 0;
  update();
});

diff.pipe(process.stdout);
render();

process.on('SIGWINCH', noop);
process.stdout.on('resize', onresize);

function readInt(file) {
  return parseInt(fs.readFileSync(file, 'ascii'), 10);
}

function update() {
  ws.write('' + Math.max(1, Math.floor(pct / 100 * MAX)) + '\n');
  render();
}

function onresize() {
  diff.clear();
  render();
}

function times(str, n) {
  var res = '';
  while (n--) res += str;
  return res;
}

function render() {
  var wid = Math.max(0, process.stdout.columns - 8);
  var widPct = Math.floor(wid * pct / 100);
  var slider = '[' + times('#', widPct) + times(' ', wid - widPct) + ']';

  diff.write(
    'Use <left> and <right> to adjust brightness\n' +
      slider +
      ' ' +
      (pct < 10 ? '  ' : pct < 100 ? ' ' : '') +
      pct +
      '%'
  );
}

function noop() {}
