const express = require("express");
const puppeteer = require("puppeteer-core");
const fetch = require("node-fetch");
const FormData = require("form-data");

const app = express();
const PORT = 3000;

const EMAIL = "ronicyt69@gmail.com";
const PASSWORD = process.env.PASS;

// 🔴 PUT YOUR REAL WEBHOOK URL HERE
const WEBHOOK_URL = "https://discord.com/api/webhooks/1478312188358955050/2EvRjowjV8W5JFXw-TQ6WK-agI41AIRMlx1J4adCfxha__9DX6PcH_z0J3FE269G0ITd";

let browser;
let page;

// ==========================
// Start Miner
// ==========================
async function startMiner() {
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

    console.log("🌐 Opening miner page...");
    await page.goto("https://rhinocoin.app/miner", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    console.log("⌛ Waiting for login...");
    await page.waitForSelector("#input-v-5", { timeout: 30000 });

    console.log("🔑 Typing credentials...");
    await page.type("#input-v-5", EMAIL, { delay: 50 });
    await page.type("#input-v-8", PASSWORD, { delay: 50 });

    await page.keyboard.press("Enter");

    console.log("✅ Login submitted");

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

    // ========================
    // Screenshot Loop (5 mins)
    // ========================
    setInterval(async () => {
      try {
        console.log("📸 Taking screenshot...");

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

        if (response.status !== 204) {
          console.log("Discord error:", await response.text());
        } else {
          console.log("✅ Screenshot sent to Discord");
        }

      } catch (err) {
        console.error("❌ Screenshot error:", err);
      }
    }, 5 * 60 * 1000);

  } catch (err) {
    console.error("❌ Miner startup error:", err);
  }
}

// ==========================
// Route
// ==========================
app.get("/", (req, res) => {
  res.send("✅ Miner running");
});

// ==========================
// Start Server + Miner
// ==========================
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await startMiner();
});
