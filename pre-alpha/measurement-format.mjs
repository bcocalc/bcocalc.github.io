// Display-only inch formatting. Calculations and saved values never use rounding.
export const FRACTION_NOTE = 'Fractions rounded to the nearest 1/16 in; decimals are unchanged. ≈ marks a rounded fraction.';

export function fractionalInches(value) {
  if (!Number.isFinite(value)) return null;
  const ticks = Math.round(Math.abs(value) * 16);
  // Do not manufacture a fraction when integer precision is unavailable.
  if (!Number.isSafeInteger(ticks)) return null;
  const whole = Math.floor(ticks / 16);
  let numerator = ticks % 16, denominator = 16;
  while (numerator && numerator % 2 === 0) { numerator /= 2; denominator /= 2; }
  const magnitude = numerator ? (whole ? whole + ' ' : '') + numerator + '/' + denominator : String(whole);
  const rounded = (value < 0 ? -1 : 1) * ticks / 16;
  return {text: (value < 0 && ticks ? '-' : '') + magnitude, approximate: value !== rounded};
}

export function inchText(value, missing = 'Not calculated') {
  if (!Number.isFinite(value)) return missing;
  const fraction = fractionalInches(value);
  return value.toFixed(4) + ' in' + (fraction ? ' (' + (fraction.approximate ? '≈ ' : '') + fraction.text + ' in)' : '');
}

export function inchMarkup(value, missing = '-- <small>in</small>') {
  if (!Number.isFinite(value)) return missing;
  const fraction = fractionalInches(value);
  return '<span class="result-decimal">' + value.toFixed(4) + ' <small>in</small></span>' +
    (fraction ? ' <small class="result-fraction" title="Rounded to the nearest 1/16 inch">(' + (fraction.approximate ? '≈ ' : '') + fraction.text + ' in)</small>' : '');
}
