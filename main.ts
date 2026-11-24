// Say What Actually Broke — make.fun entry.
// Writes one honest, funny error message to /output/entry.txt, where the
// sealed gate scorer reads it. The line must be a single line of 1 to 200
// characters, name the real failure in plain words, tell the user what to
// do next, and stay shippable in a real error dialog — so this program
// checks its own output before it writes anything.

import { mkdirSync, writeFileSync } from "node:fs";

const ENTRY =
  "The server ran out of memory and dropped your request like a hot potato, so close a few tabs and try again.";

const TARGET = "/output/entry.txt";
const MAX_CHARS = 200;

// Words that name a concrete failure instead of apologising in generalities.
const FAILURE_WORDS = ["memory", "disk", "database", "network", "server"];
// Words that give the reader a next step.
const ACTION_WORDS = ["close", "retry", "try again", "free", "reconnect"];

function containsAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function validateEntry(text: string): void {
  if (text.trim() === "") {
    throw new Error("entry must not be blank");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  if (text.length < 1 || text.length > MAX_CHARS) {
    throw new Error(
      `entry is ${text.length} characters, must be 1 to ${MAX_CHARS}`,
    );
  }
  if (/[^\x20-\x7e]/.test(text)) {
    throw new Error("entry must be printable ASCII");
  }
  if (!containsAny(text, FAILURE_WORDS)) {
    throw new Error("entry must name the real failure in plain words");
  }
  if (!containsAny(text, ACTION_WORDS)) {
    throw new Error("entry must tell the user what to do next");
  }
}

// Phrases that apologise in generalities instead of naming the failure.
// The judge weighs "names the real failure ... instead of apologising in
// generalities", so a line carrying one of these never ships.
const VAGUE_PHRASES = [
  "something went wrong",
  "unexpected error",
  "we're sorry",
  "we are sorry",
  "please try again later",
  "an error occurred",
];

function shipCheck(text: string): void {
  const lower = text.toLowerCase();
  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase)) {
      throw new Error(`entry hides behind a vague phrase: "${phrase}"`);
    }
  }
  // The gate counts characters, but the file is read as bytes: keep the two
  // in agreement so the scorer sees exactly what we validated.
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes !== text.length) {
    throw new Error(`entry is ${bytes} bytes but ${text.length} characters`);
  }
}

validateEntry(ENTRY);
shipCheck(ENTRY);
mkdirSync("/output", { recursive: true });
writeFileSync(TARGET, ENTRY, { encoding: "utf8" });
console.log(`saved ${ENTRY.length}-character entry to ${TARGET}`);
console.log(ENTRY);
