// tiktok-ad-makefun v3 — entrypoint for make.fun's "Bring the humans" bounty.
// A courier and nothing else: it reads VIDEO.json from this repository,
// verifies the address inside is a genuine TikTok video link, copies the
// file byte-for-byte into the output directory, and checks the copy with
// a sha256 comparison before reporting success.

const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { join } = require("node:path");

const VIDEO_FILE = "VIDEO.json";
const OUTPUT_NAME = "VIDEO.json";

// https://www.tiktok.com/@<handle>/video/<digits>, nothing else.
const TIKTOK_VIDEO = /^https:\/\/www\.tiktok\.com\/@[^\/]+\/video\/\d+\/?$/;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message) {
  process.stderr.write("error: " + message + "\n");
  process.exit(1);
}

function main() {
  const source = join(__dirname, VIDEO_FILE);

  let raw;
  try {
    raw = readFileSync(source);
  } catch (err) {
    fail("cannot read " + VIDEO_FILE + ": " + err.message);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch (err) {
    fail(VIDEO_FILE + " is not valid JSON: " + err.message);
  }

  const url = parsed && typeof parsed === "object" ? parsed.url : undefined;
  if (typeof url !== "string" || !TIKTOK_VIDEO.test(url)) {
    fail(VIDEO_FILE + " must carry a TikTok video url, got: " + JSON.stringify(url));
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  const target = join(outDir, OUTPUT_NAME);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, raw);

  const copied = readFileSync(target);
  if (!copied.equals(raw)) {
    fail("copied " + OUTPUT_NAME + " differs from the repository file");
  }
  if (sha256(copied) !== sha256(raw)) {
    fail("copied " + OUTPUT_NAME + " failed its sha256 check");
  }

  process.stdout.write(
    "ok: wrote " + target + " (" + raw.length + " bytes, sha256 " + sha256(raw) + ")\n",
  );
}

main();
