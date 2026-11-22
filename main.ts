'use strict';

// Entrypoint for the bring-the-humans-03 TikTok ad entry.
// Node.js only, standard library, no network access.
// Copies VIDEO.json from this repo into the grader output folder and
// proves the copy is byte-identical via sha256. Exits 1 on any problem.

const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');
const { createHash } = require('crypto');

const TIKTOK_VIDEO = /^https:\/\/www\.tiktok\.com\/@[^/]+\/video\/\d+$/;

const die = (why) => {
  console.error(`main.ts: ${why}`);
  process.exit(1);
};

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

const run = () => {
  const src = join(__dirname, 'VIDEO.json');
  const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';
  const dst = join(out, 'VIDEO.json');

  let bytes;
  try {
    bytes = readFileSync(src);
  } catch (e) {
    die(`cannot read ${src}: ${e.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch (e) {
    die(`VIDEO.json is not valid JSON: ${e.message}`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    die('VIDEO.json must be a JSON object');
  }

  const url = parsed.url;
  if (typeof url !== 'string' || url === '') {
    die('VIDEO.json must contain a non-empty string "url"');
  }
  if (!TIKTOK_VIDEO.test(url)) {
    die(`url must look like https://www.tiktok.com/@<handle>/video/<digits>, got: ${url}`);
  }

  try {
    mkdirSync(out, { recursive: true });
    writeFileSync(dst, bytes);
  } catch (e) {
    die(`cannot write ${dst}: ${e.message}`);
  }

  let again;
  try {
    again = readFileSync(dst);
  } catch (e) {
    die(`cannot re-read ${dst}: ${e.message}`);
  }

  const srcHash = sha256(bytes);
  const dstHash = sha256(again);
  if (srcHash !== dstHash) {
    die(`copy mismatch: source sha256 ${srcHash}, copy sha256 ${dstHash}`);
  }

  console.log(`main.ts: VIDEO.json copied to ${dst} (sha256 ${dstHash})`);
  console.log(`main.ts: video url is ${url}`);
};

run();
