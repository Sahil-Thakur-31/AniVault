export class TokenBucketRateLimiter {
  private capacity: number;
  private tokens: number;
  private refillRatePerSecond: number;
  private lastRefillTimestamp: number;

  constructor(capacity: number, refillRatePerSecond: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRatePerSecond;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTimestamp = now;
  }

  public tryConsume(tokens = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  public async acquire(tokens = 1): Promise<void> {
    while (!this.tryConsume(tokens)) {
      const waitMs = Math.ceil((1 / this.refillRatePerSecond) * 1000);
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 250)));
    }
  }

  public getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

