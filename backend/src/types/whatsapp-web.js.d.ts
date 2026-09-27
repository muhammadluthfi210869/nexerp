declare module 'whatsapp-web.js' {
  export interface ClientOptions {
    authStrategy?: any;
    puppeteer?: any;
  }

  export class LocalAuth {
    constructor(options?: { dataPath?: string; clientId?: string });
  }

  export interface Contact {
    id: { _serialized: string };
    name?: string;
    pushname?: string;
    number?: string;
  }

  export interface Message {
    id: { id: string; _serialized: string; fromMe: boolean; remote: string };
    from: string;
    to: string;
    author?: string;
    fromMe: boolean;
    body: string;
    timestamp: number;
    type: string;
    hasMedia: boolean;
    isStatus: boolean;
    isForwarded?: boolean;
    getContact(): Promise<Contact>;
  }

  export interface Chat {
    id: { _serialized: string; user?: string };
    isGroup: boolean;
    name?: string;
    fetchMessages(searchOptions: { limit: number }): Promise<Message[]>;
  }

  export class Client {
    constructor(options?: ClientOptions);
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    getState(): Promise<string>;
    getChats(): Promise<Chat[]>;
    on(event: string, callback: (...args: any[]) => void): this;
    info?: {
      wid?: { _serialized: string; [key: string]: any };
      pushname?: string;
    };
  }
}
