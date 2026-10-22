const API_FIAT = "https://open.er-api.com/v6/latest/";
const CBRF_API = "https://www.cbr-xml-daily.ru/daily_json.js";
const NBU_API = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";
const NBRB_API = "https://api.nbrb.by/exrates/rates?periodicity=0";
const CRYPTO_CODES = ['BTC','ETH','USDT','BNB','SOL','XRP','USDC','ADA','AVAX','DOGE','DOT','TRX','LINK','MATIC','TON','SHIB','LTC','BCH','ATOM','XLM','NEAR','UNI','XMR','ETC','ICP','FIL','APT','LDO','ARB','VET','MKR','SAT','WAVES'];

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 5000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// Single consolidated onInstalled listener with crypto.randomUUID installId initialization
if (typeof chrome !== 'undefined' && chrome.runtime?.onInstalled) {
    chrome.runtime.onInstalled.addListener(async () => {
        try {
            if (chrome.alarms?.create) {
                chrome.alarms.create("cleanupCache", { periodInMinutes: 60 });
            }
            const stored = await chrome.storage.local.get(['installId']);
            if (!stored.installId) {
                const newInstallId = 'inst-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + '-' + Math.random().toString(36).substring(2)));
                await chrome.storage.local.set({ installId: newInstallId });
            }
        } catch (e) {}
    });
}

// Alarm listener for periodic cache cleanup
if (typeof chrome !== 'undefined' && chrome.alarms?.onAlarm) {
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm && alarm.name === "cleanupCache") {
            cleanExpiredCache();
        }
    });
}

// Runtime onStartup listener
if (typeof chrome !== 'undefined' && chrome.runtime?.onStartup) {
    chrome.runtime.onStartup.addListener(() => {
        cleanExpiredCache();
    });
}

// Runtime message listener for rate requests and iframe proxying
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (!request) return;

        if (request.action === "RENDER_IN_TOP_FRAME") {
            if (sender && sender.tab && sender.tab.id !== undefined && chrome.tabs?.sendMessage) {
                try {
                    chrome.tabs.sendMessage(sender.tab.id, request, { frameId: 0 })
                        .catch(() => {});
                } catch (e) {}
            }
            return;
        }

        if (request.action === "GET_RATE") {
            getCrossRate(request.from, request.to, request.source)
                .then(res => sendResponse(res))
                .catch(() => sendResponse({ success: false }));
            return true; // Keep message channel open for async response
        }

        if (request.action === "GET_DASHBOARD") {
            const bases = Array.isArray(request.bases) ? request.bases : [];
            Promise.all(bases.map(b => 
                getCrossRate(b, request.target, request.source)
                    .catch(() => ({ success: false }))
            )).then(results => {
                sendResponse({
                    success: true,
                    rates: results.map(r => r && r.success ? r.rate : null)
                });
            }).catch(() => sendResponse({ success: false, rates: [] }));
            return true;
        }
    });
}

async function cleanExpiredCache() {
    try {
        if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
        const all = await chrome.storage.local.get(null);
        const now = Date.now();
        const keysToDelete = [];
        for (const key in all) {
            if (key.startsWith("v15_rate_")) {
                const item = all[key];
                if (!item || !item.timestamp || (now - item.timestamp > 24 * 60 * 60 * 1000)) {
                    keysToDelete.push(key);
                }
            }
        }
        if (keysToDelete.length > 0) {
            await chrome.storage.local.remove(keysToDelete);
        }
    } catch (e) {}
}

async function getCryptoUsdPrice(coin) {
    // 1. Обработка Satoshi
    if (coin === 'SAT') {
        const btcPrice = await getCryptoUsdPrice('BTC');
        return btcPrice * 0.00000001;
    }

    // 2. Основной источник: Coinbase ("BTC-USD")
    try {
        const res = await fetchWithTimeout("https://api.coinbase.com/v2/prices/" + coin + "-USD/spot", { timeout: 2500 });
        if (!res.ok) throw new Error("Coinbase failed for " + coin);
        const data = await res.json();
        return parseFloat(data.data.amount);
    } catch (e) {
        // Fallback to Binance
    }

    // 3. Первый резерв: Binance ("BTCUSDT")
    try {
        const res = await fetchWithTimeout("https://api.binance.com/api/v3/ticker/price?symbol=" + coin + "USDT", { timeout: 2500 });
        if (!res.ok) throw new Error("Binance failed for " + coin);
        const data = await res.json();
        return parseFloat(data.price);
    } catch (e) {
        // Fallback to MEXC
    }

    // 4. Второй резерв: MEXC ("BTCUSDT")
    try {
        const res = await fetchWithTimeout("https://api.mexc.com/api/v3/ticker/price?symbol=" + coin + "USDT", { timeout: 2500 });
        if (!res.ok) throw new Error("MEXC failed for " + coin);
        const data = await res.json();
        return parseFloat(data.price);
    } catch (e) {
        throw new Error("All crypto API fallbacks failed for " + coin);
    }
}

const _rateInflight = {};

async function getCrossRate(fromCode, targetCode, sourceCode) {
    if (fromCode === targetCode) return { success: true, rate: 1, date: "Live" };
    
    const isFromCrypto = CRYPTO_CODES.includes(fromCode);
    const isTargetCrypto = CRYPTO_CODES.includes(targetCode);
    const isCrypto = isFromCrypto || isTargetCrypto;
    
    // Official National Banks have no crypto rates; automatically route to market
    if (isCrypto && sourceCode === 'official') {
        sourceCode = 'market';
    }

    const cacheKey = `v15_rate_${fromCode}_${targetCode}_${sourceCode}`;
    
    if (_rateInflight[cacheKey]) {
        return _rateInflight[cacheKey];
    }

    const promise = (async () => {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                const cachedWrap = await chrome.storage.local.get([cacheKey]);
                const cachedItem = cachedWrap ? cachedWrap[cacheKey] : null;
                const CACHE_TTL = isCrypto ? 60 * 1000 : (sourceCode === 'official' ? 12 * 60 * 60 * 1000 : 60 * 60 * 1000);

                if (cachedItem && cachedItem.timestamp && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
                    return { success: true, rate: cachedItem.rate, date: cachedItem.date };
                }
            }

            let finalRate = null;
            let dateToReturn = "";

            if (sourceCode === 'official') {
                try {
                    let targetUsdRate = null;
                    let targetBankName = "";
                    if (targetCode === 'RUB') {
                        const res = await fetchWithTimeout(CBRF_API);
                        const data = await res.json();
                        if (data.Valute) {
                            targetBankName = "ЦБ РФ";
                            const getRateInRUB = (code) => {
                                if (code === 'RUB') return 1;
                                const entry = data.Valute[code];
                                return entry ? parseFloat(entry.Value) / parseInt(entry.Nominal || 1, 10) : null;
                            };
                            const rFrom = getRateInRUB(fromCode);
                            const rTarget = getRateInRUB(targetCode);
                            if (rFrom !== null && rTarget !== null) {
                                finalRate = rFrom / rTarget;
                            } else if (data.Valute['USD']) {
                                targetUsdRate = parseFloat(data.Valute['USD'].Value);
                            }
                        }
                    } else if (targetCode === 'UAH') {
                        const res = await fetchWithTimeout(NBU_API);
                        const data = await res.json();
                        targetBankName = "НБУ";
                        const getRateInUAH = (code) => {
                            if (code === 'UAH') return 1;
                            const entry = data.find(c => c.cc === code);
                            return entry ? parseFloat(entry.rate) : null;
                        };
                        const rFrom = getRateInUAH(fromCode);
                        const rTarget = getRateInUAH(targetCode);
                        if (rFrom !== null && rTarget !== null) {
                            finalRate = rFrom / rTarget;
                        } else {
                            const usd = data.find(c => c.cc === 'USD');
                            if (usd) targetUsdRate = parseFloat(usd.rate);
                        }
                    } else if (targetCode === 'BYN') {
                        const res = await fetchWithTimeout(NBRB_API);
                        const data = await res.json();
                        targetBankName = "НБРБ";
                        const getRateInBYN = (code) => {
                            if (code === 'BYN') return 1;
                            const entry = data.find(c => c.Cur_Abbreviation === code);
                            return entry ? parseFloat(entry.Cur_OfficialRate) / parseFloat(entry.Cur_Scale || 1) : null;
                        };
                        const rFrom = getRateInBYN(fromCode);
                        const rTarget = getRateInBYN(targetCode);
                        if (rFrom !== null && rTarget !== null) {
                            finalRate = rFrom / rTarget;
                        } else {
                            const usdObj = data.find(c => c.Cur_Abbreviation === 'USD');
                            if (usdObj) targetUsdRate = parseFloat(usdObj.Cur_OfficialRate) / parseFloat(usdObj.Cur_Scale || 1);
                        }
                    } else if (targetCode === 'EUR') {
                        const res = await fetchWithTimeout(API_FIAT + "EUR");
                        const data = await res.json();
                        if (data.rates) {
                            targetBankName = "ECB";
                            const rFrom = fromCode === 'EUR' ? 1 : (data.rates[fromCode] ? 1 / data.rates[fromCode] : null);
                            const rTarget = targetCode === 'EUR' ? 1 : (data.rates[targetCode] ? 1 / data.rates[targetCode] : null);
                            if (rFrom !== null && rTarget !== null) {
                                finalRate = rFrom / rTarget;
                            } else if (data.rates['USD']) {
                                targetUsdRate = 1 / data.rates['USD'];
                            }
                        }
                    }

                    if (!finalRate && targetUsdRate) {
                        if (fromCode === 'USD') {
                            finalRate = targetUsdRate;
                        }
                    }

                    if (finalRate) {
                        dateToReturn = targetBankName;
                    } else {
                        throw new Error("Official rate look up failed");
                    }
                } catch (e) {
                    const fallbackResult = await getCrossRate(fromCode, targetCode, 'market');
                    // Persist fallback (market) rate into cache so subsequent 'official' requests reuse it
                    if (fallbackResult && fallbackResult.success) {
                        try {
                            if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                                await chrome.storage.local.set({
                                    [cacheKey]: { rate: fallbackResult.rate, date: fallbackResult.date, timestamp: Date.now() }
                                });
                            }
                        } catch (storageErr) {}
                    }
                    return { ...fallbackResult, fallback: true };
                }
            }
            
            // Market Source (Handles all 4 combinations: Crypto<->Crypto, Crypto->Fiat, Fiat->Crypto, Fiat<->Fiat)
            if (!finalRate || sourceCode === 'market') {
                if (isFromCrypto && isTargetCrypto) {
                    // Scenario A: Crypto -> Crypto
                    const [fromUsd, targetUsd] = await Promise.all([
                        getCryptoUsdPrice(fromCode),
                        getCryptoUsdPrice(targetCode)
                    ]);
                    finalRate = fromUsd / targetUsd;
                    dateToReturn = "Live";
                } else if (isFromCrypto && !isTargetCrypto) {
                    // Scenario B: Crypto -> Fiat
                    const cryptoUsd = await getCryptoUsdPrice(fromCode);
                    if (targetCode === 'USD') {
                        finalRate = cryptoUsd;
                        dateToReturn = "Live";
                    } else {
                        const res = await fetchWithTimeout(API_FIAT + "USD");
                        const data = await res.json();
                        finalRate = cryptoUsd * data.rates[targetCode];
                        dateToReturn = "Live";
                    }
                } else if (!isFromCrypto && isTargetCrypto) {
                    // Scenario C: Fiat -> Crypto
                    const targetCryptoUsd = await getCryptoUsdPrice(targetCode);
                    if (fromCode === 'USD') {
                        finalRate = 1 / targetCryptoUsd;
                        dateToReturn = "Live";
                    } else {
                        const res = await fetchWithTimeout(API_FIAT + fromCode);
                        const data = await res.json();
                        const fiatToUsd = data.rates['USD'];
                        finalRate = fiatToUsd / targetCryptoUsd;
                        dateToReturn = "Live";
                    }
                } else {
                    // Scenario D: Fiat -> Fiat
                    const res = await fetchWithTimeout(API_FIAT + fromCode);
                    const data = await res.json();
                    finalRate = data.rates[targetCode];
                    dateToReturn = "Live";
                }
            }
            
            if (finalRate) {
                if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                    await chrome.storage.local.set({
                        [cacheKey]: { rate: finalRate, date: dateToReturn, timestamp: Date.now() }
                    });
                }
                return { success: true, rate: finalRate, date: dateToReturn };
            }
            throw new Error("Unable to determine rate");
        } catch (error) {
            return { success: false };
        }
    })().finally(() => {
        delete _rateInflight[cacheKey];
    });

    _rateInflight[cacheKey] = promise;
    return promise;
}

if (typeof globalThis !== 'undefined') {
    globalThis.getCrossRate = getCrossRate;
    globalThis.getCryptoUsdPrice = getCryptoUsdPrice;
}
if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
    module.exports = { getCrossRate, getCryptoUsdPrice };
}
