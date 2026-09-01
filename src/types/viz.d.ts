declare module "@viz-js/viz" {
  export function instance(): Promise<{
    renderString(src: string, options?: { format?: string; engine?: string }): string;
  }>;
}
