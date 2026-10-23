import { BITS_PER_BYTE, isBitSet, type BitAddress } from '../engine/bytes';
import { bitKey } from './PlayerProjectileLayer';

interface RegisterProps {
  value: Uint8Array;
  onFlip: (address: BitAddress) => void;
}

export function Register({ value, onFlip }: RegisterProps) {
  const addresses = Array.from(value, (_, byte) =>
    Array.from({ length: BITS_PER_BYTE }, (_, i) => ({ byte, bit: BITS_PER_BYTE - 1 - i })),
  );

  return (
    <div className="pt-1.25">
      {addresses.map((bits, byte) => (
        <div className="grid grid-cols-8 gap-1.5" key={byte}>
          {bits.map((address) => {
            const on = isBitSet(value, address);
            return (
              <button
                key={address.bit}
                data-bit={bitKey(address.byte, address.bit)}
                type="button"
                className={`flex min-h-14 items-center justify-center rounded-lg border ${on ? 'border-accent bg-accent/20' : 'border-line bg-panel'}`}
                aria-pressed={on}
                aria-label={`Bit ${address.bit}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  onFlip(address);
                }}
              >
                <span className="text-2xl font-bold">{on ? 1 : 0}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
