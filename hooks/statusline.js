#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const https = require('https');
const path = require('path');

const RESET       = '\x1b[0m';
const COLOR       = '\x1b[38;5;241m';
const COLOR_FILLED = '\x1b[38;5;250m';
const COLOR_WARN   = '\x1b[38;5;208m';
const WARN_THRESHOLD = 90;
const FILLED       = '\u2501';
const EMPTY        = '\u2508';
const BAR_WIDTH = 10;
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
      buildModel(data),
      buildFolder(data),
      buildQuotaBar(quota?.five_hour, 5 * 3600),
      buildQuotaBar(quota?.seven_day, 7 * 86400),
    ];
    process.stdout.write(elements.filter(Boolean).join(COLOR + SEP + RESET));
  } catch (_) { /* statusline must never crash */ }
});

function renderBar(pct, warn) {
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round(pct / 100 * BAR_WIDTH)));
  const color = (warn && pct >= WARN_THRESHOLD) ? COLOR_WARN : COLOR_FILLED;
  return color + FILLED.repeat(filled) + RESET + EMPTY.repeat(BAR_WIDTH - filled);
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
  return COLOR + renderBar(100 - remaining) + ' ' + RESET;
}

function buildQuotaBar(period, windowSecs) {
  if (!period) return '';
  const secs = period.resets_at ? (new Date(period.resets_at) - Date.now()) / 1000 : 0;
  let timeStr = '';
  if (secs > 0) {
    if (secs < 3600)       timeStr = Math.round(secs / 60) + 'm';
    else if (secs < 86400) timeStr = (secs / 3600).toFixed(1) + 'h';
    else                   timeStr = (secs / 86400).toFixed(1) + 'd';
  }
  const elapsed = windowSecs - Math.max(0, secs);
  const projected = (elapsed > 0 && period.utilization > 0)
    ? Math.round(period.utilization / elapsed * windowSecs)
    : (period.utilization || 0);
  return COLOR + renderBar(projected, true) + ' ' + timeStr + RESET;
}

function buildModel(data) {
  return COLOR + (data.model?.display_name || 'Claude').replace(/^Claude\s+/i, '') + RESET;
}

function buildFolder(data) {
  return COLOR + path.basename(data.workspace?.current_dir || '.') + RESET;
}
