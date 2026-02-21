#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const https = require('https');
const path = require('path');

const RESET       = '\x1b[0m';
const COLOR       = '\x1b[38;5;241m';
const COLOR_FILLED = '\x1b[32m';
const COLOR_ORANGE = '\x1b[33m';
const FILLED       = '\u25B0';
const FILLED_THIN  = '\u2500';
const EMPTY        = '\u25B0';
const EMPTY_OUTLINE = '\u25B1';
const CONTEXT_BAR_WIDTH = 8;
const QUOTA_BAR_WIDTH   = 8;
const SEP       = '    ';

const CLAUDE_DIR       = path.join(os.homedir(), '.claude');
const CREDENTIALS_FILE = path.join(CLAUDE_DIR, '.credentials.json');
const QUOTA_CACHE_FILE = path.join(CLAUDE_DIR, 'hooks', 'quota-cache.json');
const QUOTA_CACHE_TTL  = 30_000;
const API_TIMEOUT      = 5_000;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', async () => {
  try {
    const data = JSON.parse(input);
    const quota = await getQuota();
    const elements = [
      buildContextBar(data),
      buildFolder(data),
      buildQuotaBar(quota?.five_hour, 5 * 3600),
      buildQuotaBar(quota?.seven_day, 7 * 86400),
      buildModel(data),
    ];
    process.stdout.write(elements.filter(Boolean).join(COLOR + SEP + RESET));
  } catch (_) { /* statusline must never crash */ }
});

function renderBar(pct, width) {
  const filled = Math.max(0, Math.min(width, Math.round(pct / 100 * width)));
  return COLOR_FILLED + FILLED.repeat(filled) + RESET + EMPTY_OUTLINE.repeat(width - filled);
}

async function getQuota() {
  let cached = null;
  try {
    const raw = JSON.parse(fs.readFileSync(QUOTA_CACHE_FILE, 'utf8'));
    cached = { fresh: Date.now() - raw.timestamp < QUOTA_CACHE_TTL, data: raw.data };
  } catch (_) {}

  if (cached?.fresh) return cached.data;

  let token = null;
  try {
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
    token = creds?.claudeAiOauth?.accessToken || null;
  } catch (_) {}

  if (!token) return cached?.data || null;

  const data = await new Promise(resolve => {
    const req = https.get({
      hostname: 'api.anthropic.com',
      path: '/api/oauth/usage',
      headers: {
        'Authorization': `Bearer ${token}`,
        'anthropic-beta': 'oauth-2025-04-20',
        'Accept': 'application/json',
      },
      timeout: API_TIMEOUT,
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (_) { resolve(null); }
      });
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });

  if (data) {
    try { fs.writeFileSync(QUOTA_CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data })); } catch (_) {}
    return data;
  }
  return cached?.data || null;
}

function buildContextBar(data) {
  const remaining = data.context_window?.remaining_percentage;
  if (remaining == null) return '';
  const used = Math.round(100 - remaining);
  return renderBar(used, CONTEXT_BAR_WIDTH) + ' ' + used + '%';
}

function buildQuotaBar(period, windowSecs) {
  if (!period) return '';
  const secs = period.resets_at ? (new Date(period.resets_at) - Date.now()) / 1000 : 0;
  let timeStr = '';
  if (secs > 0) {
    const m = Math.floor(secs / 60) % 60;
    const h = Math.floor(secs / 3600) % 24;
    const d = Math.floor(secs / 86400);
    if (secs < 3600)        timeStr = m + 'm';
    else if (secs < 18000)  timeStr = h + 'h' + (m ? ' ' + m + 'm' : '');
    else if (secs < 86400)  timeStr = h + 'h';
    else                    timeStr = d + 'd' + (h ? ' ' + h + 'h' : '');
  }
  const elapsed = windowSecs - Math.max(0, secs);
  const projected = (elapsed > 0 && period.utilization > 0)
    ? Math.round(period.utilization / elapsed * windowSecs)
    : (period.utilization || 0);
  const actual = period.utilization || 0;
  const w = QUOTA_BAR_WIDTH;
  const greenCount = Math.max(0, Math.min(w, Math.round(actual / 100 * w)));
  const orangeCount = Math.max(0, Math.min(w, Math.round(projected / 100 * w)));
  const bar = COLOR_FILLED + FILLED.repeat(greenCount)
    + COLOR_ORANGE + EMPTY.repeat(Math.max(0, orangeCount - greenCount))
    + RESET + EMPTY_OUTLINE.repeat(w - Math.max(greenCount, orangeCount));
  return bar + COLOR + ' ' + timeStr + '  ' + RESET;
}

function buildModel(data) {
  return COLOR + (data.model?.display_name || 'Claude').replace(/^Claude\s+/i, '') + RESET;
}

function buildFolder(data) {
  return COLOR + path.basename(data.workspace?.current_dir || '.') + ' ' + RESET;
}
