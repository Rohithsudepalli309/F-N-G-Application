declare module '@playwright/test' {
  export function defineConfig(config: any): any;
  export const devices: Record<string, any>;
  export const test: any;
  export const expect: any;
}
