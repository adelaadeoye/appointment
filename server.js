const app = require("./index");
moment = require("moment-timezone");

const jwt = require("jsonwebtoken");
const { chromium } = require("playwright");
const tough = require("tough-cookie");
const fetchCookie = require("fetch-cookie").default || require("fetch-cookie");
const cheerio = require("cheerio");
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const PORT = process.env.PORT || 4000;

const loginUrl =
  "https://auth.visas-de.tlscontact.com/auth/realms/atlas/protocol/openid-connect/auth?client_id=tlscitizen&redirect_uri=https%3A%2F%2Fvisas-de.tlscontact.com%2Fen-us%2Fauth-callback&state=d88c6ad2-c56c-487e-83f0-25bc14eed136&response_mode=query&response_type=code&scope=openid&nonce=024374d3-0488-4b50-af5d-06da4becacff&ui_locales=en";

// Replace with your actual credentials
const USERNAME = "adeoye.adela@gmail.com";
const PASSWORD = "tC@jC5QzyqhywFZ";
// Setup cookie jar and fetch with cookie support
const cookieJar = new tough.CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookieJar);
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});
const chatId = process.env.TELEGRAM_CHAT_ID;
async function performLoginAndGetTlsAuth() {
  try {
    // Step 1: Fetch login page
    const loginPageRes = await fetchWithCookies(loginUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
      },
    });
    const loginHtml = await loginPageRes.text();
    const $ = cheerio.load(loginHtml);

    // Step 2: Extract form and inputs
    const form = $("form");
    const action = form.attr("action");
    if (!action) throw new Error("Form action not found");

    const postUrl = action.startsWith("http")
      ? action
      : `https://auth.visas-de.tlscontact.com${action}`;

    const formData = {};
    $("form input").each((i, input) => {
      const name = $(input).attr("name");
      const value = $(input).attr("value") || "";
      if (name) formData[name] = value;
    });

    // Step 3: Insert username/password
    formData.username = USERNAME;
    formData.password = PASSWORD;

    // Step 4: Submit login form
    const formBody = new URLSearchParams(formData).toString();
    const loginRes = await fetchWithCookies(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Referer: loginUrl,
      },
      body: formBody,
      redirect: "manual", // manual redirect to catch location header
    });

    if (loginRes.status !== 302) {
      const body = await loginRes.text();
      throw new Error(
        `Login failed or unexpected status ${loginRes.status}: ${body}`
      );
    }

    const redirectUrl = loginRes.headers.get("location");
    if (!redirectUrl) throw new Error("Redirect location missing after login");

    // Step 5: Fetch auth-callback URL
    let currentUrl = redirectUrl;
    let response;

    // Follow redirects manually to ensure cookie jar captures Set-Cookie headers
    while (true) {
      response = await fetchWithCookies(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: loginUrl,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
      });

      // Consume body fully to process cookies
      await response.text();

      if (response.status === 302) {
        const nextLocation = response.headers.get("location");
        if (!nextLocation) break;
        currentUrl = nextLocation.startsWith("http")
          ? nextLocation
          : new URL(nextLocation, currentUrl).toString();
      } else {
        break; // No more redirects, stop
      }
    }

    // Step 6: Print final cookies
    const cookies = await cookieJar.getCookies(
      "https://visas-de.tlscontact.com"
    );
    const tlsCookies = {
      tls_auth: null,
      tls_id: null,
      tls_refresh_token: null,
      __cf_bm: null,
    };
    cookies.forEach((cookie) => {
      const { key, value } = cookie.toJSON();
      if (key === "tls_auth") tlsCookies.tls_auth = value;
      if (key === "tls_id") tlsCookies.tls_id = value;
      if (key === "tls_refresh_token") tlsCookies.tls_refresh_token = value;
      if (key === "__cf_bm") tlsCookies.__cf_bm = value;
    });
    if (tlsCookies.tls_auth) {
      return tlsCookies;
    } else {
      return null;
    }
  } catch (err) {
    console.error("❌ Login flow error:", err);
    return null;
  }
}

async function startServer() {
  try {
    server = app.listen(PORT, () => {
      console.log(`\n****** Server is now listening on PORT ${PORT} *****`);
    });

    let avaialbleDate = false;
    let lastTimeShown = new Date();
    const osano_consentmanager_uuid = "488126fa-0cc5-4c23-9c5d-31a37638eef7";
    const osano_consentmanager =
      "L_1j7j6eKCIzh2Obd-0fN7uORm7zQDLydFzPCvGj0dV1iTqoRuQDkh9n84mHlJ3xhZ_CqOk8WEv2551HJqf4b2xR1Njrc5TFIX7FGlVDy5g7vWepVzKQAFLdTIETK5vCWGG5ep1lRU9peAb5dwEFiI2vsabt4HU14WuS7kPbBBt7eIuAyiqUgbWyV360PSfwOHFKR9fjWhj6OhrBVBKFotCfOLco_PwbhyurMm-LlN2eNa3pzAHtVLpueeXU5kSAg7QD-1IwsbNsygwDj3LY4udq9SRfcpLS0VJKCGpAsBKVRuSDYlVx9DB1aP5KYFR-";
    const datadome =
      "6fFpRM7o~WICTFQqYy9lE~XPWEJdljrU9r85L_goVFULG551XBYWgyjy25Pd1Y4TbNXdKQC8tzjDTZGiRpbZof0HDKxlmjqP7B1rDxSaDb8LUBaoeb~Q~LoxaKNL1fdQ";
    const cf_clearance =
      "dulqJlhxgsGA.JVd1iX_bIySHa0ahNX15eS5yhPEuFQ-1750222192-1.2.1.1-v4EzqqHYZ2cl07yD.9QwaIju8GyZqbKEyPoricGsGQAJweB7M7q3OxkcONYFjxvT9zwFFZdW6Vycjip6nm9RvADASWDWey6iHYW4Vj8xmX9OoCfSkletMDlHpXeu9ncOoFEk5V1.P.u8KHFxWGDIljTbzo_xmD6AfmQD.e.QCEuAbAY4KiVdw9Ezr1p8RuU5i5ciF5wh8uG9e4_k0s85l60NbLvzq56FgsHZto.OGtfNXDT3AM3Dol5WueUbTAu60yZvYkuj.7DGqjgVJOfs9q1AB2PwsnHtLJZWD18Do3AIl8iM_Ns01XRORSN3GH5ye0k4rM2_pKCHpVW7kF2sb3.p.S.HVMyloU4wpqZAWjU";
    const _dd_s =
      "rum=2&id=0013b29a-18ef-4a7a-8f1b-d1fcb630d6a2&created=1750566974331&expire=1750567925269";
    let tlsCookies = {
      tls_auth: null,
      tls_id: null,
      tls_refresh_token: null,
      __cf_bm: null,
    };
    try {
      const tlsCookiesResponse = await performLoginAndGetTlsAuth();
      if (tlsCookiesResponse) {
        tlsCookies = tlsCookiesResponse;
        console.log("✅ Successfully retrieved tls_auth cookie:");
        // Here you can set the cookie in your application or send it to the client
      } else {
        console.error("❌ Failed to retrieve tls_auth cookie.");
      }
    } catch (err) {
      console.error("❌ Error during login flow:", err);
    }
    const axios = require("axios");

    // async function fetchAppointmentPage(
    //   tlsCookies,
    //   osano_consentmanager_uuid,
    //   osano_consentmanager,
    //   datadome,
    //   cf_clearance,
    //   _dd_s
    // ) {
    //   try {
    //     const res = await axios.get(
    //       "https://visas-de.tlscontact.com/en-us/3257211/workflow/appointment-booking?location=gbMNC2de",
    //       {
    //         timeout: 5000,
    //         headers: {
    //           accept: "*/*",
    //           "accept-language": "en-US,en;q=0.9",
    //           "user-agent":
    //             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    //           referer:
    //             "https://visas-de.tlscontact.com/en-us/3257211/workflow/appointment-booking?location=gbMNC2de",
    //           cookie: generateCookieHeader(
    //             tlsCookies,
    //             osano_consentmanager_uuid,
    //             osano_consentmanager,
    //             datadome,
    //             cf_clearance,
    //             _dd_s
    //           ),
    //         },
    //       }
    //     );

    //     const html = res.data;
    //     console.log("Fetched appointment page successfully.");
    //     return html;
    //   } catch (err) {
    //     console.error("Error fetching appointment page:", err);
    //     return null;
    //   }
    // }

    // function generateCookieHeader(
    //   tlsCookies,
    //   osanoUuid,
    //   osanoConsent,
    //   datadome,
    //   cfClearance,
    //   dd_s
    // ) {
    //   const parts = [];
    //   if (osanoUuid) parts.push(`osano_consentmanager_uuid=${osanoUuid}`);
    //   if (osanoConsent) parts.push(`osano_consentmanager=${osanoConsent}`);
    //   if (datadome) parts.push(`datadome=${datadome}`);
    //   if (cfClearance) parts.push(`cf_clearance=${cfClearance}`);
    //   if (tlsCookies.tls_auth) parts.push(`tls_auth=${tlsCookies.tls_auth}`);
    //   if (tlsCookies.tls_id) parts.push(`tls_id=${tlsCookies.tls_id}`);
    //   if (tlsCookies.tls_refresh_token)
    //     parts.push(`tls_refresh_token=${tlsCookies.tls_refresh_token}`);
    //   if (dd_s) parts.push(`_dd_s=${dd_s}`);
    //   return parts.join("; ");
    // }

    async function fetchAppointmentPageWithPlaywright(tlsCookies) {
      const browser = await chromium.launch({ headless: true }); // or false for debugging
      const context = await browser.newContext();

      // Manually set cookies from tlsCookies into browser context
      const cookies = [];
      for (const [name, value] of Object.entries(tlsCookies)) {
        if (value) {
          cookies.push({
            name,
            value,
            domain: "visas-de.tlscontact.com",
            path: "/",
            httpOnly: false,
            secure: true,
            sameSite: "Lax",
          });
        }
      }

      await context.addCookies(cookies);
      const page = await context.newPage();

      try {
        await page.setExtraHTTPHeaders({
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        });
        await page.goto(
          "https://visas-de.tlscontact.com/en-us/3257211/workflow/appointment-booking?location=gbMNC2de",
          {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          }
        );

        const content = await page.content(); // full HTML of page
        console.log("✅ Fetched appointment page with Playwright");
        await browser.close();
        return content;
      } catch (err) {
        console.error("❌ Playwright fetch error:", err);
        await browser.close();
        return null;
      }
    }

    while (true) {
      // Check if the token is close to expiry and refresh if needed
      const decoded = jwt.decode(tlsCookies.tls_auth, { complete: true });
      if (decoded && decoded.payload.exp) {
        const expiryDate = new Date(decoded.payload.exp * 1000);
        const currentDate = new Date();
        const timeDiff = expiryDate - currentDate;

        //   Check if the token is within 1 minutes of expiry  and then run the login flow again
        if (timeDiff <= 60 * 1000) {
          console.log("Token is close to expiry, refreshing...");
          try {
            const tlsCookiesResponse = await performLoginAndGetTlsAuth();
            if (tlsCookiesResponse) {
              tlsCookies = tlsCookiesResponse;
              console.log("✅ Successfully retrieved tls_auth cookie:");
              // Here you can set the cookie in your application or send it to the client
            } else {
              console.error("❌ Failed to retrieve tls_auth cookie.");
            }
          } catch (err) {
            console.error("❌ Error during login flow:", err);
          }
        } else {
          // console.log(`Token is valid until ${expiryDate.toISOString()},...`);
          if (lastTimeShown !== null) {
            const currentShowDate = new Date();
            // check if lastTimeShown is more than 6 minutes ago
            const sixMinutesAgo = new Date(
              currentShowDate.getTime() - 6 * 60 * 1000
            );
            if (lastTimeShown < sixMinutesAgo) {
              // make lastTimeShown the current date
              lastTimeShown = currentShowDate;
              const html = await fetchAppointmentPageWithPlaywright(
                {
                  ...tlsCookies,
                  osano_consentmanager_uuid: osano_consentmanager_uuid,
                  osano_consentmanager: osano_consentmanager,
                  datadome: datadome,
                  cf_clearance: cf_clearance,
                  _dd_s: _dd_s,
                }
                // osano_consentmanager_uuid,
                // osano_consentmanager,
                // datadome,
                // cf_clearance,
                // _dd_s
              );

              if (html) {
                if (
                  html.includes(
                    "We currently don’t have any appointment slots available"
                  ) ||
                  html.includes("Pending...")
                ) {
                  bot
                    .sendMessage(
                      "7333981605",
                      "No appointments available at the moment.😭😭😭😭😭😭"
                    )
                    .then(() => {
                      console.log("Bot sent Message ");
                    });
                } else if (
                  html.includes(
                    `"<h1 data-translate="block_headline">Sorry, you have been blocked</h1>"`||html.includes(`<title>Attention Required! | Cloudflare</title>`)
                  )
                ) {
                  bot
                    .sendMessage(
                      "7333981605",
                      "👹The request was blocked by Cloudflare. I will try again later.👹"
                    )
                    .then(() => {
                      console.log("Bot sent Message for Cloudflare block");
                    });
                }
                else {
                  bot
                    .sendMessage(
                      chatId,
                      `There may be available date, check it out!🎉🎉🎉🎉🎉`
                    )
                    .then(() => {
                      console.log("Bot sent Message  for date success",html
                      );
                    });
                }
              } else {
                bot.sendMessage(
                  chatId,
                  "Failed to fetch appointment page. I will try again in 6 minutes."
                );
              }
            } else {
              // console.log(
              //   "Last time shown is less than 6 minutes ago, not showing again"
              // );
            }
          }
        }
      } else {
        console.log("Could not decode tls_auth or no exp field found.");
      }
    }
  } catch (err) {
    console.error("Connection error", err);
    process.exit(1); // Exit the application on connection error
  }
}

startServer();
