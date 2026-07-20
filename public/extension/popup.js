const CONFIG = {
    API_BASE_URL: 'https://ais-pre-msjrecxeaytix2n65pvx6i-307655937505.us-west2.run.app',
    VERSION: '15.0'
};
const API_URL = CONFIG.API_BASE_URL;
const DICT={'ru':{opt_auto:'Авто (Браузер)',lbl_lang:'Язык интерфейса',tab_rates:'Курсы',tab_settings:'Настройки',tab_plans:'Тарифы',your_currency:'Ваша валюта:',lbl_target:'Целевая валюта',lbl_source:'Источник курса',lbl_dash:'Валюты дашборда',btn_save:'Сохранить настройки',btn_pay:'💳 Оплатить доступ',tier_basic:'Базовая',lifetime:'(навсегда)',desc_basic:'Только USD. 2 слота в дашборде.',desc_pro:'8 валют (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слота. Темная тема.',desc_pro_plus:'160+ валют, Нацбанки (СНГ, ЕС), Топ-30 Крипты. Безлимитные слоты.',trial_left:'🎁 PRO+ Trial активен. Осталось часов: ',opt_market:'🌐 Рыночный (Биржи)',opt_official:'🏛 Официальный Нацбанк',opt_fiat:'🌍 Фиатные',opt_crypto:'🪙 Крипта',cur_rub:'🇷🇺 Российский рубль (RUB)',cur_eur:'🇪🇺 Евро (EUR)',cur_usd:'🇺🇸 Доллар США (USD)',cur_cny:'🇨🇳 Китайский юань (CNY)',cur_kzt:'🇰🇿 Казахский тенге (KZT)',cur_uah:'🇺🇦 Украинская гривна (UAH)',cur_byn:'🇧🇾 Белорусский рубль (BYN)',cur_gbp:'🇬🇧 Британский фунт (GBP)',cur_try:'🇹🇷 Турецкая лира (TRY)',cur_chf:'🇨🇭 Швейцарский франк (CHF)',cur_jpy:'🇯🇵 Японская иена (JPY)',cur_cad:'🇨🇦 Канадский доллар (CAD)',cur_aed:'🇦🇪 Дирхам ОАЭ (AED)',update_info:'Для обновления скачайте новую версию на сайте.',check_updates:'Проверить обновления',ready:'Готово!'},'uk':{opt_auto:'Авто (Браузер)',lbl_lang:'Мова інтерфейсу',tab_rates:'Курси',tab_settings:'Налаштування',tab_plans:'Тарифи',your_currency:'Ваша валюта:',lbl_target:'Цільова валюта',lbl_source:'Джерело курсу',lbl_dash:'Валюти дашборду',btn_save:'Зберегти налаштування',btn_pay:'💳 Оплатити доступ',tier_basic:'Базова',lifetime:'(назавжди)',desc_basic:'Тільки USD. 2 слоти в дашборді.',desc_pro:'8 валют (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слоти. Темна тема.',desc_pro_plus:'160+ валют, Нацбанки (СНД, ЄС), Топ-30 Крипти. Безлімітні слоти.',trial_left:'🎁 PRO+ Trial активний. Залишилося годин: ',opt_market:'🌐 Ринковий (Біржі)',opt_official:'🏛 Офіційний Нацбанк',opt_fiat:'🌍 Фіатні',opt_crypto:'🪙 Крипта',cur_rub:'🇷🇺 Російський рубль (RUB)',cur_eur:'🇪🇺 Євро (EUR)',cur_usd:'🇺🇸 Доллар США (USD)',cur_cny:'🇨🇳 Китайський юань (CNY)',cur_kzt:'🇰🇿 Казахський тенге (KZT)',cur_uah:'🇺🇦 Українська гривня (UAH)',cur_byn:'🇧🇾 Білоруський рубль (BYN)',cur_gbp:'🇬🇧 Британський фунт (GBP)',cur_try:'🇹🇷 Турецька ліра (TRY)',cur_chf:'🇨🇭 Швейцарський франк (CHF)',cur_jpy:'🇯🇵 Японська єна (JPY)',cur_cad:'🇨🇦 Канадський долар (CAD)',cur_aed:'🇦🇪 Дірхам ОАЕ (AED)',update_info:'Для оновлення скачайте нову версію на сайті.',check_updates:'Перевірити оновлення',ready:'Готово!'},'kk':{opt_auto:'Авто (Браузер)',lbl_lang:'Интерфейс тілі',tab_rates:'Бағамдар',tab_settings:'Параметрлер',tab_plans:'Тарифтер',your_currency:'Сіздің валютаңыз:',lbl_target:'Мақсатты валюта',lbl_source:'Курс көзі',lbl_dash:'Дашборд валюталары',btn_save:'Сақтау',btn_pay:'💳 Төлеу',tier_basic:'Негізгі',lifetime:'(мәңгілікке)',desc_basic:'Тек USD. Дашбордта 2 слот.',desc_pro:'8 валюта (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слот. Қараңғы тақырып.',desc_pro_plus:'160+ валюта, Ұлттық банктер (ТМД, ЕО), Топ-30 Крипто. Шексіз слоттар.',trial_left:'🎁 PRO+ Trial белсенді. Қалған сағат: ',opt_market:'🌐 Нарықтық (Биржалар)',opt_official:'🏛 Ресми Ұлттық банк',opt_fiat:'🌍 Фиат',opt_crypto:'🪙 Криптовалюта',cur_rub:'🇷🇺 Ресей рублі (RUB)',cur_eur:'🇪🇺 Еуро (EUR)',cur_usd:'🇺🇸 АҚШ доллары (USD)',cur_cny:'🇨🇳 Қытай юані (CNY)',cur_kzt:'🇰🇿 Қазақстан теңгесі (KZT)',cur_uah:'🇺🇦 Украин гривнасы (UAH)',cur_byn:'🇧🇾 Беларусь рублі (BYN)',cur_gbp:'🇬🇧 Британ фунты (GBP)',cur_try:'🇹🇷 Түрік лирасы (TRY)',cur_chf:'🇨🇭 Швейцария франкі (CHF)',cur_jpy:'🇯🇵 Жапон иенасы (JPY)',cur_cad:'🇨🇦 Канада доллары (CAD)',cur_aed:'🇦🇪 БАӘ дирхамы (AED)',update_info:'Жаңарту үшін сайттан жаңа нұсқаны жүктеп алыңыз.',check_updates:'Жаңартуларды тексеру',ready:'Дайын!'},'en':{opt_auto:'Auto (Browser)',lbl_lang:'Language',tab_rates:'Rates',tab_settings:'Settings',tab_plans:'Plans',your_currency:'Your Currency:',lbl_target:'Target Currency',lbl_source:'Rate Source',lbl_dash:'Dashboard Currencies',btn_save:'Save Settings',btn_pay:'💳 Pay for Lifetime',tier_basic:'Basic',lifetime:'(lifetime)',desc_basic:'Only USD. 2 dashboard slots.',desc_pro:'8 currencies (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 slots. Dark mode.',desc_pro_plus:'160+ fiats, National Banks (CIS, EU), Top-30 Crypto. Unlimited slots.',trial_left:'🎁 PRO+ Trial active. Hours left: ',opt_market:'🌐 Market (Live)',opt_official:'🏛 Official National Bank',opt_fiat:'🌍 Fiat Currencies',opt_crypto:'🪙 Crypto',cur_rub:'🇷🇺 Russian Ruble (RUB)',cur_eur:'🇪🇺 Euro (EUR)',cur_usd:'🇺🇸 US Dollar (USD)',cur_cny:'🇨🇳 Chinese Yuan (CNY)',cur_kzt:'🇰🇿 Kazakh Tenge (KZT)',cur_uah:'🇺🇦 Ukrainian Hryvnia (UAH)',cur_byn:'🇧🇾 Belarusian Ruble (BYN)',cur_gbp:'🇬🇧 British Pound (GBP)',cur_try:'🇹🇷 Turkish Lira (TRY)',cur_chf:'🇨🇭 Swiss Franc (CHF)',cur_jpy:'🇯🇵 Japanese Yen (JPY)',cur_cad:'🇨🇦 Canadian Dollar (CAD)',cur_aed:'🇦🇪 UAE Dirham (AED)',update_info:'To update, download the new version from the website.',check_updates:'Check for Updates',ready:'Ready!'},'zh':{opt_auto:'自动 (浏览器)',lbl_lang:'语言 / Language',tab_rates:'汇率',tab_settings:'设置',tab_plans:'计划',your_currency:'您的货币:',lbl_target:'目标货币',lbl_source:'汇率来源',lbl_dash:'仪表板货币',btn_save:'保存设置',btn_pay:'💳 终身购买',tier_basic:'基础版',lifetime:'(终身)',desc_basic:'仅支持 USD. 2个槽位。',desc_pro:'8 种货币 (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED)。4 个插槽。深色模式。',desc_pro_plus:'160+ 法定货币，国家银行（独联体，欧盟），前30名加密货币。无限插槽。',trial_left:'🎁 PRO+ 试用期生效。剩余小时：',opt_market:'🌐 市场 (外汇)',opt_official:'🏛 官方国家银行',opt_fiat:'🌍 法定货币 (Fiat)',opt_crypto:'🪙 加密货币 (Crypto)',cur_rub:'🇷🇺 俄罗斯卢布 (RUB)',cur_eur:'🇪🇺 欧元 (EUR)',cur_usd:'🇺🇸 美元 (USD)',cur_cny:'🇨🇳 人民币 (CNY)',cur_kzt:'🇰🇿 哈萨克斯坦坚戈 (KZT)',cur_uah:'🇺🇦 乌克兰格里夫纳 (UAH)',cur_byn:'🇧🇾 白俄罗斯卢布 (BYN)',cur_gbp:'🇬🇧 英镑 (GBP)',cur_try:'🇹🇷 土耳其里ла (TRY)',cur_chf:'🇨🇭 瑞士法郎 (CHF)',cur_jpy:'🇯🇵 日元 (JPY)',cur_cad:'🇨🇦 加拿大元 (CAD)',cur_aed:'🇦🇪 阿联酋迪拉姆 (AED)',update_info:'要更新，请从网站下载新版本。',check_updates:'检查更新',ready:'完成！'},'de':{opt_auto:'Auto (Browser)',lbl_lang:'Sprache / Language',tab_rates:'Kurse',tab_settings:'Einstell.',tab_plans:'Tarife',your_currency:'Ihre Währung:',lbl_target:'Zielwährung',lbl_source:'Kursquelle',lbl_dash:'Dashboard-Währungen',btn_save:'Speichern',btn_pay:'💳 Für immer bezahlen',tier_basic:'Basis',lifetime:'(lebenslang)',desc_basic:'Konvertierung nur aus USD.',desc_pro:'8 Währungen (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 Slots. Dunkelmodus.',desc_pro_plus:'160+ Fiats, Nationalbanken (GUS, EU), Top-30 Krypto. Unbegrenzte Slots.',trial_left:'🎁 PRO+ Trial aktiv. Stunden: ',opt_market:'🌐 Markt (Forex)',opt_official:'🏛 Offizielle Nationalbank',opt_fiat:'🌍 Fiat',opt_crypto:'🪙 Krypto',cur_rub:'🇷🇺 Russischer Rubel (RUB)',cur_eur:'🇪🇺 Euro (EUR)',cur_usd:'🇺🇸 US-Dollar (USD)',cur_cny:'🇨🇳 Chinesischer Yuan (CNY)',cur_kzt:'🇰🇿 Kasachischer Tenge (KZT)',cur_uah:'🇺🇦 Ukrainische Hrywnja (UAH)',cur_byn:'🇧🇾 Weißrussischer Rubel (BYN)',cur_gbp:'🇬🇧 Britisches Pfund (GBP)',cur_try:'🇹🇷 Türkische Lira (TRY)',cur_chf:'🇨🇭 Schweizer Franken (CHF)',cur_jpy:'🇯🇵 Japanischer Yen (JPY)',cur_cad:'🇨🇦 Kanadischer Dollar (CAD)',cur_aed:'🇦🇪 VAE-Dirham (AED)',update_info:'Zum Aktualisieren laden Sie die neue Version von der Website herunter.',check_updates:'Auf Updates prüfen',ready:'Fertig!'},'es':{opt_auto:'Auto (Navegador)',lbl_lang:'Idioma / Language',tab_rates:'Tasas',tab_settings:'Ajustes',tab_plans:'Planes',your_currency:'Tu moneda:',lbl_target:'Moneda objetivo',lbl_source:'Fuente de la tasa',lbl_dash:'Monedas del panel',btn_save:'Guardar ajustes',btn_pay:'💳 Pagar de por vida',tier_basic:'Básico',lifetime:'(de por vida)',desc_basic:'Solo desde USD. 2 monedas.',desc_pro:'8 monedas (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 ranuras. Modo oscuro.',desc_pro_plus:'160+ fiats, Bancos Nacionales (GUS, UE), Top-30 Cripto. Ranuras ilimitadas.',trial_left:'🎁 Prueba PRO+ activa. Horas: ',opt_market:'🌐 Mercado (Bolsas)',opt_official:'🏛 Banco Nacional Oficial',opt_fiat:'🌍 Fiat',opt_crypto:'🪙 Cripto',cur_rub:'🇷🇺 Rublo ruso (RUB)',cur_eur:'🇪🇺 Euro (EUR)',cur_usd:'🇺🇸 Dólar (USD)',cur_cny:'🇨🇳 Yuan chino (CNY)',cur_kzt:'🇰🇿 Tenge kazajo (KZT)',cur_uah:'🇺🇦 Grivna ucraniana (UAH)',cur_byn:'🇧🇾 Rublo bielorruso (BYN)',cur_gbp:'🇬🇧 Libra británica (GBP)',cur_try:'🇹🇷 Lira turca (TRY)',cur_chf:'🇨🇭 Franco suizo (CHF)',cur_jpy:'🇯🇵 Yen japonés (JPY)',cur_cad:'🇨🇦 Dólar canadiense (CAD)',cur_aed:'🇦🇪 Dirham de los EAU (AED)',update_info:'Para actualizar, descargue la nueva versión desde el sitio web.',check_updates:'Buscar actualizaciones',ready:'¡Listo!'}};
const FIAT_CURRENCIES=['USD','EUR','GBP','CHF','JPY','CNY','CAD','AED','TRY','RUB','KZT','UAH','BYN'];
const CRYPTO_CURRENCIES=['BTC','ETH','USDT','SOL','BNB','XRP','ADA','DOGE','DOT','MATIC','SHIB','LTC'];
const BANK_NAMES={'RUB':'ЦБ РФ','UAH':'НБУ','BYN':'НБРБ','EUR':'ECB'};
document.addEventListener('DOMContentLoaded', async () => {
    const state = await chrome.storage.local.get({
        lang: 'auto',
        targetCurrency: 'RUB',
        rateSource: 'market',
        dashboardBases: ['USD', 'EUR', 'RUB', 'GBP'],
        theme: 'dark',
        licenseKey: '',
        sessionToken: '',
        installId: ''
    });

    if (!state.installId) {
        state.installId = 'inst-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await chrome.storage.local.set({ installId: state.installId });
    }

    function getTierFromToken(token) {
        return 'pro_plus';
    }

    state.appTier = 'pro_plus';

    let currentLang = state.lang === 'auto' ? (navigator.language.split('-')[0] || 'en') : state.lang;
    if (currentLang === 'ua') currentLang = 'uk';
    if (!DICT[currentLang]) currentLang = 'en';

    const i18n = (key) => DICT[currentLang][key] || key;

    // UI Elements
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    const themeBtn = document.getElementById('theme-btn');
    const themeIcon = document.getElementById('theme-icon');
    const langSel = document.getElementById('sel-lang');
    const targetSel = document.getElementById('sel-target');
    const sourceSel = document.getElementById('sel-source');
    const dashSels = [
        document.getElementById('dash-1'),
        document.getElementById('dash-2'),
        document.getElementById('dash-3'),
        document.getElementById('dash-4')
    ];
    const saveBtn = document.getElementById('btn-save-settings');
    const upgradeBtn = document.getElementById('btn-upgrade');
    const dashGrid = document.getElementById('dashboard-grid');
    const targetLbl = document.getElementById('lbl-target-currency');
    const trialBanner = document.getElementById('trial-banner');

    // Apply Theme
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        themeIcon.innerHTML = theme === 'dark' 
            ? '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>'
            : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    };
    applyTheme(state.theme);

    // Translate UI
    const translateUI = () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = i18n(el.getAttribute('data-i18n'));
        });
        targetLbl.textContent = state.targetCurrency;
        
        const lblLicense = document.querySelector('[data-i18n="lbl_license"]');
        const btnActivate = document.querySelector('[data-i18n="btn_activate"]');
        if (lblLicense) {
            const licenseLabels = {
                ru: 'Лицензионный ключ',
                uk: 'Ліцензійний ключ',
                kk: 'Лицензиялық кілт',
                en: 'License Key',
                de: 'Lizenzschlüssel',
                es: 'Clave de licencia',
                zh: '授权密钥'
            };
            lblLicense.textContent = licenseLabels[currentLang] || licenseLabels['en'];
        }
        if (btnActivate) {
            const activateBtns = {
                ru: 'Активировать',
                uk: 'Активувати',
                kk: 'Белсендіру',
                en: 'Activate',
                de: 'Aktivieren',
                es: 'Activar',
                zh: '激活'
            };
            btnActivate.textContent = activateBtns[currentLang] || activateBtns['en'];
        }
    };
    translateUI();

    // Populate Selects
    const populateCurrencies = (select, selected) => {
        select.innerHTML = '';
        const fg = document.createElement('optgroup');
        fg.label = i18n('opt_fiat');
        FIAT_CURRENCIES.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = i18n('cur_' + c.toLowerCase()) || c;
            if (c === selected) opt.selected = true;
            fg.appendChild(opt);
        });
        select.appendChild(fg);

        const cg = document.createElement('optgroup');
        cg.label = i18n('opt_crypto');
        CRYPTO_CURRENCIES.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            if (c === selected) opt.selected = true;
            cg.appendChild(opt);
        });
        select.appendChild(cg);
    };

    langSel.value = state.lang;
    targetSel.value = state.targetCurrency;
    sourceSel.value = state.rateSource;
    dashSels.forEach((sel, i) => populateCurrencies(sel, state.dashboardBases[i]));

    // Check Trial
    const isTrialActive = false; // trial теперь в JWT, не в trialStart
    let activeTier = state.appTier; // tier уже декодирован из токена выше

    const updateDashboardSels = (tier) => {
        if (tier === 'basic') {
            dashSels[2].disabled = true;
            dashSels[3].disabled = true;
            dashSels[2].style.opacity = '0.5';
            dashSels[3].style.opacity = '0.5';
        } else {
            dashSels[2].disabled = false;
            dashSels[3].disabled = false;
            dashSels[2].style.opacity = '1';
            dashSels[3].style.opacity = '1';
        }
    };
    updateDashboardSels(activeTier);

    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // Theme Toggle
    themeBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        chrome.storage.local.set({ theme: newTheme });
    });

    // Save Settings
    saveBtn.addEventListener('click', () => {
        const newSettings = {
            lang: langSel.value,
            targetCurrency: targetSel.value,
            rateSource: sourceSel.value,
            dashboardBases: dashSels.map(s => s.value)
        };
        chrome.storage.local.set(newSettings, () => {
            saveBtn.textContent = i18n('ready');
            setTimeout(() => {
                saveBtn.textContent = i18n('btn_save');
                state.lang = newSettings.lang;
                state.targetCurrency = newSettings.targetCurrency;
                state.rateSource = newSettings.rateSource;
                state.dashboardBases = newSettings.dashboardBases;

                currentLang = state.lang === 'auto' ? (navigator.language.split('-')[0] || 'en') : state.lang;
                if (currentLang === 'ua') currentLang = 'uk';
                if (!DICT[currentLang]) currentLang = 'en';

                translateUI();
                dashSels.forEach((sel, i) => populateCurrencies(sel, state.dashboardBases[i]));
                updateDashboardSels(activeTier);
                loadDashboard();
            }, 1000);
        });
    });

    // Load Dashboard
    const loadDashboard = async () => {
        dashGrid.textContent = '';
        const loader = document.createElement('div');
        loader.style.cssText = 'grid-column: span 2; text-align: center; padding: 20px; opacity: 0.5;';
        loader.textContent = '...';
        dashGrid.appendChild(loader);
        try {
            const res = await chrome.runtime.sendMessage({
                action: "GET_DASHBOARD",
                bases: state.dashboardBases,
                target: state.targetCurrency,
                source: state.rateSource
            });
            if (res && res.success) {
                dashGrid.textContent = '';
                const maxSlots = activeTier === 'basic' ? 2 : 4;
                state.dashboardBases.slice(0, maxSlots).forEach((base, i) => {
                    const rate = res.rates[i];
                    const card = document.createElement('div');
                    card.className = 'dash-card';
                    const formatted = rate ? (rate < 0.01 ? rate.toFixed(6) : rate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})) : '---';
                    
                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'dash-card-title';
                    titleDiv.textContent = base + " / " + state.targetCurrency;
                    
                    const valueDiv = document.createElement('div');
                    valueDiv.className = 'dash-card-value';
                    valueDiv.textContent = formatted;
                    
                    card.appendChild(titleDiv);
                    card.appendChild(valueDiv);
                    dashGrid.appendChild(card);
                });
            }
        } catch (e) {
            dashGrid.textContent = '';
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'grid-column: span 2; text-align: center; padding: 20px; color: #ef4444;';
            errorDiv.textContent = 'Error';
            dashGrid.appendChild(errorDiv);
        }
    };
    loadDashboard();

    // All features are unlocked in this open source edition
    const feedbackBtn = document.getElementById('feedback-btn');
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: API_URL + '/feedback?v=' + encodeURIComponent(CONFIG.VERSION) + '&tier=' + encodeURIComponent(activeTier) + '&installId=' + encodeURIComponent(state.installId) });
        });
    }

    document.getElementById('update-link').addEventListener('click', async (e) => {
        e.preventDefault();
        const link = document.getElementById('update-link');
        const originalText = link.textContent;
        link.textContent = '...';
        try {
            const res = await fetch(API_URL + '/version.json');
            if (res.ok) {
                const data = await res.json();
                function isNewerVersion(remote, current) {
                    const r = String(remote).split('.').map(Number);
                    const c = String(current).split('.').map(Number);
                    for (let i = 0; i < Math.max(r.length, c.length); i++) {
                        if ((r[i] || 0) > (c[i] || 0)) return true;
                        if ((r[i] || 0) < (c[i] || 0)) return false;
                    }
                    return false;
                }
                if (isNewerVersion(data.version, CONFIG.VERSION)) {
                    document.getElementById('new-version-badge').style.display = 'inline-block';
                    link.textContent = 'New version ' + data.version + ' available!';
                    setTimeout(() => {
                        chrome.tabs.create({ url: API_URL });
                        link.textContent = originalText;
                    }, 1500);
                } else {
                    link.textContent = 'Latest version installed';
                    setTimeout(() => { link.textContent = originalText; }, 2000);
                }
            } else {
                chrome.tabs.create({ url: API_URL });
                link.textContent = originalText;
            }
        } catch (err) {
            chrome.tabs.create({ url: API_URL });
            link.textContent = originalText;
        }
    });
});
