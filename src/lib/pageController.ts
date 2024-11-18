import { createCursor } from "ghost-cursor";
import kill from "tree-kill";
import { LaunchedChrome } from "chrome-launcher";
import { Browser, Page } from "rebrowser-puppeteer-core";

export interface ProxyConfig {
  username: string;
  password: string;
}

export interface Plugin {
  onPageCreated: (page: Page) => void;
}

export interface PageControllerParams {
  browser: Browser;
  page: any;
  proxy?: ProxyConfig;
  turnstile?: boolean;
  xvfbsession?: unknown | null;
  pid: number;
  plugins?: Plugin[];
  killProcess?: boolean;
  chrome?: LaunchedChrome;
}

export async function pageController({
  browser,
  page,
  proxy = undefined,
  turnstile = false,
  pid,
  plugins = [],
  killProcess = false,
  chrome,
}: PageControllerParams) {
  let solveStatus = turnstile;

  page.on("close", () => {
    solveStatus = false;
  });

  browser.on("disconnected", async () => {
    solveStatus = false;
    if (killProcess === true) {
      if (chrome)
        try {
          chrome.kill();
        } catch (err) {
          console.log(err);
        }
      if (pid)
        try {
          kill(pid, "SIGKILL", () => {});
        } catch (err) {}
    }
  });

  async function turnstileSolver() {
    while (solveStatus) {
      await checkTurnstile({ page }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1000));
    }
    return;
  }

  turnstileSolver();

  if (proxy?.username && proxy?.password) await page.authenticate({ username: proxy.username, password: proxy.password });

  if (plugins && plugins?.length > 0) {
    for (const plugin of plugins) {
      plugin.onPageCreated(page);
    }
  }

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(MouseEvent.prototype, "screenX", {
      get: function () {
        return this.clientX + window.screenX;
      },
    });

    Object.defineProperty(MouseEvent.prototype, "screenY", {
      get: function () {
        return this.clientY + window.screenY;
      },
    });
  });

  const cursor = createCursor(page);
  page.realCursor = cursor;
  page.realClick = cursor.click;
  return page;
}

export function checkTurnstile({ page }: any) {
  return new Promise(async (resolve, reject) => {
    var waitInterval = setTimeout(() => {
      clearInterval(waitInterval);
      resolve(false);
    }, 5000);

    try {
      const elements = await page.$$('[name="cf-turnstile-response"]');
      if (elements.length <= 0) {
        const coordinates = await page.evaluate(() => {
          let coordinates: { x: number; y: number; w: number; h: number }[] = [];
          document.querySelectorAll("div").forEach((item) => {
            try {
              let itemCoordinates = item.getBoundingClientRect();
              let itemCss = window.getComputedStyle(item);
              if (
                itemCss.margin == "0px" &&
                itemCss.padding == "0px" &&
                itemCoordinates.width > 290 &&
                itemCoordinates.width <= 310 &&
                !item.querySelector("*")
              ) {
                coordinates.push({
                  x: itemCoordinates.x,
                  y: item.getBoundingClientRect().y,
                  w: item.getBoundingClientRect().width,
                  h: item.getBoundingClientRect().height,
                });
              }
            } catch (err) {}
          });

          if (coordinates.length <= 0) {
            document.querySelectorAll("div").forEach((item) => {
              try {
                let itemCoordinates = item.getBoundingClientRect();
                if (itemCoordinates.width > 290 && itemCoordinates.width <= 310 && !item.querySelector("*")) {
                  coordinates.push({
                    x: itemCoordinates.x,
                    y: item.getBoundingClientRect().y,
                    w: item.getBoundingClientRect().width,
                    h: item.getBoundingClientRect().height,
                  });
                }
              } catch (err) {}
            });
          }

          return coordinates;
        });

        for (const item of coordinates) {
          try {
            let x = item.x + 30;
            let y = item.y + item.h / 2;
            await page.mouse.click(x, y);
          } catch (err) {}
        }
        return resolve(true);
      }

      for (const element of elements) {
        try {
          const parentElement = await element.evaluateHandle((el: { parentElement: any }) => el.parentElement);
          const box = await parentElement.boundingBox();
          let x = box.x + 30;
          let y = box.y + box.height / 2;
          await page.mouse.click(x, y);
        } catch (err) {}
      }
      clearInterval(waitInterval);
      resolve(true);
    } catch (err) {
      clearInterval(waitInterval);
      resolve(false);
    }
  });
}
