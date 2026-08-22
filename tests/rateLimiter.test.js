// tests/rateLimiter.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeJitterDelay,
  computeBackoffDelay,
  computeThrottleWaitMs,
  RateLimitedQueue,
  withBackoffRetry,
} from '../src/background/rateLimiter.js';

describe('computeJitterDelay', () => {
  it('stays within [min, max]', () => {
    const delay = computeJitterDelay(800, 1500, () => 0.5);
    expect(delay).toBe(800 + 0.5 * 700);
  });
});

describe('computeBackoffDelay', () => {
  it('grows exponentially and is capped at maxMs', () => {
    const d0 = computeBackoffDelay(0, 2000, 60000, () => 0);
    const d3 = computeBackoffDelay(3, 2000, 60000, () => 0);
    const d10 = computeBackoffDelay(10, 2000, 60000, () => 0);
    expect(d0).toBe(1000);
    expect(d3).toBe(8000);
    expect(d10).toBeLessThanOrEqual(60000);
  });
});

describe('computeThrottleWaitMs', () => {
  it('returns 0 when remaining is above threshold', () => {
    expect(computeThrottleWaitMs(10, 2000, 3, 1000)).toBe(0);
  });

  it('returns wait until reset when remaining is at/below threshold', () => {
    expect(computeThrottleWaitMs(2, 5, 3, 1000)).toBe(4000);
  });

  it('returns 0 when remaining is null', () => {
    expect(computeThrottleWaitMs(null, null, 3, 1000)).toBe(0);
  });
});

describe('RateLimitedQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs tasks sequentially, delaying every task after the first', async () => {
    const order = [];
    const queue = new RateLimitedQueue({
      minDelayMs: 1000,
      maxDelayMs: 1000,
      randomFn: () => 0,
    });

    const p1 = queue.enqueue(async () => {
      order.push('a');
      return {};
    });
    const p2 = queue.enqueue(async () => {
      order.push('b');
      return {};
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual(['a']);

    await vi.advanceTimersByTimeAsync(1000);
    await Promise.all([p1, p2]);
    expect(order).toEqual(['a', 'b']);
  });

  it('throttles subsequent task when remaining rate limit is low', async () => {
    const queue = new RateLimitedQueue({
      minDelayMs: 0,
      maxDelayMs: 0,
      thresholdRemaining: 3,
      randomFn: () => 0,
      now: () => 0,
    });
    const order = [];

    await queue.enqueue(async () => {
      order.push('a');
      return { rateLimitRemaining: 1, rateLimitResetEpochSeconds: 5 };
    });

    const p2 = queue.enqueue(async () => {
      order.push('b');
      return {};
    });
    await vi.advanceTimersByTimeAsync(4999);
    expect(order).toEqual(['a']);
    await vi.advanceTimersByTimeAsync(1);
    await p2;
    expect(order).toEqual(['a', 'b']);
  });
});

describe('withBackoffRetry', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('retries on 429 and eventually succeeds', async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts += 1;
      if (attempts < 3) {
        const err = new Error('rate limited');
        err.status = 429;
        throw err;
      }
      return 'ok';
    });

    const promise = withBackoffRetry(fn, {
      baseDelayMs: 100,
      maxDelayMs: 1000,
      randomFn: () => 0,
    });
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await expect(promise).resolves.toBe('ok');
    expect(attempts).toBe(3);
  });

  it('gives up after maxRetries and rethrows', async () => {
    const err = new Error('rate limited');
    err.status = 429;
    const fn = vi.fn(async () => {
      throw err;
    });

    const promise = withBackoffRetry(fn, {
      maxRetries: 2,
      baseDelayMs: 10,
      maxDelayMs: 10,
      randomFn: () => 0,
    });
    const assertion = expect(promise).rejects.toThrow('rate limited');
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-429 errors', async () => {
    const err = new Error('boom');
    const fn = vi.fn(async () => {
      throw err;
    });
    await expect(withBackoffRetry(fn)).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
