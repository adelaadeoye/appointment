const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch"); // node-fetch v2
const tough = require("tough-cookie");
const fetchCookie = require("fetch-cookie");
const cheerio = require("cheerio");
const helmet = require("helmet");
var cookieParser = require("cookie-parser");
dotenv.config();

const app = express();
const PORT = 4000;

// Middleware
var corsOptions = {
  origin: "*",
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use(cookieParser());

const loginUrl =
  "https://auth.visas-de.tlscontact.com/auth/realms/atlas/protocol/openid-connect/auth?client_id=tlscitizen&redirect_uri=https%3A%2F%2Fvisas-de.tlscontact.com%2Fen-us%2Fauth-callback&state=d88c6ad2-c56c-487e-83f0-25bc14eed136&response_mode=query&response_type=code&scope=openid&nonce=024374d3-0488-4b50-af5d-06da4becacff&ui_locales=en";

// Replace with your actual credentials
const USERNAME = "adeoye.adela@gmail.com";
const PASSWORD = "tC@jC5QzyqhywFZ";

async function performLoginAndGetTlsAuth() {
  try {
    // Setup cookie jar and fetch with cookie support
    const cookieJar = new tough.CookieJar();
    const fetchWithCookies = fetchCookie(fetch, cookieJar);

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

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  let avaialbleDate = false;
  let lastTimeShown = new Date();
  const osano_consentmanager_uuid = "488126fa-0cc5-4c23-9c5d-31a37638eef7";
  const osano_consentmanager =
    "L_1j7j6eKCIzh2Obd-0fN7uORm7zQDLydFzPCvGj0dV1iTqoRuQDkh9n84mHlJ3xhZ_CqOk8WEv2551HJqf4b2xR1Njrc5TFIX7FGlVDy5g7vWepVzKQAFLdTIETK5vCWGG5ep1lRU9peAb5dwEFiI2vsabt4HU14WuS7kPbBBt7eIuAyiqUgbWyV360PSfwOHFKR9fjWhj6OhrBVBKFotCfOLco_PwbhyurMm-LlN2eNa3pzAHtVLpueeXU5kSAg7QD-1IwsbNsygwDj3LY4udq9SRfcpLS0VJKCGpAsBKVRuSDYlVx9DB1aP5KYFR-";
  const datadome =
    "6fFpRM7o~WICTFQqYy9lE~XPWEJdljrU9r85L_goVFULG551XBYWgyjy25Pd1Y4TbNXdKQC8tzjDTZGiRpbZof0HDKxlmjqP7B1rDxSaDb8LUBaoeb~Q~LoxaKNL1fdQ";
  const cf_clearance =
    "dulqJlhxgsGA.JVd1iX_bIySHa0ahNX15eS5yhPEuFQ-1750222192-1.2.1.1-v4EzqqHYZ2cl07yD.9QwaIju8GyZqbKEyPoricGsGQAJweB7M7q3OxkcONYFjxvT9zwFFZdW6Vycjip6nm9RvADASWDWey6iHYW4Vj8xmX9OoCfSkletMDlHpXeu9ncOoFEk5V1.P.u8KHFxWGDIljTbzo_xmD6AfmQD.e.QCEuAbAY4KiVdw9Ezr1p8RuU5i5ciF5wh8uG9e4_k0s85l60NbLvzq56FgsHZto.OGtfNXDT3AM3Dol5WueUbTAu60yZvYkuj.7DGqjgVJOfs9q1AB2PwsnHtLJZWD18Do3AIl8iM_Ns01XRORSN3GH5ye0k4rM2_pKCHpVW7kF2sb3.p.S.HVMyloU4wpqZAWjU";
  let tlsCookies = {
    tls_auth: null,
    tls_id: null,
    tls_refresh_token: null,
    __cf_bm: null,
  };
  const _dd_s =
    "rum=2&id=0013b29a-18ef-4a7a-8f1b-d1fcb630d6a2&created=1750566974331&expire=1750567925269";
  try {
    const tlsCookiesResponse = {
      tls_auth:
        "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYcHdsWjFydGc0VEVicmRCOXVRaEdpb0JuNTQ2czl3Sy05Q0N4VHNaS0lVIn0.eyJleHAiOjE3NTExNTY3NjcsImlhdCI6MTc1MTE1MzE2NywiYXV0aF90aW1lIjoxNzUxMTUzMTY3LCJqdGkiOiJlZTRmYWEyZC1lNzllLTRkOTgtOTU4OC1iYTAyNjZiYzNlNzUiLCJpc3MiOiJodHRwczovL2F1dGgudmlzYXMtZGUudGxzY29udGFjdC5jb20vYXV0aC9yZWFsbXMvYXRsYXMiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiYmE1OTRiNGEtMzJlMi00OWM5LWJjYjktZTFiNDZmMGI5ZTc1IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidGxzY2l0aXplbiIsIm5vbmNlIjoiMDI0Mzc0ZDMtMDQ4OC00YjUwLWFmNWQtMDZkYTRiZWNhY2ZmIiwic2Vzc2lvbl9zdGF0ZSI6ImIxNWQxZDU4LWJiZDItNDM1My04MmZiLWNhYjQ0ZjRmYjQ5OCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1hdGxhcyIsIlJPTEVfVVNFUiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBhdGxhcyBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInJvbGVzIjpbImRlZmF1bHQtcm9sZXMtYXRsYXMiLCJST0xFX1VTRVIiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl0sIm5hbWUiOiJhZGVveWUuYWRlbGFAZ21haWwuY29tIGFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZGVveWUuYWRlbGFAZ21haWwuY29tIiwiZ2l2ZW5fbmFtZSI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJmYW1pbHlfbmFtZSI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJlbWFpbCI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20ifQ.URSNX2Il_S_ElSLH9Xh9-4MyBWiZMSlu_z6lLlEsLU_P5H9k6ZHKeKMUoCrydVG68QCg6yBgJ6hK8u0dbXgEPNW-hdcoUkFW9HeoeomB12gpUYWoUXkqLhUsp_MaHjK6ejfiW4GYXkJIgh4k0tVoa4aLjmls0ZwO2IpkTSxsAHBMY6XhNdorC9H5AQqN3ZavlmaJi7aVUxoWrcYV8Vbr4w120HG1thnNxSwJ_6Om5QmQk4O7eeU8v1_8mijV8QH5hSorp4ibI7-CfgocTvpfeGkF_l1ZhQJOnimHykoG9xEKhGsW1sVdusYeNS0KbRBZEEg0qNratjV781cGUtACsA",
      tls_id:
        "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYcHdsWjFydGc0VEVicmRCOXVRaEdpb0JuNTQ2czl3Sy05Q0N4VHNaS0lVIn0.eyJleHAiOjE3NTExNTY3NjcsImlhdCI6MTc1MTE1MzE2NywiYXV0aF90aW1lIjoxNzUxMTUzMTY3LCJqdGkiOiJhMzY3NGIzZC0wNDQ1LTQ0MTQtYWEzOS0yNmQzNWNiNjE1ZjYiLCJpc3MiOiJodHRwczovL2F1dGgudmlzYXMtZGUudGxzY29udGFjdC5jb20vYXV0aC9yZWFsbXMvYXRsYXMiLCJhdWQiOiJ0bHNjaXRpemVuIiwic3ViIjoiYmE1OTRiNGEtMzJlMi00OWM5LWJjYjktZTFiNDZmMGI5ZTc1IiwidHlwIjoiSUQiLCJhenAiOiJ0bHNjaXRpemVuIiwibm9uY2UiOiIwMjQzNzRkMy0wNDg4LTRiNTAtYWY1ZC0wNmRhNGJlY2FjZmYiLCJzZXNzaW9uX3N0YXRlIjoiYjE1ZDFkNTgtYmJkMi00MzUzLTgyZmItY2FiNDRmNGZiNDk4IiwiYXRfaGFzaCI6InAtbnhyN21IV3lGV0RvWHlCRTE5TXciLCJhY3IiOiIxIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJhZGVveWUuYWRlbGFAZ21haWwuY29tIGFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZGVveWUuYWRlbGFAZ21haWwuY29tIiwiZ2l2ZW5fbmFtZSI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJmYW1pbHlfbmFtZSI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJlbWFpbCI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20ifQ.jQXEzN8ksUjM-I0aSBjI1KkwAK8iwm9lqCT4ZTvEWReJg0nixC24sKr7zwFh1FUiPoFlhn5ntz5PlosAQ2AbcM-t1O9rzYiXm6Va76vAkqwBZsJHCJ33JS_szY-_SzCdl13Ru5_dIGb9taW4QxFaXpIA9uXPXXus6fqDS1Mv-s_LAyHKgv4ahS3G-UhwC6JV0Tegz8o_0QnFYVaLiIQKCTAxisY7szgEV1jMMSKL52w5_QbxIf_q6yfyqEbrDpDSNUFCDeW7thj4rRZXM8y49098oIC2mh-vpyE71MNbbTw-xIxG3z7fr1Ynfz0NN2VKGkmlLj_dfpC6oa3cqrBYgA",
      tls_refresh_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkMTM5MDAyNC0wNTc0LTRkMzMtOWYwNC0zY2Q2NTFkMDE5YjgifQ.eyJleHAiOjE3NTExNTQ5NjcsImlhdCI6MTc1MTE1MzE2NywianRpIjoiMzcyYzI2ZjctMWQ0Mi00YjgzLWIxNGQtYmQ4MWI3NjkyZjc5IiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnZpc2FzLWRlLnRsc2NvbnRhY3QuY29tL2F1dGgvcmVhbG1zL2F0bGFzIiwiYXVkIjoiaHR0cHM6Ly9hdXRoLnZpc2FzLWRlLnRsc2NvbnRhY3QuY29tL2F1dGgvcmVhbG1zL2F0bGFzIiwic3ViIjoiYmE1OTRiNGEtMzJlMi00OWM5LWJjYjktZTFiNDZmMGI5ZTc1IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRsc2NpdGl6ZW4iLCJub25jZSI6IjAyNDM3NGQzLTA0ODgtNGI1MC1hZjVkLTA2ZGE0YmVjYWNmZiIsInNlc3Npb25fc3RhdGUiOiJiMTVkMWQ1OC1iYmQyLTQzNTMtODJmYi1jYWI0NGY0ZmI0OTgiLCJzY29wZSI6Im9wZW5pZCBhdGxhcyBlbWFpbCBwcm9maWxlIn0.KJfG0cnFWiu6gQG17c2mf0nazIQr4mIivizfAhk2G84",
      __cf_bm:
        "NcFxTTFN6vYZUHdAIGKw_OLMRiwuAgKyFi_MM.rb9Ik-1751153167-1.0.1.1-9P6.L2cUqOMIgGS9xoiORy6c7PiNUisMs5owhOSVQUUzMVz6XCT9OCYQBa7ty_Dmo0kC9ng4aarxNHatZfOa3cEZwStYy2yMBq0Xlh7BCI8",
    };
    // const tlsCookiesResponse = await performLoginAndGetTlsAuth();
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
  async function fetchAppointmentPage(
    tlsCookies,
    osano_consentmanager_uuid,
    osano_consentmanager,
    datadome,
    cf_clearance,
    _dd_s
  ) {
    try {
      const res = await fetch(
        "https://visas-de.tlscontact.com/en-us/3217274/workflow/appointment-booking?location=gbLON2de&_rsc=1fd20",
        {
          method: "GET",
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            referer:
              "https://visas-de.tlscontact.com/en-us/3217274/workflow/service-level",
            cookie: generateCookieHeader(
              tlsCookies,
              osano_consentmanager_uuid,
              osano_consentmanager,
              datadome,
              cf_clearance,
              _dd_s
            ),
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Fetch failed with status ${res.status}`);
      }

      const html = await res.text();
      console.log("Fetched appointment page successfully.");
      return html;
    } catch (err) {
      console.error("Error fetching appointment page:", err);
      return null;
    }
  }

  function generateCookieHeader(
    tlsCookies,
    osanoUuid,
    osanoConsent,
    datadome,
    cfClearance,
    dd_s
  ) {
    const parts = [];
    if (osanoUuid) parts.push(`osano_consentmanager_uuid=${osanoUuid}`);
    if (osanoConsent) parts.push(`osano_consentmanager=${osanoConsent}`);
    if (datadome) parts.push(`datadome=${datadome}`);
    if (cfClearance) parts.push(`cf_clearance=${cfClearance}`);
    if (tlsCookies.tls_auth) parts.push(`tls_auth=${tlsCookies.tls_auth}`);
    if (tlsCookies.tls_id) parts.push(`tls_id=${tlsCookies.tls_id}`);
    if (tlsCookies.tls_refresh_token)
      parts.push(`tls_refresh_token=${tlsCookies.tls_refresh_token}`);
    if (dd_s) parts.push(`_dd_s=${dd_s}`);
    return parts.join("; ");
  }

  while (true) {
    // Check if the token is close to expiry and refresh if needed
    const decoded = jwt.decode(tlsCookies.tls_auth, { complete: true });
    if (decoded && decoded.payload.exp) {
      const expiryDate = new Date(decoded.payload.exp * 1000);
      const currentDate = new Date();
      const timeDiff = expiryDate - currentDate;

      // Check if the token is within 1 minutes of expiry  and then run the login flow again
      if (timeDiff <= 60 * 1000) {
        console.log("Token is close to expiry, refreshing...");
        try {
          const tlsCookiesResponse = {
            tls_auth:
              "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYcHdsWjFydGc0VEVicmRCOXVRaEdpb0JuNTQ2czl3Sy05Q0N4VHNaS0lVIn0.eyJleHAiOjE3NTExNTY3NjcsImlhdCI6MTc1MTE1MzE2NywiYXV0aF90aW1lIjoxNzUxMTUzMTY3LCJqdGkiOiJlZTRmYWEyZC1lNzllLTRkOTgtOTU4OC1iYTAyNjZiYzNlNzUiLCJpc3MiOiJodHRwczovL2F1dGgudmlzYXMtZGUudGxzY29udGFjdC5jb20vYXV0aC9yZWFsbXMvYXRsYXMiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiYmE1OTRiNGEtMzJlMi00OWM5LWJjYjktZTFiNDZmMGI5ZTc1IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidGxzY2l0aXplbiIsIm5vbmNlIjoiMDI0Mzc0ZDMtMDQ4OC00YjUwLWFmNWQtMDZkYTRiZWNhY2ZmIiwic2Vzc2lvbl9zdGF0ZSI6ImIxNWQxZDU4LWJiZDItNDM1My04MmZiLWNhYjQ0ZjRmYjQ5OCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1hdGxhcyIsIlJPTEVfVVNFUiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBhdGxhcyBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInJvbGVzIjpbImRlZmF1bHQtcm9sZXMtYXRsYXMiLCJST0xFX1VTRVIiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl0sIm5hbWUiOiJhZGVveWUuYWRlbGFAZ21haWwuY29tIGFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZGVveWUuYWRlbGFAZ21haWwuY29tIiwiZ2l2ZW5fbmFtZSI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJmYW1pbHlfbmFtZSI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJlbWFpbCI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20ifQ.URSNX2Il_S_ElSLH9Xh9-4MyBWiZMSlu_z6lLlEsLU_P5H9k6ZHKeKMUoCrydVG68QCg6yBgJ6hK8u0dbXgEPNW-hdcoUkFW9HeoeomB12gpUYWoUXkqLhUsp_MaHjK6ejfiW4GYXkJIgh4k0tVoa4aLjmls0ZwO2IpkTSxsAHBMY6XhNdorC9H5AQqN3ZavlmaJi7aVUxoWrcYV8Vbr4w120HG1thnNxSwJ_6Om5QmQk4O7eeU8v1_8mijV8QH5hSorp4ibI7-CfgocTvpfeGkF_l1ZhQJOnimHykoG9xEKhGsW1sVdusYeNS0KbRBZEEg0qNratjV781cGUtACsA",
            tls_id:
              "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYcHdsWjFydGc0VEVicmRCOXVRaEdpb0JuNTQ2czl3Sy05Q0N4VHNaS0lVIn0.eyJleHAiOjE3NTExNTY3NjcsImlhdCI6MTc1MTE1MzE2NywiYXV0aF90aW1lIjoxNzUxMTUzMTY3LCJqdGkiOiJhMzY3NGIzZC0wNDQ1LTQ0MTQtYWEzOS0yNmQzNWNiNjE1ZjYiLCJpc3MiOiJodHRwczovL2F1dGgudmlzYXMtZGUudGxzY29udGFjdC5jb20vYXV0aC9yZWFsbXMvYXRsYXMiLCJhdWQiOiJ0bHNjaXRpemVuIiwic3ViIjoiYmE1OTRiNGEtMzJlMi00OWM5LWJjYjktZTFiNDZmMGI5ZTc1IiwidHlwIjoiSUQiLCJhenAiOiJ0bHNjaXRpemVuIiwibm9uY2UiOiIwMjQzNzRkMy0wNDg4LTRiNTAtYWY1ZC0wNmRhNGJlY2FjZmYiLCJzZXNzaW9uX3N0YXRlIjoiYjE1ZDFkNTgtYmJkMi00MzUzLTgyZmItY2FiNDRmNGZiNDk4IiwiYXRfaGFzaCI6InAtbnhyN21IV3lGV0RvWHlCRTE5TXciLCJhY3IiOiIxIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJhZGVveWUuYWRlbGFAZ21haWwuY29tIGFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZGVveWUuYWRlbGFAZ21haWwuY29tIiwiZ2l2ZW5fbmFtZSI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJmYW1pbHlfbmFtZSI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20iLCJlbWFpbCI6ImFkZW95ZS5hZGVsYUBnbWFpbC5jb20ifQ.jQXEzN8ksUjM-I0aSBjI1KkwAK8iwm9lqCT4ZTvEWReJg0nixC24sKr7zwFh1FUiPoFlhn5ntz5PlosAQ2AbcM-t1O9rzYiXm6Va76vAkqwBZsJHCJ33JS_szY-_SzCdl13Ru5_dIGb9taW4QxFaXpIA9uXPXXus6fqDS1Mv-s_LAyHKgv4ahS3G-UhwC6JV0Tegz8o_0QnFYVaLiIQKCTAxisY7szgEV1jMMSKL52w5_QbxIf_q6yfyqEbrDpDSNUFCDeW7thj4rRZXM8y49098oIC2mh-vpyE71MNbbTw-xIxG3z7fr1Ynfz0NN2VKGkmlLj_dfpC6oa3cqrBYgA",
            tls_refresh_token:
              "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkMTM5MDAyNC0wNTc0LTRkMzMtOWYwNC0zY2Q2NTFkMDE5YjgifQ.eyJleHAiOjE3NTExNTQ5NjcsImlhdCI6MTc1MTE1MzE2NywianRpIjoiMzcyYzI2ZjctMWQ0Mi00YjgzLWIxNGQtYmQ4MWI3NjkyZjc5IiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnZpc2FzLWRlLnRsc2NvbnRhY3QuY29tL2F1dGgvcmVhbG1zL2F0bGFzIiwiYXVkIjoiaHR0cHM6Ly9hdXRoLnZpc2FzLWRlLnRsc2NvbnRhY3QuY29tL2F1dGgvcmVhbG1zL2F0bGFzIiwic3ViIjoiYmE1OTRiNGEtMzJlMi00OWM5LWJjYjktZTFiNDZmMGI5ZTc1IiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InRsc2NpdGl6ZW4iLCJub25jZSI6IjAyNDM3NGQzLTA0ODgtNGI1MC1hZjVkLTA2ZGE0YmVjYWNmZiIsInNlc3Npb25fc3RhdGUiOiJiMTVkMWQ1OC1iYmQyLTQzNTMtODJmYi1jYWI0NGY0ZmI0OTgiLCJzY29wZSI6Im9wZW5pZCBhdGxhcyBlbWFpbCBwcm9maWxlIn0.KJfG0cnFWiu6gQG17c2mf0nazIQr4mIivizfAhk2G84",
            __cf_bm:
              "NcFxTTFN6vYZUHdAIGKw_OLMRiwuAgKyFi_MM.rb9Ik-1751153167-1.0.1.1-9P6.L2cUqOMIgGS9xoiORy6c7PiNUisMs5owhOSVQUUzMVz6XCT9OCYQBa7ty_Dmo0kC9ng4aarxNHatZfOa3cEZwStYy2yMBq0Xlh7BCI8",
          };
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
            currentShowDate.getTime() - 1 * 60 * 1000
          );
          if (lastTimeShown < sixMinutesAgo) {
            // make lastTimeShown the current date
            lastTimeShown = currentShowDate;
            const html = await fetchAppointmentPage(
              tlsCookies,
              osano_consentmanager_uuid,
              osano_consentmanager,
              datadome,
              cf_clearance,
              _dd_s
            );

            if (html) {
              console.log("Fetched appointment page successfully.", html);
              // optionally parse or analyze HTML here
            }

            break;
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
});
