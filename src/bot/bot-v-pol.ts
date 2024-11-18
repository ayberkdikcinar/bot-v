import { BotV } from "./bot-v";
import { ENDPOINT } from "../config/enpoints";
import { sleep } from "../lib/utils/sleep";
import PlaySound from "play-sound";
import path from "path";
import { getValueFromConfig } from "../lib/utils/config-reader";
export default class BotVPol extends BotV {
  loginEndpoint = ENDPOINT["TR/POL"];

  async run(): Promise<void> {
    try {
      await this.stepOne();
      await sleep(4000);
      await this.stepTwo();
      await sleep(4000);
      await this.stepThree();
    } catch (error) {
      console.error(error);
    }
  }

  private async stepOne() {
    await this.page.waitForSelector(".mat-checkbox-input", { visible: true, timeout: 60000 });

    await this.page.evaluate(() => {
      const checkboxes = document.querySelectorAll(".mat-checkbox-input");
      (checkboxes[0] as HTMLElement).click();
      (checkboxes[1] as HTMLElement).click();
    });

    await this.page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (btn) => btn.textContent?.trim() === "Start New Booking"
      ) as HTMLElement;
      button.click();
    });
    await sleep(1000);

    await this.page.evaluate(() => {
      (document.querySelector(".mat-checkbox-input") as HTMLElement).click();
    });

    await this.page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (btn) => btn.textContent?.trim() === "Continue"
      ) as HTMLButtonElement;
      button.click();
    });

    await sleep(1000);
  }

  private async stepTwo() {
    await this.page.type(
      'mat-form-field .mat-form-field-infix input[placeholder="Enter your first name"]',
      getValueFromConfig("personalInformation", "firstName")
    );
    await this.page.type(
      'mat-form-field .mat-form-field-infix input[placeholder="Please enter last name."]',
      getValueFromConfig("personalInformation", "lastName")
    );
    await this.page.evaluate(() => {
      (Array.from(document.querySelectorAll('mat-select[role="combobox"]'))[0] as HTMLElement).click();
    });
    await sleep(500);
    await this.page.evaluate((gender) => {
      Array.from(document.querySelectorAll("span"))
        .find((sp) => sp.textContent!.trim() === gender)
        ?.click();
    }, getValueFromConfig("personalInformation", "gender"));

    await this.page.evaluate(() => {
      (Array.from(document.querySelectorAll('mat-select[role="combobox"]'))[1] as HTMLElement).click();
    });

    await sleep(500);

    await this.page.evaluate((nationality) => {
      Array.from(document.querySelectorAll("span"))
        .find((sp) => sp.textContent?.trim() === nationality)!
        .click();
    }, getValueFromConfig("personalInformation", "nationality"));

    await this.page.type(
      'mat-form-field .mat-form-field-infix input[placeholder="Enter passport number"]',
      getValueFromConfig("personalInformation", "passportNo")
    );
    await this.page.type(
      'mat-form-field .mat-form-field-infix input[placeholder="44"]',
      getValueFromConfig("contactNumber", "countryCode")
    );
    await this.page.type(
      'mat-form-field .mat-form-field-infix input[placeholder="012345648382"]',
      getValueFromConfig("contactNumber", "number")
    );
    await this.page.type(
      'mat-form-field .mat-form-field-infix input[placeholder="Enter Email Address"]',
      getValueFromConfig("personalInformation", "email")
    );

    await sleep(31000);

    await this.page.evaluate(() => {
      Array.from(document.querySelectorAll("button"))
        .find((b) => b.textContent!.trim().toLowerCase() === "save")!
        .click();
    });
  }

  private async stepThree() {
    await this.page.evaluate(() => {
      (document.querySelectorAll('mat-select[role="combobox"]')[0] as HTMLElement).click();
    });

    await this.page.evaluate((category) => {
      Array.from(document.querySelectorAll("span"))
        .find((sp) => sp.textContent?.trim() === category)!
        .click();
    }, getValueFromConfig("appoinmentDetails", "category"));

    await sleep(3000);

    await this.page.evaluate(() => {
      (document.querySelectorAll('mat-select[role="combobox"]')[1] as HTMLElement).click();
    });

    await this.page.evaluate((subcategory) => {
      Array.from(document.querySelectorAll("span"))
        .find((sp) => sp.textContent?.trim() === subcategory)!
        .click();
    }, getValueFromConfig("appoinmentDetails", "subCategory"));

    await sleep(3000);
    const errorMsg = await this.page.$(".errorMessage");
    if (errorMsg) {
      console.error("No appoinment center found. Rety will work in 3 secs.");
      await sleep(3000);
      await this.redirectToDashboard();
      return await this.run();
    }
    //must have some centers.
    await this.page.evaluate(() => {
      (document.querySelectorAll('mat-select[role="combobox"]')[2] as HTMLElement).click();
    });

    let isAvailable = false;
    await this.page.waitForSelector(".mat-select-panel");
    const options = await this.page.$$(".mat-option-text");
    for (const option of options) {
      const text = await option.evaluate((el) => el.textContent!.trim());
      if (text.includes(getValueFromConfig("appoinmentDetails", "applicationCenter"))) {
        await option.click();
        break;
      }
    }
    await sleep(2000);
    const alert = await this.page.$("div.alert.alert-info.border-0.rounded-0");
    if (alert) {
      const alertText = await alert.evaluate((el) => el.textContent!.trim());
      if (alertText.startsWith("Earliest Available Slot")) {
        isAvailable = true;
      }
    }
    await sleep(2000);
    if (!isAvailable) {
      console.error("No appoinment center found. Rety will work in 3 secs.");
      await sleep(3000);
      await this.redirectToDashboard();
      return await this.run();
    }
    await this.page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (btn) => btn.textContent?.trim() === "Continue"
      ) as HTMLButtonElement;
      button.click();
    });
    await sleep(5000);
    const availableSlotExist = await this.stepFour();
    if (!availableSlotExist) {
      console.error("No appoinment center found. Rety will work in 3 secs.");
      await sleep(3000);
      await this.redirectToDashboard();
      return await this.run();
    }
    const soundPath = path.resolve(__dirname, "../assets/alarm.mp3");
    PlaySound().play(soundPath);
    await sleep(300000);
  }

  private async stepFour() {
    return await this.page.evaluate(() => {
      const days = document.querySelectorAll(".fc-daygrid-day");
      for (let day of days) {
        if (!day.classList.contains("fc-day-disabled") && !day.classList.contains("fc-day-past")) {
          return day.getAttribute("data-date");
        }
      }
      return null;
    });
  }
}
