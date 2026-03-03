const express = require("express");
const puppeteer = require("puppeteer-core");
const fetch = require("node-fetch");
const FormData = require("form-data");

const app = express();
const PORT = 3000;

const EMAIL = "ronicyt69@gmail.com";
const PASSWORD = process.env.PASS;
const WEBHOOK_URL = "https://discord.com/api/webhooks/1478312188358955050/2EvRjowjV8W5JFXw-TQ6WK-agI41AIRMlx1J4adCfxha__9DX6PcH_z0J3FE269G0ITd";

let browser;
let page;
let minerStarted = false;

// ==========================
// Safe Sleep Helper
// ==========================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================
// Screenshot Loop (Anti-429)
// ==========================
async function screenshotLoop() {

  // Random initial delay (0–2 mins)
  const initialDelay = Math.floor(Math.random() * 120000);
  console.log("⏳ Initial random delay:", initialDelay, "ms");
  await sleep(initialDelay);

  while (true) {
    try {
      console.log("📸 Taking screenshot at", new Date().toISOString());

      const screenshot = await page.screenshot({
        type: "png",
        fullPage: true
      });

      const form = new FormData();

      form.append("file", screenshot, {
        filename: "miner.png",
        contentType: "image/png"
      });

      form.append(
        "payload_json",
        JSON.stringify({
          content: `📊 Miner Screenshot\n🕒 ${new Date().toLocaleString()}`
        })
      );

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: form,
        headers: form.getHeaders()
      });

      console.log("Discord status:", response.status);

      // Handle rate limit properly
      if (response.status === 429) {
        const data = await response.json();
        const retry = data.retry_after || 5000;
        console.log("⚠️ Rate limited. Waiting", retry, "ms");
        await sleep(retry);
      }

    } catch (err) {
      console.error("❌ Screenshot error:", err);
    }

    // Base 5 minutes + random 0-60 sec offset
    const baseDelay = 5 * 60 * 1000;
    const randomOffset = Math.floor(Math.random() * 60000);
    const totalDelay = baseDelay + randomOffset;

    console.log("⏳ Next screenshot in", totalDelay, "ms");
    await sleep(totalDelay);
  }
}

// ==========================
// Start Miner
// ==========================
async function startMiner() {

  if (minerStarted) {
    console.log("⚠️ Miner already running");
    return;
  }

  minerStarted = true;

  try {
    console.log("🚀 Launching browser...");

    browser = await puppeteer.launch({
      headless: true,
      executablePath:
        "/opt/render/project/.render/chrome/opt/google/chrome/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    page = await browser.newPage();

    await page.goto("https://rhinocoin.app/miner", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await page.waitForSelector("#input-v-5", { timeout: 30000 });

    await page.type("#input-v-5", EMAIL, { delay: 50 });
    await page.type("#input-v-8", PASSWORD, { delay: 50 });

    await page.keyboard.press("Enter");

    await page.waitForSelector("body");

    console.log("🔍 Clicking Start Miner...");

    await page.waitForFunction(() => {
      return [...document.querySelectorAll("span")]
        .some(el => el.textContent && el.textContent.includes("Start Miner"));
    }, { timeout: 15000 }).catch(() => {});

    await page.evaluate(() => {
      const span = [...document.querySelectorAll("span")]
        .find(el => el.textContent && el.textContent.includes("Start Miner"));
      if (span) span.click();
    });

    console.log("✅ Miner started");

    // Start screenshot loop
    screenshotLoop();

  } catch (err) {
    console.error("❌ Miner startup error:", err);
  }
}

// ==========================
// Routes
// ==========================
app.get("/", (req, res) => {
  res.send("✅ Miner running");
});

app.get("/miner", async (req, res) => {
  await startMiner();
  res.send("Miner triggered");
});

// ==========================
// Start Server + Auto Start
// ==========================
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await startMiner();
});
