import { PuppeteerExtraPlugin, VanillaPuppeteer, addExtra } from "puppeteer-extra";
import puppeteer, { Page } from "rebrowser-puppeteer-core";
import { pageController, PageControllerParams } from "./pageController";
import * as ChromeLauncher from "chrome-launcher";

interface browserConfig {
  args?: string[];
  headless: boolean;
  customConfig?: unknown;
  connectOption: { defaultViewport: { width: number; height: number } };
  proxy?: { host: string; port: number };
  disableXvfb: boolean;
  ignoreAllFlags: boolean;
  plugins: unknown[];
}

const defaultBrowserConfig: browserConfig = {
  args: [],
  headless: false,
  connectOption: { defaultViewport: { width: 1920, height: 1080 } },
  disableXvfb: false,
  ignoreAllFlags: false,
  plugins: [],
};
async function setupBrowser(config?: browserConfig) {
  if (!config) {
    config = defaultBrowserConfig;
  }

  const chrome = await ChromeLauncher.launch({
    ignoreDefaultFlags: true,
    chromeFlags: [
      ...[
        ...ChromeLauncher.Launcher.defaultFlags().filter(
          (item) => !item.includes("--disable-features") && !item.includes("component-update")
        ),
        ...config.args!,
        ...(config.headless !== false ? [`--headless=${config.headless}`] : []),
        ...(config.proxy && config.proxy.host && config.proxy.port
          ? [`--proxy-server=${config.proxy.host}:${config.proxy.port}`]
          : []),
        "--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,CertificateTransparencyComponentUpdater,AutofillServerCommunication,PrivacySandboxSettings4,AutomationControlled",
        "--no-sandbox",
        "--start-maximized",
      ],
    ],
    ...(config.customConfig ? config.customConfig : {}),
  });

  const port = chrome.port;
  let pextra;
  if (config.plugins.length > 0) {
    pextra = addExtra(puppeteer as unknown as VanillaPuppeteer);
    for (const item of config.plugins) {
      pextra.use(item as PuppeteerExtraPlugin);
    }
  }

  const browser = await (pextra ? pextra : puppeteer).connect({
    browserURL: `http://127.0.0.1:${port}`,
    ...config.connectOption,
    slowMo: 20,
  });

  return { browser, chrome };
}

async function connect(): Promise<Page> {
  const { browser, chrome } = await setupBrowser();
  let [page] = await browser.pages();
  let pageControllerConfig = {
    browser,
    page,
    pid: chrome.pid,
    chrome,
  } as PageControllerParams;

  page = await pageController({ ...pageControllerConfig });

  browser.on("targetcreated", async (target) => {
    if (target.type() === "page") {
      let newPage = await target.page();
      pageControllerConfig.page = newPage;
      newPage = await pageController(pageControllerConfig);
    }
  });

  return page as Page;
}

export { connect };
