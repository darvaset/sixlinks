// src/scripts/utils/rate-limiter.ts
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number, timeWindowMs: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add 100ms buffer
      
      console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Clean up again after waiting
      this.requests = this.requests.filter(time => Date.now() - time < this.timeWindow);
    }
    
    // Record this request
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Pre-configured rate limiters for common APIs
export const RateLimiters = {
  // Football-data.org: 10 requests per minute
  footballData: new RateLimiter(10, 60000),
  
  // Wikipedia: Be respectful - 1 request per 2 seconds
  wikipedia: new RateLimiter(1, 2000),
  
  // Generic API: 60 requests per minute
  generic: new RateLimiter(60, 60000)
};