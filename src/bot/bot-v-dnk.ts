import { BotV } from "./bot-v";
import { ENDPOINT } from "../config/enpoints";

export default class BotVDnk extends BotV {
  loginEndpoint = ENDPOINT["TR/DNK"];

  async steps(): Promise<void> {
    try {
    } catch (error) {}
    throw new Error("Method not implemented.");
  }
}