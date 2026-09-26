declare module 'qrcode' {
  export function toFile(
    path: string,
    text: string | any[],
    options?: any,
  ): Promise<any>;
  export function toDataURL(text: string | any[], options?: any): Promise<string>;
  export function toString(text: string | any[], options?: any): Promise<string>;
}
