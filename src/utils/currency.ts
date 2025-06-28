/**
 * Currency conversion and formatting utilities
 */

// Exchange rates (in a real app, these would come from an API)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  INR: 83.12,
  CAD: 1.25,
  AUD: 1.35,
  JPY: 110.0,
  CNY: 6.45,
  BRL: 5.2,
  MXN: 20.0,
};

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  CNY: "¥",
  BRL: "R$",
  MXN: "$",
};

/**
 * Get user's preferred currency - defaults to USD
 */
export function getUserCurrency(): string {
  // Try to get from localStorage first
  const savedCurrency = localStorage.getItem("preferred_currency");
  if (savedCurrency && EXCHANGE_RATES[savedCurrency]) {
    return savedCurrency;
  }

  // Always default to USD for primary display
  return "USD";
}

/**
 * Convert amount from USD to target currency
 */
export function convertCurrency(
  usdAmount: number,
  targetCurrency: string,
): number {
  const rate = EXCHANGE_RATES[targetCurrency] || 1.0;
  return usdAmount * rate;
}

/**
 * Format currency amount with proper symbol and formatting
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  // Format based on currency
  switch (currency) {
    case "JPY":
    case "CNY":
      // No decimal places for these currencies
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    case "INR":
      // Indian number formatting
      return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    default:
      // Standard formatting with 2 decimal places
      return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Convert and format USD price to user's currency
 */
export function formatPriceForUser(
  usdPrice: number,
  userCurrency?: string,
): {
  amount: number;
  formatted: string;
  currency: string;
} {
  const targetCurrency = userCurrency || getUserCurrency();
  const convertedAmount = convertCurrency(usdPrice, targetCurrency);

  return {
    amount: convertedAmount,
    formatted: formatCurrency(convertedAmount, targetCurrency),
    currency: targetCurrency,
  };
}

/**
 * Format price from smallest currency unit (cents/paise) to display format
 */
export function formatPriceFromSmallestUnit(
  amountInSmallestUnit: number,
  currency: string,
): {
  amount: number;
  formatted: string;
  currency: string;
} {
  // Convert from smallest unit to main unit
  const divisor = currency === "JPY" || currency === "CNY" ? 1 : 100;
  const amountInMainUnit = amountInSmallestUnit / divisor;

  return {
    amount: amountInMainUnit,
    formatted: formatCurrency(amountInMainUnit, currency),
    currency: currency,
  };
}

/**
 * Set user's preferred currency
 */
export function setUserCurrency(currency: string): void {
  if (EXCHANGE_RATES[currency]) {
    localStorage.setItem("preferred_currency", currency);
  }
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): Array<{
  code: string;
  symbol: string;
  name: string;
}> {
  const currencyNames: Record<string, string> = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    INR: "Indian Rupee",
    CAD: "Canadian Dollar",
    AUD: "Australian Dollar",
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan",
    BRL: "Brazilian Real",
    MXN: "Mexican Peso",
  };

  return Object.keys(EXCHANGE_RATES).map((code) => ({
    code,
    symbol: CURRENCY_SYMBOLS[code],
    name: currencyNames[code] || code,
  }));
}

/**
 * Show both USD and local currency if different
 */
export function formatPriceWithOriginal(
  usdPrice: number,
  userCurrency?: string,
): string {
  const targetCurrency = userCurrency || getUserCurrency();

  if (targetCurrency === "USD") {
    return formatCurrency(usdPrice, "USD");
  }

  const converted = formatPriceForUser(usdPrice, targetCurrency);
  const originalUSD = formatCurrency(usdPrice, "USD");

  return `${converted.formatted} (${originalUSD})`;
}
