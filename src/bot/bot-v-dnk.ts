import { BotV } from "./bot-v";
import { ENDPOINT } from "../config/enpoints";

export default class BotVDnk extends BotV {
  loginEndpoint = ENDPOINT["TR/DNK"];

  run(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async steps(): Promise<void> {
    try {
    } catch (error) {}
    throw new Error("Method not implemented.");
  }
}
