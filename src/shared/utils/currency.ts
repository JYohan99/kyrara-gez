/**
 * Formats cents into currency string with symbol.
 * Example: 14285000 -> "$ 142.850,00"
 */
export function formatCurrency(
  cents: number,
  options?: {
    currency?: string;
    showDecimals?: boolean;
    hidden?: boolean;
  }
): string {
  if (options?.hidden) {
    return '••••••••';
  }

  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const units = Math.floor(absCents / 100);
  const remainder = absCents % 100;

  // Format units with dots: 142850 -> "142.850"
  const unitsStr = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  let result = unitsStr;
  if (options?.showDecimals !== false) {
    const decimalsStr = remainder.toString().padStart(2, '0');
    result += `,${decimalsStr}`;
  }

  const sign = isNegative ? '- ' : '';
  const currencySymbol = options?.currency === 'USD' ? 'US$ ' : '$ ';

  return `${sign}${currencySymbol}${result}`;
}

/**
 * Formats a raw user input string into real-time money display format.
 * Uses dot '.' as thousands separator and comma ',' as decimal separator.
 * Allows typing integers and up to 2 decimal places.
 * Example inputs and outputs:
 * "1" -> "1"
 * "1000" -> "1.000"
 * "1000," -> "1.000,"
 * "1000,5" -> "1.000,5"
 * "1000,50" -> "1.000,50"
 * "1000.5" -> "1.000,5"
 */
export function formatMoneyInput(input: string): string {
  if (!input) return '';

  // Check if there is an explicit decimal separator
  let hasComma = input.includes(',');
  let raw = input;

  // If text does not contain a comma, but ends with a dot or has a dot with 1-2 digits at the end
  if (!hasComma && raw.includes('.')) {
    const lastDotIndex = raw.lastIndexOf('.');
    const afterDot = raw.substring(lastDotIndex + 1);
    if (afterDot.length <= 2) {
      // Treat this last dot as a decimal comma
      raw = raw.substring(0, lastDotIndex) + ',' + afterDot;
      hasComma = true;
    }
  }

  if (hasComma) {
    const commaIndex = raw.indexOf(',');
    const integerPartRaw = raw.substring(0, commaIndex);
    const decimalPartRaw = raw.substring(commaIndex + 1);

    // Keep only digits in integer part
    const intDigits = integerPartRaw.replace(/\D/g, '');
    const cleanInt = intDigits ? intDigits.replace(/^0+(?=\d)/, '') : '0';
    const formattedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Decimal part: keep only digits, max 2
    const cleanDec = decimalPartRaw.replace(/\D/g, '').slice(0, 2);

    return `${formattedInt},${cleanDec}`;
  }

  // Integer only
  const intDigits = raw.replace(/\D/g, '');
  if (!intDigits) return '';
  const cleanInt = intDigits.replace(/^0+(?=\d)/, '');
  return cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parses user input string into cents.
 * Handles:
 * "14500" -> 1450000
 * "14.500" -> 1450000
 * "14.500,50" -> 1450050
 * "0,75" -> 75
 */
export function parseAmountToCents(input: string): number {
  if (!input) return 0;
  // Remove currency signs, spaces
  const cleaned = input.replace(/[\$\s]/g, '');
  if (!cleaned) return 0;

  if (cleaned.includes(',')) {
    const [intPart, decPart = ''] = cleaned.split(',');
    const units = parseInt(intPart.replace(/\D/g, '') || '0', 10);
    const decimals = parseInt((decPart.replace(/\D/g, '') + '00').slice(0, 2), 10);
    return units * 100 + decimals;
  }

  // No comma -> everything is units (dots are thousands separators)
  const units = parseInt(cleaned.replace(/\D/g, '') || '0', 10);
  return units * 100;
}
