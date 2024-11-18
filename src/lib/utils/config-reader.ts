import { readFile } from "node:fs/promises";
import { parse } from "ini";
import { join } from "node:path";

let config: Record<string, any> = {};

export const initConfig = async () => {
  const filePath = join(__dirname, "../../config/data.ini");
  let text = await readFile(filePath, {
    encoding: "utf-8",
  });
  config = parse(text);
};

export const getValueFromConfig = (section: string, key: string): string => {
  if (!config) {
    throw new Error("config must be initialized.");
  }

  if (config[section] && config[section][key]) {
    return config[section][key];
  }

  return "";
};
