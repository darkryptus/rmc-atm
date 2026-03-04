const express = require("express");
const puppeteer = require("puppeteer-core");
const fetch = require("node-fetch");
const FormData = require("form-data");

const cloudflare = "https://voting-cathedral-path-asks.trycloudflare.com";

const app = express();
const PORT = 3000;

const EMAIL = "ronicyt69@gmail.com";
const PASSWORD = process.env.PASS;

let browser;
let page;

// health route
app.get("/", (req, res) => {
  res.send("server running");
});

async function startMiner() {

  console.log("⛏️ Starting miner...");

  try {

    console.log("🚀 Launching browser");

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

    console.log("🌐 Opening miner page");

    await page.goto("https://rhinocoin.app/miner", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    console.log("⌛ Waiting for login");

    await page.waitForSelector("#input-v-5");

    console.log("🔑 Typing credentials");

    await page.type("#input-v-5", EMAIL, { delay: 50 });
    await page.type("#input-v-8", PASSWORD, { delay: 50 });

    await page.keyboard.press("Enter");

    console.log("✅ Login submitted");

    await page.waitForTimeout(5000);

    console.log("🔍 Searching Start Miner button");

    await page.evaluate(() => {

      const span = [...document.querySelectorAll("span")]
        .find(el => el.textContent && el.textContent.includes("Start Miner"));

      if (span) span.click();

    });

    console.log("⛏️ Miner started");

    // =========================
    // RANDOM START DELAY
    // =========================

    const randomDelay = Math.floor(Math.random() * 300000);

    console.log(
      `🎲 Random start delay: ${Math.round(randomDelay / 1000)} seconds`
    );

    setTimeout(() => {

      console.log("📸 Screenshot loop started");

      setInterval(async () => {

        try {

          console.log("📸 Taking screenshot");

          const screenshot = await page.screenshot({
            type: "png",
            fullPage: true
          });

          const formData = new FormData();

          formData.append("image", screenshot, {
            filename: "miner.png",
            contentType: "image/png"
          });

          console.log("📤 Uploading screenshot");

          const uploadResponse = await fetch(
            `${cloudflare}/upload`,
            {
              method: "POST",
              body: formData
            }
          );

          const text = await uploadResponse.text();

          console.log("📨 Upload response:", text);

        } catch (err) {

          console.log("⚠️ Screenshot error:", err.message);

        }

      }, 5 * 60 * 1000);

    }, randomDelay);

  } catch (err) {

    console.log("❌ Miner error:", err);

    if (browser) await browser.close();

  }
}

app.listen(PORT, async () => {

  console.log(`🚀 Server running on port ${PORT}`);

  // start miner automatically
  startMiner();

});
