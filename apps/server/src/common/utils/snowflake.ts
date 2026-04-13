const EPOCH = 1704067200000n;
const WORKER_ID_BITS = 10n;
const SEQUENCE_BITS = 12n;
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;

const workerId = BigInt(process.env.WORKER_ID || '1') & ((1n << WORKER_ID_BITS) - 1n);

let sequence = 0n;
let lastTimestamp = -1n;

export function generateId(): bigint {
  let timestamp = BigInt(Date.now());

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & MAX_SEQUENCE;
    if (sequence === 0n) {
      while (timestamp <= lastTimestamp) {
        timestamp = BigInt(Date.now());
      }
    }
  } else {
    sequence = 0n;
  }

  lastTimestamp = timestamp;

  return (
    ((timestamp - EPOCH) << (WORKER_ID_BITS + SEQUENCE_BITS)) |
    (workerId << SEQUENCE_BITS) |
    sequence
  );
}
