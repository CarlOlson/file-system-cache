export const Sleep = {
  msecs: (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay)),
  secs: (delay: number) => Sleep.msecs(delay * 1000),
} as const;
