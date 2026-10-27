/**
 * G.711 Mu-law sound codec conversion and resampling utilities
 * This provides lightweight, pure-JS, zero-native audio decoders and encoders
 * to ensure absolute runtime compatibility on any Node.js container platform.
 */

/**
 * Decodes G.711 mu-law (8-bit) to linear PCM (16-bit signed).
 */
export function ulawToPcm(ulawBytes: Uint8Array): Int16Array {
  const pcm = new Int16Array(ulawBytes.length);
  for (let i = 0; i < ulawBytes.length; i++) {
    const raw = ~ulawBytes[i];
    const sign = raw & 0x80;
    const exponent = (raw & 0x70) >> 4;
    const mantissa = raw & 0x0F;
    let sample = (mantissa << 3) + 33;
    sample <<= exponent;
    sample -= 33;
    pcm[i] = sign ? -sample : sample;
  }
  return pcm;
}

/**
 * Encodes linear PCM (16-bit signed) to G.711 mu-law (8-bit).
 */
export function pcmToUlaw(pcmShorts: Int16Array): Uint8Array {
  const ulaw = new Uint8Array(pcmShorts.length);
  for (let i = 0; i < pcmShorts.length; i++) {
    let sample = pcmShorts[i];
    const sign = (sample < 0) ? 0x80 : 0x00;
    if (sample < 0) sample = -sample;
    if (sample > 32635) sample = 32635;
    sample += 132;
    let exponent = 7;
    for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; mask >>= 1) {
      exponent--;
    }
    const mantissa = (sample >> (exponent + 3)) & 0x0f;
    const rawVal = sign | (exponent << 4) | mantissa;
    ulaw[i] = ~rawVal;
  }
  return ulaw;
}

/**
 * Upsamples mono raw 16-bit PCM audio from 8000Hz to 16000Hz via duplication.
 */
export function resample8To16(pcm8k: Int16Array): Int16Array {
  const pcm16k = new Int16Array(pcm8k.length * 2);
  for (let i = 0; i < pcm8k.length; i++) {
    const val = pcm8k[i];
    pcm16k[i * 2] = val;
    pcm16k[i * 2 + 1] = val;
  }
  return pcm16k;
}

/**
 * Downsamples mono raw 16-bit PCM audio from 24000Hz to 8000Hz (every 3rd sample).
 */
export function resample24To8(pcm24k: Int16Array): Int16Array {
  const len = Math.floor(pcm24k.length / 3);
  const pcm8k = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    pcm8k[i] = pcm24k[i * 3];
  }
  return pcm8k;
}

/**
 * Downsamples mono raw 16-bit PCM audio from 16000Hz to 8000Hz (every 2nd sample).
 */
export function resample16To8(pcm16k: Int16Array): Int16Array {
  const len = Math.floor(pcm16k.length / 2);
  const pcm8k = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    pcm8k[i] = pcm16k[i * 2];
  }
  return pcm8k;
}
