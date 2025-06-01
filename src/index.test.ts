import { describe, expect, it } from 'vitest';
import { Mutex, MultiMutex } from './index';

describe('Mutex', () => {
  it('should not be locked initially', () => {
    const mutex = new Mutex();
    expect(mutex.isLocked()).toBe(false);
  });

  it('should lock and unlock correctly', async () => {
    const mutex = new Mutex();
    const unlock = await mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    unlock();
    expect(mutex.isLocked()).toBe(false);
  });

  it('should handle multiple locks', async () => {
    const mutex = new Mutex();
    const unlock1 = await mutex.lock();
    const unlock2Promise = mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    unlock1();
    expect(mutex.isLocked()).toBe(true);
    const unlock3Promise = mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    (await unlock2Promise)();
    expect(mutex.isLocked()).toBe(true);
    (await unlock3Promise)();
    expect(mutex.isLocked()).toBe(false);
  });

  it('should not care about unlocking the same lock twice', async () => {
    const mutex = new Mutex();
    const unlock1 = await mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    unlock1();
    expect(mutex.isLocked()).toBe(false);
    unlock1();
    expect(mutex.isLocked()).toBe(false);
  });

  it('should auto unlock with withLock()', async () => {
    const mutex = new Mutex();

    let p = mutex.withLock(() => Promise.resolve(42));
    expect(mutex.isLocked()).toBe(true);
    expect(await p).toBe(42);
    // after resolving this should already unlock
    expect(mutex.isLocked()).toBe(false);

    p = mutex.withLock(() => Promise.reject(new Error('42')));
    expect(mutex.isLocked()).toBe(true);
    await expect(async () => await p).rejects.toThrow('42');
    expect(mutex.isLocked()).toBe(false);
  });
});

describe('MultiMutex', () => {
  it('should not be locked initially', () => {
    const mutex = new MultiMutex(3);
    expect(mutex.isLocked()).toBe(false);
  });

  it('should lock and unlock correctly', async () => {
    const mutex = new MultiMutex(1);
    const unlock = await mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    unlock();
    expect(mutex.isLocked()).toBe(false);
  });

  it('should handle multiple locks', async () => {
    const mutex = new MultiMutex(1);
    const unlock1 = await mutex.lock();
    const unlock2Promise = mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    unlock1();
    expect(mutex.isLocked()).toBe(true);
    const unlock3Promise = mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    (await unlock2Promise)();
    expect(mutex.isLocked()).toBe(true);
    (await unlock3Promise)();
    expect(mutex.isLocked()).toBe(false);
  });

  it('should not care about unlocking the same lock twice', async () => {
    const mutex = new MultiMutex(1);
    const unlock1 = await mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    unlock1();
    expect(mutex.isLocked()).toBe(false);
    unlock1();
    expect(mutex.isLocked()).toBe(false);
  });

  it('should support multiple locks being used at once', async () => {
    const mutex = new MultiMutex(3);
    const unlock1 = await mutex.lock();
    expect(mutex.isLocked()).toBe(false);
    const unlock2 = await mutex.lock();
    expect(mutex.isLocked()).toBe(false);
    const unlock3 = await mutex.lock();
    expect(mutex.isLocked()).toBe(true);
    const unlock4Promise = mutex.lock();
    unlock1();
    expect(mutex.isLocked()).toBe(true);
    unlock2();
    expect(mutex.isLocked()).toBe(false);
    unlock3();
    expect(mutex.isLocked()).toBe(false);
    await unlock4Promise.then((unlock) => unlock);
  });

  it('should support multiple locks with withLock()', async () => {
    const mutex = new MultiMutex(2);

    const p1 = mutex.withLock(() => Promise.resolve(42));
    expect(mutex.isLocked()).toBe(false);
    const p2 = mutex.withLock(() => Promise.reject(new Error('42')));
    expect(mutex.isLocked()).toBe(true);
    const p3 = mutex.withLock(() => true);
    expect(mutex.isLocked()).toBe(true);

    expect(await p1).toBe(42);
    expect(mutex.isLocked()).toBe(false);

    await expect(async () => await p2).rejects.toThrow('42');
    expect(mutex.isLocked()).toBe(false);

    expect(await p3).toBe(true);
    expect(mutex.isLocked()).toBe(false);
  });
});
