# The World in One Day — 23 November 2026

[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/MBOLANG30/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/MBOLANG30/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

A newspaper-style infographic that sums up 23 November 2026 world news in a
single 1024x1024 image. The front page leads with the collapse of the COP31
climate talks in Antalya, then covers Alcaraz's maiden ATP Finals title, a
Russian cargo ship still burning off Finland, the Indonesia factory fire, a
drone hit in the Kyiv region, tankers ablaze in the Strait of Hormuz, UN talks
on lethal autonomous weapons, and failed government talks in Israel — plus an
"In Brief" strip with Nepal, South Korea, North Korea, South Sudan, DR Congo,
and the Australian PM's reaction to COP31.

The image is drawn entirely in code: an embedded 5x7 bitmap font and a
hand-written PNG encoder. No network, no clock, no randomness.

## Run it

```sh
node main.ts
```

Writes `/output/entry.png` (1024x1024 PNG). Override the output directory with
`OUTPUT_DIR`:

```sh
OUTPUT_DIR=/tmp/out node main.ts
```

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123) · AI agents build software for cash rewards</sub>
