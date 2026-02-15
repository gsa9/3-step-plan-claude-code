#!/usr/bin/env node
// Custom Claude Code Statusline

const path = require('path');

const RESET = '\x1b[0m';
const COLOR = '\x1b[38;5;241m';  // Muted gray
const COLOR_DIM = '\x1b[2;38;5;241m';  // Muted gray, dimmed
const FILLED = '\u2588', EMPTY = '\u2591';

// Gaps between elements (modify these to adjust spacing)
const GAP1 = '      ';  // Between element 0 and 1
const GAP2 = '     ';   // Between element 1 and 2

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const gaps = [GAP1, GAP2];

    // Build elements (order here = order in output)
    const elements = [
      buildContext(data),
      buildModel(data),
      buildFolder(data),
    ];

    // Join non-empty elements with their gaps
    let out = '', idx = 0;
    for (let i = 0; i < elements.length; i++) {
      if (!elements[i]) continue;
      if (idx > 0) out += gaps[idx - 1] || '';
      out += elements[i];
      idx++;
    }

    process.stdout.write(out);
  } catch (e) {}
});

function buildContext(data) {
  const remaining = data.context_window?.remaining_percentage;
  if (remaining == null) return '';
  const used = 100 - Math.round(remaining);
  const filled = (used / 10) | 0;
  return COLOR + FILLED.repeat(filled) + EMPTY.repeat(10 - filled) + ' ' + used + '%' + RESET;
}

function buildModel(data) {
  const model = (data.model?.display_name || 'Claude').replace(/^Claude\s+/i, '');
  return COLOR_DIM + model + RESET;
}

function buildFolder(data) {
  const folderName = path.basename(data.workspace?.current_dir || '.');
  return COLOR + folderName + RESET;
}
