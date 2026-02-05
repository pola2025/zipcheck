/**
 * Chrome Profile Automation Helper
 *
 * Uses Playwright with Chrome's actual user profile to access
 * authenticated services (Google Cloud Console, Naver Dev Center, etc.)
 *
 * Usage:
 *   node scripts/chrome-automation.js <command> [options]
 *
 * Commands:
 *   google-oauth-info    - Get OAuth client info from Google Cloud Console
 *   google-redirect-uri  - Add redirect URI to Google OAuth client
 *   naver-callback-url   - Update Naver Developer Center callback URL
 *   open <url>           - Open a URL with Chrome profile (stays open for manual work)
 */

const { chromium } = require('playwright-core');
const path = require('path');

const CHROME_USER_DATA = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
const CHROME_PROFILE = 'Profile 4'; // zipcheck2025@gmail.com

async function launchBrowser() {
  // Find Chrome executable
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];

  let execPath;
  const fs = require('fs');
  for (const p of chromePaths) {
    if (fs.existsSync(p)) { execPath = p; break; }
  }

  if (!execPath) {
    throw new Error('Chrome executable not found');
  }

  console.log(`Using Chrome: ${execPath}`);
  console.log(`Profile: ${CHROME_PROFILE} (zipcheck2025@gmail.com)`);

  const context = await chromium.launchPersistentContext(
    path.join(CHROME_USER_DATA, CHROME_PROFILE),
    {
      executablePath: execPath,
      headless: false,
      viewport: { width: 1280, height: 900 },
      args: [
        '--disable-blink-features=AutomationControlled',
        `--profile-directory=${CHROME_PROFILE}`,
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    }
  );

  return context;
}

async function getGoogleOAuthInfo() {
  const context = await launchBrowser();
  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('\nNavigating to Google Cloud Console Credentials...');
    await page.goto('https://console.cloud.google.com/apis/credentials?project=zipcheck-486307', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'scripts/google-console-credentials.png', fullPage: true });
    console.log('Screenshot saved: scripts/google-console-credentials.png');

    // Try to find OAuth 2.0 Client IDs
    const pageText = await page.textContent('body');

    // Look for client ID patterns
    const clientIdMatch = pageText.match(/[\w-]+\.apps\.googleusercontent\.com/g);
    if (clientIdMatch) {
      console.log('\nFound OAuth Client IDs:');
      clientIdMatch.forEach(id => console.log(`  - ${id}`));
    }

    // Click on OAuth 2.0 client to get details
    const oauthRows = await page.$$('tr[data-credential-type="oauth2Client"]');
    if (oauthRows.length === 0) {
      // Try alternative selectors
      const links = await page.$$('a[href*="oauthClient"]');
      if (links.length > 0) {
        console.log(`\nFound ${links.length} OAuth client link(s), clicking first...`);
        await links[0].click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'scripts/google-oauth-detail.png', fullPage: true });
        console.log('Detail screenshot saved: scripts/google-oauth-detail.png');

        const detailText = await page.textContent('body');
        const detailClientId = detailText.match(/[\w-]+\.apps\.googleusercontent\.com/);
        if (detailClientId) {
          console.log(`\nClient ID: ${detailClientId[0]}`);
        }
      }
    }

    console.log('\nDone. Check screenshots for full details.');

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'scripts/google-console-error.png' });
  } finally {
    await context.close();
  }
}

async function addGoogleRedirectUri(newUri) {
  const uri = newUri || 'https://zipcheck-api.zipcheck2025.workers.dev/api/auth/google/callback';
  const context = await launchBrowser();
  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('\nNavigating to Google Cloud Console Credentials...');
    await page.goto('https://console.cloud.google.com/apis/credentials?project=zipcheck-486307', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    // Find and click on the OAuth 2.0 client
    console.log('Looking for OAuth 2.0 client...');

    // Screenshot current state
    await page.screenshot({ path: 'scripts/step1-credentials-page.png' });
    console.log('Step 1 screenshot saved');

    // Try to find OAuth client links
    const links = await page.$$('a[href*="oauthClient"]');
    if (links.length > 0) {
      await links[0].click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'scripts/step2-oauth-detail.png' });
      console.log('Step 2 screenshot saved');

      // Look for "ADD URI" button
      const addUriBtn = await page.$('button:has-text("URI 추가"), button:has-text("ADD URI"), button:has-text("+ URI")');
      if (addUriBtn) {
        await addUriBtn.click();
        await page.waitForTimeout(1000);

        // Find the last empty input for redirect URIs
        const uriInputs = await page.$$('input[type="text"][aria-label*="redirect"], input[type="text"][placeholder*="URI"]');
        const lastInput = uriInputs[uriInputs.length - 1];
        if (lastInput) {
          await lastInput.fill(uri);
          console.log(`Entered redirect URI: ${uri}`);

          await page.screenshot({ path: 'scripts/step3-uri-entered.png' });
          console.log('Step 3 screenshot saved');

          // Click Save
          const saveBtn = await page.$('button:has-text("저장"), button:has-text("SAVE"), button:has-text("Save")');
          if (saveBtn) {
            await saveBtn.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'scripts/step4-saved.png' });
            console.log('Step 4: Saved!');
          }
        }
      } else {
        console.log('ADD URI button not found. Check screenshot and do it manually.');
      }
    } else {
      console.log('No OAuth client found. Check screenshot.');
    }

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'scripts/google-redirect-error.png' });
  } finally {
    await context.close();
  }
}

async function updateNaverCallbackUrl(newUrl) {
  const url = newUrl || 'https://zipcheck-api.zipcheck2025.workers.dev/api/auth/naver/callback';
  const context = await launchBrowser();
  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('\nNavigating to Naver Developer Center...');
    await page.goto('https://developers.naver.com/apps/#/myapp', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'scripts/naver-apps.png' });
    console.log('Screenshot saved: scripts/naver-apps.png');
    console.log('Manual steps needed for Naver - check screenshot.');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await context.close();
  }
}

async function openUrl(url) {
  const context = await launchBrowser();
  const page = context.pages()[0] || await context.newPage();

  console.log(`Opening: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Browser opened. Press Ctrl+C to close when done.');

  // Keep browser open
  await new Promise(() => {});
}

// Main
const [,, command, ...args] = process.argv;

switch (command) {
  case 'google-oauth-info':
    getGoogleOAuthInfo().catch(console.error);
    break;
  case 'google-redirect-uri':
    addGoogleRedirectUri(args[0]).catch(console.error);
    break;
  case 'naver-callback-url':
    updateNaverCallbackUrl(args[0]).catch(console.error);
    break;
  case 'open':
    openUrl(args[0]).catch(console.error);
    break;
  default:
    console.log('Usage: node scripts/chrome-automation.js <command>');
    console.log('Commands: google-oauth-info, google-redirect-uri, naver-callback-url, open <url>');
}
