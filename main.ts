// THE WORLD IN ONE DAY — Monday 23 November 2026.
// A newspaper-style infographic summing up 23 November 2026 world news.
// Drawn entirely in code: embedded 5x7 bitmap font, hand-written PNG encoder.
// No network, no clock, no randomness. Node 22 stdlib only.
// Writes entry.png (1024x1024) into OUTPUT_DIR (default /output).

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

const W = 1024;
const H = 1024;

type RGB = [number, number, number];
const PAPER: RGB = [245, 240, 225];
const INK: RGB = [25, 25, 25];
const CARD_BG: RGB = [255, 255, 255];
const WHITE: RGB = [255, 255, 255];
const MASTHEAD_RED: RGB = [158, 43, 37];
const RULE_GREY: RGB = [120, 112, 96];

// 5x7 bitmap font. Each glyph is 7 rows; each row is a 5-bit mask,
// bit 4 = leftmost pixel. Only the characters the copy uses are defined.
const FONT: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 27, 17],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 2, 4, 8, 31],
  "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2],
  "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14],
  "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 2, 12],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 12, 4, 8],
  ":": [0, 12, 12, 0, 12, 12, 0],
  ";": [0, 12, 12, 0, 12, 4, 8],
  "'": [4, 4, 8, 0, 0, 0, 0],
  '"': [10, 10, 10, 0, 0, 0, 0],
  "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 2, 4, 0, 4],
  "-": [0, 0, 0, 14, 0, 0, 0],
  "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8],
  "/": [1, 1, 2, 4, 8, 16, 16],
  "%": [25, 25, 2, 4, 8, 19, 19],
  "&": [12, 18, 20, 8, 21, 18, 13],
  "+": [0, 4, 4, 31, 4, 4, 0],
  "=": [0, 0, 31, 0, 31, 0, 0],
  $: [4, 15, 20, 14, 5, 30, 4],
  "#": [10, 10, 31, 10, 31, 10, 10],
  "*": [0, 4, 21, 14, 21, 4, 0],
  "@": [14, 17, 23, 21, 22, 16, 14],
};

// Normalise copy to the glyphs the font can draw.
function norm(s: string): string {
  return s
    .toUpperCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/[^A-Z0-9 .,;:!?'"()/%&+=#*@-]/g, " ");
}

class Canvas {
  data = new Uint8Array(W * H * 3);

  constructor() {
    this.fill(PAPER);
  }

  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.data[i * 3] = c[0];
      this.data[i * 3 + 1] = c[1];
      this.data[i * 3 + 2] = c[2];
    }
  }

  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        this.px(xx, yy, c);
      }
    }
  }

  strokeRect(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
    this.rect(x, y, w, t, c);
    this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c);
    this.rect(x + w - t, y, t, h, c);
  }

  static charWidth(scale: number): number {
    return 6 * scale;
  }

  textWidth(s: string, scale: number): number {
    const t = norm(s);
    if (t.length === 0) return 0;
    return t.length * Canvas.charWidth(scale) - scale;
  }

  // Draws text at (x, y); returns the pixel width drawn.
  text(s: string, x: number, y: number, scale: number, c: RGB): number {
    const t = norm(s);
    let cx = x;
    for (const ch of t) {
      const glyph = FONT[ch] ?? FONT[" "];
      for (let row = 0; row < 7; row++) {
        const bits = glyph[row];
        for (let col = 0; col < 5; col++) {
          if (bits & (16 >> col)) {
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                this.px(cx + col * scale + dx, y + row * scale + dy, c);
              }
            }
          }
        }
      }
      cx += Canvas.charWidth(scale);
    }
    return cx - x - scale;
  }

  centered(s: string, cx: number, y: number, scale: number, c: RGB): void {
    const w = this.textWidth(s, scale);
    this.text(s, cx - Math.floor(w / 2), y, scale, c);
  }

  // Greedy word wrap. Returns the lines (already normalised).
  wrap(s: string, maxWidth: number, scale: number): string[] {
    const words = norm(s).split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const trial = line === "" ? word : line + " " + word;
      if (this.textWidth(trial, scale) <= maxWidth || line === "") {
        line = trial;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line !== "") lines.push(line);
    return lines;
  }

  // Minimal PNG encoder: 8-bit RGB, no filtering, zlib level 9.
  toPNG(): Buffer {
    const raw = Buffer.alloc(H * (1 + W * 3));
    for (let y = 0; y < H; y++) {
      const rowStart = y * (1 + W * 3);
      raw[rowStart] = 0;
      raw.set(this.data.subarray(y * W * 3, (y + 1) * W * 3), rowStart + 1);
    }
    const idat = deflateSync(raw, { level: 9 });

    const crcTable: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
    const crc32 = (buf: Buffer): number => {
      let c = 0xffffffff;
      for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    };
    const chunk = (type: string, data: Buffer): Buffer => {
      const out = Buffer.alloc(12 + data.length);
      out.writeUInt32BE(data.length, 0);
      out.write(type, 4, "ascii");
      data.copy(out, 8);
      out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
      return out;
    };

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(W, 0);
    ihdr.writeUInt32BE(H, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // colour type RGB
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
  }
}

interface Story {
  num: string;
  kicker: string;
  colour: RGB;
  headline: string;
  body: string;
}

const STORIES: Story[] = [
  {
    num: "01",
    kicker: "CLIMATE",
    colour: [158, 43, 37],
    headline: "COP31 COLLAPSES",
    body: "UN climate talks in Antalya collapse on Sun 22 Nov: no deal, the first major COP breakdown since Copenhagen 2009 and the longest COP ever. The EU and others rejected a pact with no mention of fossil fuels.",
  },
  {
    num: "02",
    kicker: "SPORT",
    colour: [31, 78, 121],
    headline: "ALCARAZ WINS ATP FINALS",
    body: "Carlos Alcaraz beats world No. 1 Alexander Zverev 6-2, 7-6(7) in Turin on Sun 22 Nov for his maiden ATP Finals title. He is the 4th man to hold a career Grand Slam and the ATP Finals title.",
  },
  {
    num: "03",
    kicker: "BALTIC",
    colour: [55, 71, 79],
    headline: "RUSSIAN SHIP STILL BURNING",
    body: "A Russian cargo ship is still on fire off Finland after a Baltic drone attack. Finland tightens security as the blaze continues.",
  },
  {
    num: "04",
    kicker: "INDONESIA",
    colour: [180, 83, 9],
    headline: "INDONESIA FACTORY FIRE",
    body: "The death toll rises after the factory fire: 24 body bags have been recovered and dozens are still missing.",
  },
  {
    num: "05",
    kicker: "UKRAINE",
    colour: [77, 124, 15],
    headline: "KYIV REGION DRONE HIT",
    body: "At least 14 people are missing after a Russian drone hits a building in the Kyiv region, Zelenskiy says.",
  },
  {
    num: "06",
    kicker: "MIDDLE EAST",
    colour: [124, 45, 18],
    headline: "HORMUZ TANKERS ABLAZE",
    body: "Iran war: tankers are set ablaze in the Strait of Hormuz. Two people are wounded in Bahrain in Iranian strikes, and a Saudi-led coalition intercepts a Houthi missile.",
  },
  {
    num: "07",
    kicker: "UNITED NATIONS",
    colour: [21, 94, 117],
    headline: "UN: LETHAL AI TALKS GO ON",
    body: "Nations agree at a UN conference to continue negotiations on lethal autonomous weapons, but with no binding commitment to rein them in.",
  },
  {
    num: "08",
    kicker: "ISRAEL",
    colour: [88, 28, 135],
    headline: "ISRAEL GOVT TALKS FAIL",
    body: "Netanyahu's and Eisenkot's parties end talks without a deal on forming Israel's next government.",
  },
];

const BRIEF: string[] = [
  "Nepal: PM Balendra Shah holds bilateral talks with PM Modi in Delhi.",
  "South Korea: education minister resigns over an AI exam-cheating scandal.",
  "North Korea: Kim says the country seeks security, not supremacy.",
  "South Sudan: 24 civilians killed in fresh violence.",
  "DR Congo: WHO chief pleads for peace in the Ebola-hit area.",
  "COP31: Australian PM Albanese calls the failure a sign of 'difficult geopolitical times'.",
];

function drawMasthead(cv: Canvas): void {
  cv.centered("THE WORLD IN ONE DAY", W / 2, 24, 5, INK);
  cv.centered("MONDAY 23 NOVEMBER 2026", W / 2, 72, 2, MASTHEAD_RED);
  cv.rect(24, 98, W - 48, 4, INK);
  cv.rect(24, 106, W - 48, 1, INK);
}

function drawCard(cv: Canvas, story: Story, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, CARD_BG);
  cv.strokeRect(x, y, w, h, 2, INK);
  // Kicker bar.
  cv.rect(x + 2, y + 2, w - 4, 24, story.colour);
  cv.text(story.kicker, x + 12, y + 9, 1, WHITE);
  const numW = cv.textWidth(story.num, 1);
  cv.text(story.num, x + w - 12 - numW, y + 9, 1, WHITE);
  // Headline, up to two lines.
  const headLines = cv.wrap(story.headline, w - 24, 2).slice(0, 2);
  let hy = y + 36;
  for (const line of headLines) {
    cv.text(line, x + 12, hy, 2, INK);
    hy += 18;
  }
  // Thin rule between headline and body, newspaper style.
  cv.rect(x + 12, hy + 2, w - 24, 1, RULE_GREY);
  // Body, up to six lines.
  const bodyLines = cv.wrap(story.body, w - 24, 2).slice(0, 6);
  let by = hy + 10;
  for (const line of bodyLines) {
    cv.text(line, x + 12, by, 2, INK);
    by += 18;
  }
  // Footer rule near the card bottom, so shorter stories still read as
  // finished newspaper cards instead of trailing off into blank space.
  // Skipped on six-line bodies, where the last line already reaches the
  // bottom of the card and the rule would strike through the text.
  if (bodyLines.length <= 5) {
    cv.rect(x + 12, y + h - 14, w - 24, 1, RULE_GREY);
  }
  console.log(`card ${story.num}: headline ${headLines.length} lines, body ${bodyLines.length} lines`);
}

function drawBrief(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, CARD_BG);
  cv.strokeRect(x, y, w, h, 2, INK);
  cv.text("IN BRIEF", x + 12, y + 10, 2, MASTHEAD_RED);
  cv.rect(x + 12, y + 30, w - 24, 1, RULE_GREY);
  const colW = Math.floor((w - 24 - 24) / 2);
  for (let i = 0; i < BRIEF.length; i++) {
    const col = Math.floor(i / 3);
    const row = i % 3;
    const ix = x + 12 + col * (colW + 24);
    const iy = y + 42 + row * 32;
    const lines = cv.wrap("- " + BRIEF[i], colW, 1).slice(0, 2);
    let ly = iy;
    for (const line of lines) {
      cv.text(line, ix, ly, 1, INK);
      ly += 11;
    }
  }
}

function main(): void {
  const cv = new Canvas();
  drawMasthead(cv);

  const margin = 24;
  const gap = 12;
  const cardW = Math.floor((W - margin * 2 - gap) / 2);
  const cardH = 176;
  const gridTop = 120;
  for (let i = 0; i < STORIES.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (cardW + gap);
    const y = gridTop + row * (cardH + gap);
    drawCard(cv, STORIES[i], x, y, cardW, cardH);
  }

  const stripY = gridTop + 4 * cardH + 3 * gap + 12;
  drawBrief(cv, margin, stripY, W - margin * 2, 140);
  cv.rect(margin, stripY + 148, W - margin * 2, 2, INK);

  const outDir = process.env.OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const png = cv.toPNG();
  writeFileSync(join(outDir, "entry.png"), png);
  console.log(`wrote ${join(outDir, "entry.png")} (${png.length} bytes)`);
}

main();
