declare module 'puppeteer-real-browser' {
  import type { Browser, Page } from 'rebrowser-puppeteer-core';
  import type { GhostCursor } from 'ghost-cursor';

  export function connect(options: Options): Promise<ConnectResult>;

  interface PageWithCursor extends Page {
    realClick: GhostCursor['click'];
    realCursor: GhostCursor;
  }

  type ConnectResult = {
    browser: Browser;
    page: PageWithCursor;
  };

  interface Options {
    args?: string[];
    headless?: boolean;
    customConfig?: import('chrome-launcher').Options;
    proxy?: ProxyOptions;
    turnstile?: boolean;
    connectOption?: import('rebrowser-puppeteer-core').ConnectOptions;
    disableXvfb?: boolean;
    plugins?: import('puppeteer-extra').PuppeteerExtraPlugin[];
    ignoreAllFlags?: boolean;
  }

  interface ProxyOptions {
    host: string;
    port: number;
    username?: string;
    password?: string;
  }
}

/* declare module 'xvfb' {
  import { ChildProcess } from 'child_process';

  export interface XvfbOptions {
    displayNum?: number;
    reuse?: boolean;
    timeout?: number;
    silent?: boolean;
    xvfb_args?: string[];
  }

  export default class Xvfb {
    constructor(options?: XvfbOptions);

    start(callback?: (error?: Error | null, process?: ChildProcess) => void): void;
    startSync(): ChildProcess | undefined;

    stop(callback?: (error?: Error | null) => void): void;
    stopSync(): void;

    display(): string;

    private _setDisplayEnvVariable(): void;
    private _restoreDisplayEnvVariable(): void;
    private _spawnProcess(lockFileExists: boolean, onAsyncSpawnError: (error: Error) => void): void;
    private _killProcess(): void;
    private _lockFile(displayNum?: number): string;
  }
}
 */
