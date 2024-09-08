const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
import { exists } from "node:fs";

const websites = process.env.WEBSITES;
let prefix_png = process.env.PREFIX_PNG || "./png";
let prefix_pdf = process.env.PREFIX_PDF || "./pdf";
let full_page_suffix = process.env.SUFFIX_FULLPAGE || "full";
let dateObject = new Date();
let date = ("0" + dateObject.getDate()).slice(-2);
let month = ("0" + (dateObject.getMonth() + 1)).slice(-2);
let year = dateObject.getFullYear();

exists(`${prefix_png}/${year}/${month}/${date}`, (exists) => {
  if (!exists) {
    fs.mkdir(
      `${prefix_png}/${year}/${month}/${date}`,
      { recursive: true },
      (err) => {
        /* Do nothing */
      }
    );
  }
});

exists(`${prefix_pdf}/${year}/${month}/${date}`, (exists) => {
  if (!exists) {
    fs.mkdir(
      `${prefix_pdf}/${year}/${month}/${date}`,
      { recursive: true },
      (err) => {
        /* Do nothing */
      }
    );
  }
});

if (websites) {
  const websitesArray = websites.split(",");

  websitesArray.forEach((website) => {
    const url = website.trim();
    const hostname = new URL(url).hostname.replace(/\./g, "_");
    const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 8);
    screenshot(url, `${hostname}_${hash}`);
  });
} else {
  console.error("[ERROR] No WEBSITES!");
}

async function screenshot(url, id) {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: {
      width: 1024,
      height: 655,
    },
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
    });
  } catch (e) {
    console.log(`[Error] ${e}`);
    // Close the browser
    await browser.close();
    return;
  }

  page.once("load", () => console.log("[INFO] Page loaded successfully"));

  try {
    await page.screenshot({
      path: `${prefix_png}/${year}/${month}/${date}/${id}-${dateObject.getHours()}.png`,
      fullPage: false,
    });
    await page.screenshot({
      path: `${prefix_png}/${year}/${month}/${date}/${id}-${dateObject.getHours()}-${full_page_suffix}.png`,
      fullPage: true,
    });

    await page.pdf({
      path: `${prefix_pdf}/${year}/${month}/${date}/${id}-${dateObject.getHours()}.pdf`,
      format: "a4",
    });
  } catch (e) {}

  await browser.close();
}
