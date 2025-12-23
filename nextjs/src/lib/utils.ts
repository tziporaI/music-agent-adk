import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 10,
  maxDuration: number = 120000
): Promise<T> {
  const startTime = Date.now();
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (Date.now() - startTime > maxDuration) {
      throw new Error(`Retry timeout after ${maxDuration}ms`);
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
