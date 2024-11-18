import BotVPol from "./bot/bot-v-pol";
import { initConfig } from "./lib/utils/config-reader";

const start = async () => {
  try {
    await initConfig();
    const newBot = new BotVPol();
    await newBot.initialize();
    await newBot.run();

    await new Promise((resolve) => setTimeout(resolve, 100000));
  } catch (error) {
    console.error("error:", error);
  }
};

start();
