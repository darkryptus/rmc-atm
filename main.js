const express = require("express");
const puppeteer = require("puppeteer-core");

const app = express();
const PORT = 3000;

const EMAIL = "ronicyt69@gmail.com";
const PASSWORD = process.env.PASS;

// 🔴 PUT YOUR DISCORD WEBHOOK HERE
const WEBHOOK_URL = "https://discord.com/api/webhooks/1478312188358955050/2EvRjowjV8W5JFXw-TQ6WK-agI41AIRMlx1J4adCfxha__9DX6PcH_z0J3FE269G0ITd";

let browser = null;
let page = null;

// ==========================
// Miner Function
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

    console.log("🔍 Looking for Start Miner button...");
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
    // Screenshot loop every 5 mins
    // ========================
    setInterval(async () => {
      try {
        console.log("📸 Taking screenshot...");

        const screenshot = await page.screenshot({
          type: "png",
          fullPage: true
        });

        console.log("📤 Sending to Discord...");

        const formData = new FormData();
        const blob = new Blob([screenshot], { type: "image/png" });

        formData.append("file", blob, "miner.png");
        formData.append(
          "content",
          `📊 Miner Screenshot\n🕒 ${new Date().toLocaleString()}`
        );

        await fetch(WEBHOOK_URL, {
          method: "POST",
          body: formData
        });

        console.log("✅ Sent to Discord");

      } catch (err) {
        console.error("❌ Screenshot error:", err);
      }
    }, 5 * 60 * 1000); // 5 minutes

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

// ==========================
// Start server + miner
// ==========================
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Auto start miner
  await startMiner();
});
