## Installation

```
pnpm add @livekit/mutex
```

## Usage

```ts
import { Mutex } from '@livekit/mutex';

const myLock = new Mutex();

const unlock = await myLock.lock();

try {
    ...
}
finally {
    unlock();
}

// withLock() that automatically locks and unlocks
await myLock.withLock(async () => {
    ...
});
```
