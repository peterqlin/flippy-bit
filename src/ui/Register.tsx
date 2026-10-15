import { BITS_PER_BYTE, isBitSet, toHex, type BitAddress } from '../engine/bytes';
import type { KeyboardScheme } from '../input/types';

interface RegisterProps {
  value: Uint8Array;
  scheme: KeyboardScheme;
  onFlip: (address: BitAddress) => void;
}

export function Register({ value, scheme, onFlip }: RegisterProps) {
  const addresses = Array.from(value, (_, byte) =>
    Array.from({ length: BITS_PER_BYTE }, (_, i) => ({ byte, bit: BITS_PER_BYTE - 1 - i })),
  );

  return (
    <div className="register">
      <div className="register__value">{toHex(value)}</div>
      {addresses.map((bits, byte) => (
        <div className="register__byte" key={byte}>
          {bits.map((address) => {
            const on = isBitSet(value, address);
            return (
              <button
                key={address.bit}
                type="button"
                className={`bit ${on ? 'bit--on' : ''}`}
                aria-pressed={on}
                aria-label={`Bit ${address.bit}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  onFlip(address);
                }}
              >
                <span className="bit__value">{on ? 1 : 0}</span>
                <span className="bit__key">{scheme.keyForAddress(address)}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
