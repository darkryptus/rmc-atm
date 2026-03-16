const express = require("express");
const puppeteer = require("puppeteer-core");

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

    await new Promise(resolve => setTimeout(resolve, 5000));

//    await page.locator('button:has(i.mdi-chevron-down)').click();

await page.locator('[data-v-b0d2f4e7] button.v-btn--icon').click();

await page.waitForSelector('#input-v-65', { visible: true });
await page.click('#input-v-65');

await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');

    console.log("🔍 Searching Start Miner button");

    await page.evaluate(() => {

      const span = [...document.querySelectorAll("span")]
        .find(el => el.textContent && el.textContent.includes("Start Miner"));

      if (span) span.click();

    });

    console.log("⛏️ Miner started");

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
//manual auto deploy trigger commit 6
