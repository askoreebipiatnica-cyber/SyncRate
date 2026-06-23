const API_FIAT = "https://open.er-api.com/v6/latest/";
const CRYPTO_API = "https://min-api.cryptocompare.com/data/price?fsym=";
const CBRF_API = "https://www.cbr-xml-daily.ru/daily_json.js";
const NBU_API = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";
const NBRB_API = "https://api.nbrb.by/exrates/rates?periodicity=0";
const CRYPTO_CODES = ['BTC','ETH','USDT','BNB','SOL','XRP','USDC','ADA','AVAX','DOGE','DOT','TRX','LINK','MATIC','TON','SHIB','LTC','BCH','ATOM','XLM','NEAR','UNI','XMR','ETC','ICP','FIL','APT','LDO','ARB','VET','MKR','SAT','WAVES'];

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['trialStart'], (res) => {
        if (!res.trialStart) {
            chrome.storage.local.set({ trialStart: Date.now() });
        }
    });
    // Инициализируем системный будильник (срабатывает раз в час)
    chrome.alarms.create("cleanupCache", { periodInMinutes: 60 });
});

// Добавляем слушатель будильника
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "cleanupCache") {
        cleanExpiredCache();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_RATE") {
        getCrossRate(request.from, request.to, request.source)
            .then(res => sendResponse(res))
            .catch(() => sendResponse({ success: false }));
        return true; // Важно! Оставляем канал открытым
    }
    if (request.action === "GET_DASHBOARD") {
        Promise.all(request.bases.map(b => 
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

async function cleanExpiredCache() {
    try {
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
    try {
        const res = await fetch(CRYPTO_API + coin + "&tsyms=USD");
        const data = await res.json();
        if (data.USD) return parseFloat(data.USD);
        throw new Error();
    } catch (e) {
        throw e;
    }
}

async function getCrossRate(fromCode, targetCode, sourceCode) {
    if (fromCode === targetCode) return { success: true, rate: 1, date: "Live" };
    
    // Проверяем тип валюты до кэширования
    const isCrypto = CRYPTO_CODES.includes(fromCode) || CRYPTO_CODES.includes(targetCode);
    
    // Корректируем источник сразу, если это крипта (у нацбанков нет курсов крипты)
    if (isCrypto && sourceCode === 'official') {
        sourceCode = 'market';
    }

    const cacheKey = `v15_rate_${fromCode}_${targetCode}_${sourceCode}`;
    
    try {
        const cachedWrap = await chrome.storage.local.get([cacheKey]);
        const cachedItem = cachedWrap[cacheKey];
        const CACHE_TTL = isCrypto ? 60 * 1000 : (sourceCode === 'official' ? 12 * 60 * 60 * 1000 : 60 * 60 * 1000);

        if (cachedItem && cachedItem.timestamp && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
            return { success: true, rate: cachedItem.rate, date: cachedItem.date };
        }

        let finalRate = null, dateToReturn = "";

        if (sourceCode === 'official') {
            try {
                let targetUsdRate = null;
                let targetBankName = "";
                if (targetCode === 'RUB') {
                    const res = await fetch(CBRF_API);
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
                    const res = await fetch(NBU_API);
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
                    const res = await fetch(NBRB_API);
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
                    const res = await fetch(API_FIAT + "EUR");
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
                    if (isCrypto) {
                        finalRate = await getCryptoUsdPrice(fromCode) * targetUsdRate;
                    } else if (fromCode === 'USD') {
                        finalRate = targetUsdRate;
                    }
                }
                if (finalRate) {
                    dateToReturn = targetBankName;
                } else {
                    throw new Error("Official rate look up failed");
                }
            } catch (e) {
                sourceCode = 'market';
                return getCrossRate(fromCode, targetCode, 'market');
            }
        }
        
        if (!finalRate || sourceCode === 'market') {
            if (isCrypto) {
                const cryptoUsd = await getCryptoUsdPrice(fromCode);
                if (targetCode === 'USD') {
                    finalRate = cryptoUsd;
                    dateToReturn = "Live";
                } else {
                    const res = await fetch(API_FIAT + "USD");
                    const data = await res.json();
                    finalRate = cryptoUsd * data.rates[targetCode];
                    dateToReturn = "Live";
                }
            } else {
                const res = await fetch(API_FIAT + fromCode);
                const data = await res.json();
                finalRate = data.rates[targetCode];
                dateToReturn = "Live";
            }
        }
        
        if (finalRate) {
            await chrome.storage.local.set({
                [cacheKey]: { rate: finalRate, date: dateToReturn, timestamp: Date.now() }
            });
            return { success: true, rate: finalRate, date: dateToReturn };
        }
        throw new Error();
    } catch (error) {
        return { success: false };
    }
}
