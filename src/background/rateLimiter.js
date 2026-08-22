export function computeJitterDelay(minMs, maxMs, randomFn = Math.random) {
  return minMs + randomFn() * (maxMs - minMs);
}

export function computeBackoffDelay(
  attempt,
  baseMs = 2000,
  maxMs = 60000,
  randomFn = Math.random
) {
  const exp = Math.min(baseMs * 2 ** attempt, maxMs);
  return exp / 2 + randomFn() * (exp / 2);
}

export function computeThrottleWaitMs(
  remaining,
  resetEpochSeconds,
  thresholdRemaining,
  nowMs
) {
  if (remaining === null || remaining === undefined) return 0;
  if (remaining > thresholdRemaining) return 0;
  if (!resetEpochSeconds) return 0;
  const waitMs = resetEpochSeconds * 1000 - nowMs;
  return waitMs > 0 ? waitMs : 0;
}

function defaultDelayFn(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RateLimitedQueue {
  constructor({
    minDelayMs = 800,
    maxDelayMs = 1500,
    thresholdRemaining = 3,
    randomFn = Math.random,
    now = () => Date.now(),
    delayFn = defaultDelayFn,
  } = {}) {
    this.minDelayMs = minDelayMs;
    this.maxDelayMs = maxDelayMs;
    this.thresholdRemaining = thresholdRemaining;
    this.randomFn = randomFn;
    this.now = now;
    this.delayFn = delayFn;
    this.tail = Promise.resolve();
    this.rateLimitRemaining = null;
    this.rateLimitResetEpochSeconds = null;
    this.isFirstTask = true;
  }

  enqueue(taskFn) {
    const run = async () => {
      if (!this.isFirstTask) {
        const jitter = computeJitterDelay(
          this.minDelayMs,
          this.maxDelayMs,
          this.randomFn
        );
        await this.delayFn(jitter);
      }
      const throttleWait = computeThrottleWaitMs(
        this.rateLimitRemaining,
        this.rateLimitResetEpochSeconds,
        this.thresholdRemaining,
        this.now()
      );
      if (throttleWait > 0) {
        await this.delayFn(throttleWait);
      }
      this.isFirstTask = false;
      const result = await taskFn();
      if (result && typeof result.rateLimitRemaining === 'number') {
        this.rateLimitRemaining = result.rateLimitRemaining;
        this.rateLimitResetEpochSeconds =
          result.rateLimitResetEpochSeconds ?? null;
      }
      return result;
    };

    const resultPromise = this.tail.then(run, run);
    this.tail = resultPromise.then(
      () => undefined,
      () => undefined
    );
    return resultPromise;
  }
}

export async function withBackoffRetry(
  fn,
  {
    maxRetries = 5,
    baseDelayMs = 2000,
    maxDelayMs = 60000,
    randomFn = Math.random,
    delayFn = defaultDelayFn,
    isRetryable = (err) => err && err.status === 429,
  } = {}
) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err) || attempt >= maxRetries) throw err;
      const delay = computeBackoffDelay(
        attempt,
        baseDelayMs,
        maxDelayMs,
        randomFn
      );
      await delayFn(delay);
      attempt += 1;
    }
  }
}
