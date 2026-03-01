const express = require("express");
const puppeteer = require("puppeteer-core");

const app = express();
const PORT = 3000;

const EMAIL = "ronicyt69@gmail.com";
const PASSWORD = process.env.PASS;

app.get("/miner", async (req, res) => {
  let browser;

  console.log("⛏️ /miner route called");

  try {
    console.log("🚀 Launching browser...");

    browser = await puppeteer.launch({
      headless: true,
      executablePath: "/opt/render/project/.render/chrome/opt/google/chrome/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    console.log("🌐 Opening miner page...");
    await page.goto("https://rhinocoin.app/miner", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    console.log("⌛ Waiting for login fields...");
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

    console.log("⏳ Waiting before screenshot...");
    await new Promise(r => setTimeout(r, 72 * 1000 * 1000));

    console.log("📸 Taking screenshot...");
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: true
    });

    await browser.close();
    console.log("🛑 Browser closed");

    // ======================
    // Upload to server
    // ======================

    console.log("📤 Uploading screenshot...");

    const formData = new FormData();
    const blob = new Blob([screenshot], { type: "image/png" });

    formData.append("image", blob, "miner.png");

    const uploadResponse = await fetch("https://baths-jungle-speaker-welcome.trycloudflare.com/upload", {
      method: "POST",
      body: formData
    });

    const text = await uploadResponse.text();

    console.log("📨 Upload response:", text);

    res.send("✅ Miner completed & uploaded");

  } catch (err) {
    console.error("❌ Miner error:", err);

    if (browser) await browser.close();

    res.status(500).send("Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Miner server running: http://localhost:${PORT}/miner`);
});
