import { Page } from "rebrowser-puppeteer-core";
import { sleep } from "../lib/utils/sleep";
import { connect } from "../lib/browserSetup";
import { getValueFromConfig } from "../lib/utils/config-reader";
export abstract class BotV {
  protected page!: Page;
  abstract loginEndpoint: string;

  constructor() {}

  async initialize(): Promise<void> {
    this.page = await connect();
    await this.login();
  }

  protected async redirectToDashboard() {
    await this.page.evaluate(() => {
      const element = document.querySelector("#navbarDropdown") as HTMLElement;
      if (element) {
        element.click();
      }
      const dashboardLink = Array.from(document.querySelectorAll("a")).find(
        (t) => t.textContent?.trim() === "Dashboard"
      ) as HTMLElement;

      if (dashboardLink) {
        dashboardLink.click();
      }
    });
    await sleep(1000);
  }

  abstract run(): Promise<void>;

  private async login() {
    await this.page.goto(this.loginEndpoint);
    await this.page.waitForSelector("#onetrust-accept-btn-handler");
    await this.page.click("#onetrust-accept-btn-handler");
    const email_input = this.page.locator("#email");
    await email_input.fill(getValueFromConfig("account", "email"));
    await sleep(500);
    await this.page.evaluate((pw) => {
      const passwordInput = document.querySelector("#password") as HTMLInputElement;
      if (passwordInput) {
        passwordInput.value = pw;
        passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, getValueFromConfig("account", "password"));
    await this.page.waitForSelector('button[disabled="true"]', { hidden: true });
    await this.page.click("button.mat-stroked-button");
  }
}
