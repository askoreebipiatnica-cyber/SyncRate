/**
 * SyncRate Enterprise - Services Module
 * Module-like services for GeoLocation, Currency mapping, and Settings management.
 */

const GeoLocationService = {
    // List of reliable free API providers for geolocating by IP
    providers: [
        {
            url: "https://freeipapi.com/api/json",
            parse: (data) => data.countryCode
        },
        {
            url: "https://ipwho.is/",
            parse: (data) => data.success ? data.country_code : null
        },
        {
            url: "https://ipapi.co/json/",
            parse: (data) => data.country_code
        }
    ],

    async detectCountry() {
        console.log("[GeoLocationService] Detecting country from public IP...");
        for (const provider of this.providers) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const res = await fetch(provider.url, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (res.ok) {
                    const data = await res.json();
                    const countryCode = provider.parse(data);
                    if (countryCode && countryCode.length === 2) {
                        const upperCountry = countryCode.toUpperCase();
                        console.log(`[GeoLocationService] Successfully detected country: ${upperCountry} via ${provider.url}`);
                        return upperCountry;
                    }
                }
            } catch (err) {
                console.warn(`[GeoLocationService] Provider ${provider.url} failed:`, err);
            }
        }
        console.warn("[GeoLocationService] All geolocation providers failed.");
        return null;
    }
};

const CurrencyService = {
    // Country code (ISO 3166-1 alpha-2) to official national currency mapping
    countryToCurrencyMap: {
        // European Union Euro zone countries
        'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'AT': 'EUR', 'BE': 'EUR',
        'CY': 'EUR', 'EE': 'EUR', 'FI': 'EUR', 'GR': 'EUR', 'IE': 'EUR', 'LV': 'EUR',
        'LT': 'EUR', 'LU': 'EUR', 'MT': 'EUR', 'NL': 'EUR', 'PT': 'EUR', 'SK': 'EUR',
        'SI': 'EUR', 'HR': 'EUR',
        
        // Major international currencies
        'GB': 'GBP',
        'US': 'USD',
        'CA': 'CAD',
        'JP': 'JPY',
        'AU': 'AUD',
        'PL': 'PLN',
        'CZ': 'CZK',
        
        // CIS and Middle East
        'RU': 'RUB',
        'KZ': 'KZT',
        'UA': 'UAH',
        'BY': 'BYN',
        'CN': 'CNY',
        'TR': 'TRY',
        'AE': 'AED'
    },

    getCurrencyForCountry(countryCode) {
        if (!countryCode) return 'USD';
        const upperCode = countryCode.toUpperCase();
        return this.countryToCurrencyMap[upperCode] || 'USD';
    }
};

const SettingsService = {
    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get({
                lang: 'auto',
                targetCurrency: 'RUB',
                currencyMode: 'auto', // 'auto' or 'manual'
                detectedCountryCode: null,
                rateSource: 'market',
                dashboardBases: ['USD', 'EUR', 'RUB', 'GBP'],
                theme: 'dark'
            }, resolve);
        });
    },

    async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.local.set(settings, resolve);
        });
    },

    async initializeDefaultCurrencyIfNeeded(force = false) {
        const settings = await this.getSettings();
        
        // Skip if already initialized and not forced
        if (!force && settings.detectedCountryCode && settings.currencyMode === 'manual') {
            return {
                countryCode: settings.detectedCountryCode,
                currency: settings.targetCurrency
            };
        }

        // Only run auto-detection if forced, or if mode is auto, or if no country is detected yet
        if (force || settings.currencyMode === 'auto' || !settings.detectedCountryCode) {
            const countryCode = await GeoLocationService.detectCountry();
            if (countryCode) {
                const currency = CurrencyService.getCurrencyForCountry(countryCode);
                const updated = {
                    detectedCountryCode: countryCode
                };
                
                // If user is in auto mode or hasn't had country set yet, update the currency
                if (settings.currencyMode === 'auto' || !settings.detectedCountryCode) {
                    updated.targetCurrency = currency;
                }
                
                await this.saveSettings(updated);
                console.log(`[SettingsService] Auto-applied settings: Country=${countryCode}, Currency=${currency}`);
                return { countryCode, currency };
            } else {
                // Geo failed, but we want a fallback country code to prevent loop
                if (!settings.detectedCountryCode) {
                    await this.saveSettings({
                        detectedCountryCode: 'UNKNOWN',
                        targetCurrency: 'USD'
                    });
                }
            }
        }
        return {
            countryCode: settings.detectedCountryCode || 'UNKNOWN',
            currency: settings.targetCurrency
        };
    }
};
