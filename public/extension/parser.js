/**
 * SyncRate - Universal Currency & Numeral Parsing Engine
 * Clean Architecture implementation with Strategy and Chain of Responsibility patterns.
 * 
 * Pipeline:
 *  Raw Text -> TextNormalizer -> [StandardRegexStrategy | LexicalWordStrategy] -> MoneyValueExtractor
 * 
 * @license Apache-2.0
 */

// ============================================================================
// 1. DOMAIN DATA: CURRENCY DICTIONARIES & LEXICAL DECLENSIONS
// ============================================================================

const CRYPTO_MAP = {
  'BTC': 'BTC', 'BITCOIN': 'BTC', 'БИТКОИН': 'BTC', 'БИТОК': 'BTC', 'БИТКА': 'BTC', 'БИТКОВ': 'BTC',
  'ETH': 'ETH', 'ETHEREUM': 'ETH', 'ЭФИРИУМ': 'ETH', 'ЭФИР': 'ETH', 'ЭФИРА': 'ETH', 'ЭФИРОВ': 'ETH',
  'USDT': 'USDT', 'TETHER': 'USDT', 'ТЕЗЕР': 'USDT', 'ТИЗЕР': 'USDT',
  'BNB': 'BNB', 'BINANCECOIN': 'BNB',
  'SOL': 'SOL', 'SOLANA': 'SOL', 'СОЛАНА': 'SOL', 'СОЛАНЫ': 'SOL',
  'XRP': 'XRP', 'RIPPLE': 'XRP', 'РИПЛ': 'XRP', 'РИПЛА': 'XRP',
  'USDC': 'USDC', 'USDCOIN': 'USDC',
  'ADA': 'ADA', 'CARDANO': 'ADA', 'КАРДАНО': 'ADA',
  'AVAX': 'AVAX', 'AVALANCHE': 'AVAX', 'АВАКС': 'AVAX',
  'DOGE': 'DOGE', 'DOGECOIN': 'DOGE', 'ДОГИ': 'DOGE', 'ДОГИКОИН': 'DOGE',
  'DOT': 'DOT', 'POLKADOT': 'DOT', 'ПОЛКАДОТ': 'DOT',
  'TRX': 'TRX', 'TRON': 'TRX', 'ТРОН': 'TRX',
  'LINK': 'LINK', 'CHAINLINK': 'LINK', 'ЛИНК': 'LINK',
  'MATIC': 'MATIC', 'POLYGON': 'MATIC', 'МАТИК': 'MATIC',
  'TON': 'TON', 'TONCOIN': 'TON', 'ТОН': 'TON', 'ТОНКОИН': 'TON',
  'SHIB': 'SHIB', 'SHIBAINU': 'SHIB', 'ШИБА': 'SHIB',
  'LTC': 'LTC', 'LITECOIN': 'LTC', 'ЛАЙТКОИН': 'LTC',
  'BCH': 'BCH', 'BITCOINCASH': 'BCH',
  'SAT': 'SAT', 'SATOSHI': 'SAT', 'САТОШИ': 'SAT',
  'WAVES': 'WAVES', 'ВЕЙВС': 'WAVES'
};

const FIAT_MAP = {
  '$': 'USD', 'USD': 'USD', '€': 'EUR', 'EUR': 'EUR', '£': 'GBP', 'GBP': 'GBP',
  '¥': 'CNY', 'CNY': 'CNY', 'JPY': 'JPY', '₣': 'CHF', 'FR.': 'CHF', 'CHF': 'CHF',
  'A$': 'AUD', 'AUD': 'AUD', 'C$': 'CAD', 'CAD': 'CAD', '₺': 'TRY', 'TRY': 'TRY',
  'AED': 'AED', '₴': 'UAH', 'UAH': 'UAH', 'ГРН': 'UAH', '₸': 'KZT', 'KZT': 'KZT',
  '₼': 'AZN', 'AZN': 'AZN', 'BGN': 'BGN', 'LEV': 'BGN', 'BR': 'BYN', 'BYN': 'BYN',
  'БР': 'BYN', 'БЕЛРУБ': 'BYN', 'BYR': 'BYN', 'РБ': 'BYN', '₹': 'INR', 'INR': 'INR',
  'KGS': 'KGS', '₩': 'KRW', 'KRW': 'KRW', 'L': 'MDL', 'MDL': 'MDL', 'SM': 'TJS',
  'TJS': 'TJS', 'TMT': 'TMT', 'UZS': 'UZS', 'SUM': 'UZS', '₪': 'ILS', 'ILS': 'ILS',
  '¢': 'USD', '₽': 'RUB', 'Р': 'RUB', 'РУБ': 'RUB', 'РУБ.': 'RUB', 'РУБЛЕЙ': 'RUB', 'RUB': 'RUB',
  'ZŁ': 'PLN', 'PLN': 'PLN', 'GEL': 'GEL', 'AMD': 'AMD'
};

/**
 * Comprehensive lexical dictionary mapping word declensions & slang to ISO-4217 / crypto codes.
 * Supports Russian and English words in all cases (nominative, genitive, plural, slang).
 */
const LEXICAL_CURRENCY_DICTIONARY = {
  // USD
  'доллар': 'USD', 'доллара': 'USD', 'долларов': 'USD', 'долларах': 'USD', 'долларами': 'USD',
  'доллары': 'USD', 'долларе': 'USD', 'бакс': 'USD', 'бакса': 'USD', 'баксов': 'USD',
  'баксам': 'USD', 'баксах': 'USD', 'баксами': 'USD', 'баксы': 'USD', 'зеленых': 'USD',
  'зелёных': 'USD', 'грин': 'USD', 'dollar': 'USD', 'dollars': 'USD', 'buck': 'USD', 'bucks': 'USD',
  'greenback': 'USD', 'greenbacks': 'USD',

  // EUR
  'евро': 'EUR', 'эвро': 'EUR', 'еврика': 'EUR', 'евриков': 'EUR', 'euro': 'EUR', 'euros': 'EUR',

  // RUB
  'рубль': 'RUB', 'рубля': 'RUB', 'рублей': 'RUB', 'рублям': 'RUB', 'рублях': 'RUB', 'рублями': 'RUB',
  'рубли': 'RUB', 'деревянный': 'RUB', 'деревянных': 'RUB', 'деревянные': 'RUB', 'рублик': 'RUB',
  'рубликов': 'RUB', 'ruble': 'RUB', 'rubles': 'RUB', 'rouble': 'RUB', 'roubles': 'RUB',

  // GBP
  'фунт': 'GBP', 'фунта': 'GBP', 'фунтов': 'GBP', 'фунтам': 'GBP', 'фунтах': 'GBP', 'фунтами': 'GBP',
  'фунты': 'GBP', 'стерлинг': 'GBP', 'стерлинга': 'GBP', 'стерлингов': 'GBP', 'pound': 'GBP',
  'pounds': 'GBP', 'quid': 'GBP',

  // UAH
  'гривна': 'UAH', 'гривны': 'UAH', 'гривен': 'UAH', 'гривнам': 'UAH', 'гривнах': 'UAH',
  'гривня': 'UAH', 'гривні': 'UAH', 'гривень': 'UAH', 'hryvnia': 'UAH', 'hryvnias': 'UAH',

  // KZT
  'тенге': 'KZT', 'теньге': 'KZT', 'tenge': 'KZT',

  // BYN
  'белрубль': 'BYN', 'белрубля': 'BYN', 'белрублей': 'BYN', 'зайчик': 'BYN', 'зайчика': 'BYN', 'зайчиков': 'BYN',

  // CNY
  'юань': 'CNY', 'юаня': 'CNY', 'юаней': 'CNY', 'юани': 'CNY', 'yuan': 'CNY', 'rmb': 'CNY',

  // JPY
  'иена': 'JPY', 'иены': 'JPY', 'иен': 'JPY', 'йена': 'JPY', 'йены': 'JPY', 'йен': 'JPY', 'yen': 'JPY',

  // TRY
  'лира': 'TRY', 'лиры': 'TRY', 'лир': 'TRY', 'lira': 'TRY', 'liras': 'TRY',

  // PLN
  'злотый': 'PLN', 'злотых': 'PLN', 'злотого': 'PLN', 'zloty': 'PLN', 'zlote': 'PLN', 'zlotych': 'PLN',

  // ILS
  'шекель': 'ILS', 'шекеля': 'ILS', 'шекелей': 'ILS', 'shekel': 'ILS', 'shekels': 'ILS',

  // CHF
  'франк': 'CHF', 'франка': 'CHF', 'франков': 'CHF', 'franc': 'CHF', 'francs': 'CHF',

  // Crypto
  'биткоин': 'BTC', 'биткоина': 'BTC', 'биткоинов': 'BTC', 'биток': 'BTC', 'битка': 'BTC',
  'битком': 'BTC', 'биткоины': 'BTC', 'bitcoin': 'BTC', 'bitcoins': 'BTC',
  'сатоши': 'SAT', 'сатошей': 'SAT', 'сатошиков': 'SAT', 'satoshi': 'SAT', 'sats': 'SAT',
  'эфир': 'ETH', 'эфира': 'ETH', 'эфириум': 'ETH', 'эфириума': 'ETH', 'ethereum': 'ETH',
  'тезер': 'USDT', 'тизер': 'USDT', 'tether': 'USDT',
  'солана': 'SOL', 'соланы': 'SOL', 'solana': 'SOL'
};

const ALL_CURRENCY_MAP = { ...FIAT_MAP, ...CRYPTO_MAP };
const CRYPTO_CODES = Object.values(CRYPTO_MAP);

// ============================================================================
// 2. TEXT NORMALIZER
// ============================================================================

class TextNormalizer {
  /**
   * Sanitizes, strips non-breaking/zero-width spaces and cleans extraneous characters.
   * @param {string} text
   * @returns {string}
   */
  static clean(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[\u00A0\u202F\u200B-\u200D\uFEFF]/g, ' ')
      .replace(/[«»"'\(\)\[\]{}<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenizes text into normalized words and symbols.
   * @param {string} text
   * @returns {string[]}
   */
  static tokenize(text) {
    const cleaned = TextNormalizer.clean(text);
    return cleaned.split(/\s+/).filter(Boolean);
  }
}

// ============================================================================
// 3. NUMBER WORDS CONVERTER (Russian & English words to numeric value)
// ============================================================================

class NumberWordsConverter {
  static RU_NUMS = {
    'ноль': 0, 'нуль': 0,
    'один': 1, 'одна': 1, 'одно': 1, 'одни': 1, 'единица': 1, 'единицу': 1,
    'два': 2, 'две': 2, 'двое': 2,
    'три': 3, 'трое': 3,
    'четыре': 4, 'четверо': 4,
    'пять': 5, 'пятеро': 5,
    'шесть': 6, 'шестеро': 6,
    'семь': 7, 'семеро': 7,
    'восемь': 8, 'восьмеро': 8,
    'девять': 9, 'девятеро': 9,
    'десять': 10,
    'одиннадцать': 11, 'двенадцать': 12, 'тринадцать': 13, 'четырнадцать': 14,
    'пятнадцать': 15, 'шестнадцать': 16, 'семнадцать': 17, 'восемнадцать': 18,
    'девятнадцать': 19,
    'двадцать': 20, 'тридцать': 30, 'сорок': 40, 'пятьдесят': 50,
    'шестьдесят': 60, 'семьдесят': 70, 'восемьдесят': 80, 'девяносто': 90,
    'сто': 100, 'двести': 200, 'триста': 300, 'четыреста': 400, 'пятьсот': 500,
    'шестьсот': 600, 'семьсот': 700, 'восемьсот': 800, 'девятьсот': 900
  };

  static EN_NUMS = {
    'zero': 0,
    'one': 1, 'a': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
    'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90
  };

  static MULTIPLIERS = {
    // 100
    'hundred': 100, 'hundreds': 100,

    // 1,000
    'тысяч': 1000, 'тысяча': 1000, 'тысячи': 1000, 'тысячу': 1000, 'тысячам': 1000,
    'тысячами': 1000, 'тысячах': 1000, 'тыс': 1000, 'тыс.': 1000, 'к': 1000,
    'thousand': 1000, 'thousands': 1000, 'grand': 1000, 'k': 1000,

    // 1,000,000
    'миллион': 1000000, 'миллиона': 1000000, 'миллионов': 1000000, 'миллиону': 1000000,
    'миллионами': 1000000, 'миллионах': 1000000, 'млн': 1000000, 'млн.': 1000000,
    'million': 1000000, 'millions': 1000000, 'm': 1000000,

    // 1,000,000,000
    'миллиард': 1000000000, 'миллиарда': 1000000000, 'миллиардов': 1000000000,
    'млрд': 1000000000, 'млрд.': 1000000000, 'billion': 1000000000, 'billions': 1000000000,
    'b': 1000000000,

    // 1,000,000,000,000
    'триллион': 1000000000000, 'триллиона': 1000000000000, 'триллионов': 1000000000000,
    'трлн': 1000000000000, 'трлн.': 1000000000000, 'trillion': 1000000000000, 'trillions': 1000000000000,
    't': 1000000000000
  };

  /**
   * Evaluates an array of words representing numbers/multipliers and returns numeric value.
   * Supports: "три тысячи", "90 тысяч", "три с половиной тысячи", "five hundred", "25 grand", "полтора миллиона".
   * @param {string[]} words
   * @returns {number|null}
   */
  static wordsToNumber(words) {
    if (!words || words.length === 0) return null;

    let total = 0;
    let currentGroup = 0;
    let hasNumericMatch = false;

    for (let i = 0; i < words.length; i++) {
      let word = words[i].toLowerCase().replace(/[.,]$/, '');

      // Skip conjunctions
      if (word === 'and' || word === 'и') continue;

      // Handle "с половиной" / "and a half"
      if (word === 'с' && i + 1 < words.length && words[i + 1].toLowerCase().startsWith('половин')) {
        currentGroup += 0.5;
        hasNumericMatch = true;
        i++; // skip 'половиной'
        continue;
      }
      if (word === 'and' && i + 2 < words.length && words[i + 1].toLowerCase() === 'a' && words[i + 2].toLowerCase() === 'half') {
        currentGroup += 0.5;
        hasNumericMatch = true;
        i += 2; // skip 'a half'
        continue;
      }

      // Special Russian compound words: полтора (1.5), полторы (1.5), полмиллиона (500000), полтысячи (500)
      if (word === 'полтора' || word === 'полторы' || word === 'полутора') {
        currentGroup += 1.5;
        hasNumericMatch = true;
        continue;
      }
      if (word === 'полмиллиона') {
        total += 500000;
        hasNumericMatch = true;
        continue;
      }
      if (word === 'полтысячи') {
        total += 500;
        hasNumericMatch = true;
        continue;
      }
      if (word === 'четверть') {
        currentGroup += 0.25;
        hasNumericMatch = true;
        continue;
      }

      // Check if word is already a digit or decimal number (e.g., "90", "3.5", "100,50")
      const cleanedNumStr = word.replace(/\s/g, '').replace(',', '.');
      if (/^[0-9]+(\.[0-9]+)?$/.test(cleanedNumStr)) {
        const val = parseFloat(cleanedNumStr);
        if (!isNaN(val)) {
          currentGroup += val;
          hasNumericMatch = true;
          continue;
        }
      }

      // Check single words: RU or EN number tables
      if (NumberWordsConverter.RU_NUMS[word] !== undefined) {
        currentGroup += NumberWordsConverter.RU_NUMS[word];
        hasNumericMatch = true;
        continue;
      }
      if (NumberWordsConverter.EN_NUMS[word] !== undefined) {
        currentGroup += NumberWordsConverter.EN_NUMS[word];
        hasNumericMatch = true;
        continue;
      }

      // Check multipliers
      if (NumberWordsConverter.MULTIPLIERS[word] !== undefined) {
        const mult = NumberWordsConverter.MULTIPLIERS[word];
        if (mult === 100) {
          currentGroup = (currentGroup === 0 ? 1 : currentGroup) * 100;
        } else {
          total += (currentGroup === 0 ? 1 : currentGroup) * mult;
          currentGroup = 0;
        }
        hasNumericMatch = true;
        continue;
      }

      // If we encounter an unrecognizable non-number word, fail if nothing matched
      if (!hasNumericMatch) return null;
    }

    total += currentGroup;
    return hasNumericMatch ? total : null;
  }
}

// ============================================================================
// 4. LEXICAL CURRENCY RESOLVER
// ============================================================================

class LexicalCurrencyResolver {
  /**
   * Resolves a token/word to an ISO currency code or crypto identifier.
   * @param {string} token
   * @returns {string|null}
   */
  static resolve(token) {
    if (!token) return null;
    const cleanToken = token.trim();
    const upperToken = cleanToken.toUpperCase();
    const lowerToken = cleanToken.toLowerCase().replace(/[.,!?:;]$/, '');

    // 1. Direct match in symbol/code maps
    if (ALL_CURRENCY_MAP[upperToken]) {
      return ALL_CURRENCY_MAP[upperToken];
    }
    if (ALL_CURRENCY_MAP[cleanToken]) {
      return ALL_CURRENCY_MAP[cleanToken];
    }

    // 2. Lexical word dictionary (declensions, plural forms, slang)
    if (LEXICAL_CURRENCY_DICTIONARY[lowerToken]) {
      return LEXICAL_CURRENCY_DICTIONARY[lowerToken];
    }

    // 3. Fallback: check stripped symbol (e.g. '$' in '$90')
    const strippedSymbol = cleanToken.replace(/[^$€£¥₽₺₴₸₼₹₩₪¢]/g, '');
    if (strippedSymbol && ALL_CURRENCY_MAP[strippedSymbol]) {
      return ALL_CURRENCY_MAP[strippedSymbol];
    }

    return null;
  }
}

// ============================================================================
// 5. PARSING STRATEGIES (Chain of Responsibility)
// ============================================================================

/**
 * Strategy 1: Standard Numeric + Symbol/Code Parser (Regex Fast Path)
 * Handles: $100, 50.50 €, 1500 руб, 25k USD, 1.5 млн RUB, 0.05 BTC, 100000000 SAT
 */
class StandardRegexStrategy {
  parse(text) {
    const suffixRegex = /^([0-9\s.,]+)\s*((?:[KMBTКМБТ](?![A-Za-zА-Яа-яЁё])|тыс\.?|млн\.?|млрд\.?|трлн\.?))?\s*([$€£¥₽₺₴₸₼₹₩₪¢A-Za-zА-Яа-яЁё.\s]{1,25})$/i;
    const prefixRegex = /^([$€£¥₽₺₴₸₼₹₩₪¢A-Za-zА-Яа-яЁё.\s]{1,25})\s*([0-9\s.,]+)\s*((?:[KMBTКМБТ](?![A-Za-zА-Яа-яЁё])|тыс\.?|млн\.?|млрд\.?|трлн\.?))?$/i;

    let match = text.match(suffixRegex);
    let isSuffix = true;
    if (!match) {
      match = text.match(prefixRegex);
      isSuffix = false;
    }
    if (!match) return null;

    const originalMatchedCur = isSuffix ? match[3] : match[1];
    let numStr = isSuffix ? match[1] : match[2];
    let multStr = (isSuffix ? match[2] : match[3]) || "";
    let curStr = isSuffix ? match[3] : match[1];

    numStr = numStr.trim();
    curStr = curStr.trim().toUpperCase();
    multStr = multStr.trim().toLowerCase();

    if (curStr.endsWith('.') && curStr !== 'FR.') curStr = curStr.slice(0, -1);
    const cleanCurStr = curStr.replace(/[^A-ZА-ЯЁ$€£¥₽₺₴₸₼₹₩₪¢]/g, '');
    let isoCode = ALL_CURRENCY_MAP[cleanCurStr] || (Object.values(ALL_CURRENCY_MAP).includes(cleanCurStr) ? cleanCurStr : null);

    // Also check lexical dictionary if not matched directly
    if (!isoCode) {
      isoCode = LexicalCurrencyResolver.resolve(curStr);
    }
    if (!isoCode) return null;

    if (isoCode === 'RUB' && (cleanCurStr === 'Р' || cleanCurStr === 'P')) {
      if (!isSuffix) return null;
      const rawCur = originalMatchedCur.trim();
      if (rawCur === 'P' || rawCur === 'p') return null;
      const charBefore = text.charAt(text.length - originalMatchedCur.length - 1);
      if (!/[\s.,]/.test(charBefore)) return null;
    }

    if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.by') && isoCode === 'RUB' && curStr !== 'RUB') {
      isoCode = 'BYN';
    }

    let cleanNum = numStr.replace(/\s/g, '');
    let separators = cleanNum.match(/[.,]/g);
    let amount = 0;

    if (!separators) {
      amount = parseFloat(cleanNum);
    } else if (separators.length === 1) {
      let sep = separators[0];
      let parts = cleanNum.split(sep);
      if (parts[1].length === 3 && parts[0] !== '0' && parts[0] !== '-0' && !CRYPTO_CODES.includes(isoCode)) {
        amount = parseFloat(cleanNum.replace(sep, ''));
      } else {
        amount = parseFloat(cleanNum.replace(sep, '.'));
      }
    } else {
      let lastSepIdx = Math.max(cleanNum.lastIndexOf('.'), cleanNum.lastIndexOf(','));
      amount = parseFloat(cleanNum.substring(0, lastSepIdx).replace(/[.,]/g, '') + '.' + cleanNum.substring(lastSepIdx + 1));
    }

    if (isNaN(amount)) return null;

    multStr = multStr.replace('.', '');
    if (multStr === 'k' || multStr === 'тыс' || multStr === 'к' || multStr === 'т') amount *= 1000;
    else if (multStr === 'm' || multStr === 'млн' || multStr === 'м') amount *= 1000000;
    else if (multStr === 'b' || multStr === 'млрд' || multStr === 'б') amount *= 1000000000;
    else if (multStr === 't' || multStr === 'трлн') amount *= 1000000000000;

    if (!CRYPTO_CODES.includes(isoCode) && cleanCurStr === '¢') {
      amount *= 0.01;
    }

    const isSatVal = isoCode === 'SAT';
    if (isSatVal) amount *= 0.00000001;
    const finalCur = isSatVal ? 'BTC' : isoCode;

    return { amount, currency: finalCur, isSat: isSatVal };
  }
}

/**
 * Strategy 2: Lexical Verbal Expression Strategy
 * Handles: "90 тысяч долларов", "три тысячи евро", "five hundred bucks", "25 grand",
 * "сто пятьдесят баксов", "полтора миллиона рублей", "два с половиной миллиона долларов"
 */
class LexicalWordStrategy {
  parse(text) {
    const tokens = TextNormalizer.tokenize(text);
    if (tokens.length < 2) return null;

    let currencyCode = null;
    let currencyIndex = -1;

    // Scan for currency token either at end, beginning, or within 2 tokens from boundary
    // Check end first (most common: "90 тысяч долларов", "five hundred bucks")
    for (let i = tokens.length - 1; i >= 0; i--) {
      const code = LexicalCurrencyResolver.resolve(tokens[i]);
      if (code) {
        currencyCode = code;
        currencyIndex = i;
        break;
      }
    }

    // If not found at the end, check start (e.g., "долларов 500", "bucks 50")
    if (!currencyCode) {
      for (let i = 0; i < tokens.length; i++) {
        const code = LexicalCurrencyResolver.resolve(tokens[i]);
        if (code) {
          currencyCode = code;
          currencyIndex = i;
          break;
        }
      }
    }

    if (!currencyCode || currencyIndex === -1) return null;

    // Collect number words excluding the currency token
    const numberTokens = tokens.filter((_, idx) => idx !== currencyIndex);
    const amount = NumberWordsConverter.wordsToNumber(numberTokens);

    if (amount === null || isNaN(amount) || amount <= 0) return null;

    if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.by') && currencyCode === 'RUB' && !text.toUpperCase().includes('RUB')) {
      currencyCode = 'BYN';
    }

    const isSatVal = currencyCode === 'SAT';
    const finalAmount = isSatVal ? amount * 0.00000001 : amount;
    const finalCur = isSatVal ? 'BTC' : currencyCode;

    return { amount: finalAmount, currency: finalCur, isSat: isSatVal };
  }
}

// ============================================================================
// 6. CURRENCY PARSER FACADE (Chain of Responsibility Runner)
// ============================================================================

class CurrencyParser {
  static strategies = [
    new StandardRegexStrategy(),
    new LexicalWordStrategy()
  ];

  /**
   * Main entry point: parses text through pipeline and strategies.
   * @param {string} text
   * @returns {{ amount: number, currency: string, isSat?: boolean } | null}
   */
  static parse(text) {
    if (!text || typeof text !== 'string') return null;
    const sanitized = TextNormalizer.clean(text);
    if (!sanitized || sanitized.length > 80) return null;

    for (const strategy of CurrencyParser.strategies) {
      try {
        const result = strategy.parse(sanitized);
        if (result && !isNaN(result.amount) && result.currency) {
          return result;
        }
      } catch (e) {
        // Strategy failed, continue to next in chain
      }
    }

    return null;
  }
}

// Global exposure for browser extension contexts & Node.js environment
if (typeof window !== 'undefined') {
  window.SyncRateParser = CurrencyParser;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TextNormalizer,
    LexicalCurrencyResolver,
    NumberWordsConverter,
    StandardRegexStrategy,
    LexicalWordStrategy,
    CurrencyParser,
    parseCurrencyString: CurrencyParser.parse
  };
}
