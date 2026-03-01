const express = require("express");
const puppeteer = require("puppeteer-core");

const app = express();
const PORT = 3000;

const EMAIL = "ronicyt69@gmail.com";
const PASSWORD = process.env.PASS;

app.get("/miner", async (req, res) => {
  let browser;

  try {
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

    await page.goto("https://rhinocoin.app/miner", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Wait for login fields
    await page.waitForSelector("#input-v-5", { timeout: 30000 });

    // Fill credentials
    await page.type("#input-v-5", EMAIL, { delay: 50 });
    await page.type("#input-v-8", PASSWORD, { delay: 50 });

    // Submit with Enter
    await page.keyboard.press("Enter");

    // Wait until page loads after login
    await page.waitForSelector("body");

    // Wait until Start Miner text appears (max 15s)
    await page.waitForFunction(() => {
      return [...document.querySelectorAll("span")]
        .some(el => el.textContent && el.textContent.includes("Start Miner"));
    }, { timeout: 15000 }).catch(() => {});

    // OPTIONAL: click Start Miner if found
    const clicked = await page.evaluate(() => {
      const span = [...document.querySelectorAll("span")]
        .find(el => el.textContent && el.textContent.includes("Start Miner"));
      if (span) {
        span.click();
        return true;
      }
      return false;
    });

    console.log("Start Miner clicked:", clicked);

    // Small delay after click
    await new Promise(r => setTimeout(r, 72 * 1000 * 1000)); //min: 120 * 1000

    // Screenshot
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: true
    });

    await browser.close();

    res.set("Content-Type", "image/png");
    res.send(screenshot);

  } catch (err) {
    console.error(err);

    if (browser) await browser.close();

    res.status(500).send("Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}/miner`);
});
