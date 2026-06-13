export const templates = {
  manifest: `{
  "manifest_version": 3,
  "name": "SyncRate: Currency & Crypto Converter",
  "version": "15.0",
  "description": "Мгновенная конвертация. Нацбанки и Крипта. Внимание: Реверс-инжиниринг и взлом PRO версии преследуется по закону (DMCA).",
  "permissions":["storage"],
  "host_permissions":[
    "https://open.er-api.com/*",
    "https://min-api.cryptocompare.com/*",
    "https://www.cbr-xml-daily.ru/*",
    "https://bank.gov.ua/*",
    "https://api.nbrb.by/*"
  ],
  "action": { "default_popup": "popup.html", "default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" } },
  "icons": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" },
  "background": { "service_worker": "background.js" },
  "content_scripts":[ { "matches":["<all_urls>"], "js":["content.js"], "run_at": "document_end", "all_frames": true } ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}`,
  storeRu: `[НАЗВАНИЕ]
SyncRate: Конвертер Валют и Крипты[КРАТКОЕ ОПИСАНИЕ]
Мгновенно переводит любую валюту на сайте в ваши деньги при выделении текста. 160+ фиатных валют, Нацбанки и Топ-30 крипты.

[ПОЛНОЕ ОПИСАНИЕ]
SyncRate — это ультимативный финансовый инструмент для браузера. Забудьте о том, чтобы копировать цифры и открывать новые вкладки с калькулятором. Просто выделите любую сумму (например, "$ 5,040" или "0.5 BTC") на любом сайте, и SyncRate мгновенно покажет её эквивалент в вашей национальной валюте прямо возле курсора!

🌟 ГЛАВНЫЕ ФУНКЦИИ (FREE):
- Конвертация из USD в вашу национальную валюту.
- Умный парсинг: распознает суффиксы K, M, B, тыс, млн, млрд, трлн.
- Удобный встроенный дашборд с главными валютными парами.

💎 ФУНКЦИИ ВЕРСИИ PRO+:
- 160+ фиатных валют со всего мира.
- Интеграция с Официальными Национальными Банками (ЦБ РФ, НБУ, НБРБ, ЕЦБ) для точных налоговых и бухгалтерских расчетов.
- Поддержка Топ-30 криптовалют (BTC, ETH, SOL, USDT и др.) с обновлением курса каждую минуту!
- Умная Темная Тема (Dark Mode).
- Перевод интерфейса на 10 языков (включая Русский, Английский, Китайский, Немецкий, Казахский).

🔒 КОНФИДЕНЦИАЛЬНОСТЬ И БЕЗОПАСНОСТЬ:
SyncRate уважает вашу приватность. Расширение НЕ читает данные вводимых паролей, номеров кредитных карт и скрытых полей. Все вычисления происходят мгновенно, без сбора вашей личной истории браузера.`,
  storeEn: `[TITLE]
SyncRate: Currency & Crypto Converter

[SHORT DESCRIPTION]
Highlight any price on any website to instantly convert it to your local currency. 160+ fiats, National Banks, and Top-30 Crypto.

[FULL DESCRIPTION]
SyncRate is the ultimate financial tool for your browser. Forget about copying numbers and opening new tabs with calculators. Simply highlight any amount (e.g., "$ 5,040" or "0.5 BTC") on any website, and SyncRate will instantly show its equivalent in your national currency right next to your cursor!

🌟 CORE FEATURES (FREE):
- Convert from USD to your local currency.
- Smart parsing: understands suffixes like K, M, B, millions, billions.
- Convenient built-in dashboard with main currency pairs.

💎 PRO+ FEATURES:
- 160+ fiat currencies from around the world.
- Integration with Official National Banks (ECB, CBRF, NBU, NBRB) for precise accounting and tax calculations.
- Support for Top-30 Cryptocurrencies (BTC, ETH, SOL, USDT, etc.) with rates updated every minute!
- Smart Dark Mode.
- Interface translated into 10 languages (including English, Russian, Chinese, German, Spanish).

🔒 PRIVACY & SECURITY:
SyncRate respects your privacy. The extension DOES NOT read passwords, credit card numbers, or hidden fields. All calculations happen instantly without collecting your personal browsing history.`,
  popupHtml: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        :root { --bg: #ffffff; --text: #1a1a1a; --card: #ffffff; --border: #e0e0e0; --primary: #6e40c9; --primary-hover: #8957e5; --shadow: rgba(0,0,0,0.08); --subtext: #666; --trial: #d2a8ff; }[data-theme="dark"] { --bg: #0d1117; --text: #f0f6fc; --card: #161b22; --border: #30363d; --primary: #8957e5; --primary-hover: #a371f7; --shadow: rgba(0,0,0,0.5); --subtext: #8b949e; --trial: #6e40c9; }
        body { width: 360px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); transition: 0.2s; user-select: none; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--card); border-bottom: 1px solid var(--border); }
        .header h2 { margin: 0; font-size: 17px; font-weight: 800; display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px; }
        .header-actions { display: flex; gap: 8px; }
        .icon-btn { cursor: pointer; padding: 6px; border-radius: 50%; background: transparent; border: 1px solid var(--border); color: var(--text); transition: 0.2s; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; }
        .icon-btn:hover { background: var(--border); }
        .icon-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .update-badge { background: #e53935; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; margin-left: 6px; display: none; }
        .trial-banner { background: var(--trial); color: #fff; text-align: center; padding: 6px; font-size: 11px; font-weight: 600; display: none; }
        .tabs { display: flex; background: var(--card); border-bottom: 1px solid var(--border); }
        .tab { flex: 1; display: flex; justify-content: center; align-items: center; gap: 6px; padding: 12px 0; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--subtext); transition: 0.2s; }
        .tab svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .tab.active { color: var(--primary); border-bottom: 2px solid var(--primary); }
        .tab-content { display: none; padding: 16px; }
        .tab-content.active { display: block; }
        .grid-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .dash-card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px; text-align: center; box-shadow: 0 4px 12px var(--shadow); }
        .dash-card-title { font-size: 12px; color: var(--subtext); font-weight: 600; margin-bottom: 4px; }
        .dash-card-value { font-size: 14px; color: var(--text); font-weight: 700; }
        .setting-group { margin-bottom: 16px; }
        .setting-group label { display: block; font-size: 11px; font-weight: 600; color: var(--subtext); margin-bottom: 6px; text-transform: uppercase; }
        select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); font-size: 13px; outline: none; cursor: pointer; }
        select:disabled { opacity: 0.5; cursor: not-allowed; }
        optgroup { font-weight: bold; color: var(--primary); }
        .btn-save { width: 100%; background: var(--primary); color: white; border: none; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 8px; }
        .btn-save:hover { background: var(--primary-hover); transform: scale(0.98); }
        .plan { display: block; background: var(--card); border: 2px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; }
        .plan input { display: none; }
        .plan.active { border-color: var(--primary); background: rgba(110,64,201,0.05); }
        .plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .plan-title { font-weight: 700; font-size: 14px; }
        .plan-desc { font-size: 11px; color: var(--subtext); margin: 0; line-height: 1.4; }
        .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; color: white; }
        .badge.pro { background: #f39c12; }
        .badge.pro-plus { background: #e53935; }
        .footer { text-align: center; padding: 12px; font-size: 10px; color: var(--subtext); border-top: 1px solid var(--border); background: var(--card); line-height: 1.4;}
        .legal { font-size: 9px; opacity: 0.6; display: block; margin-top: 4px;}
    </style>
</head>
<body>
    <div id="trial-banner" class="trial-banner"></div>
    <div class="header">
        <h2>⚡ SyncRate</h2>
        <div class="header-actions">
            <button class="icon-btn" id="feedback-btn" title="Feedback"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
            <button class="icon-btn" id="donate-btn" title="Donate"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
            <button class="icon-btn" id="theme-btn" title="Dark/Light Mode"><svg id="theme-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></button>
        </div>
    </div>
    
    <div class="tabs">
        <div class="tab active" data-target="tab-dash"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg><span data-i18n="tab_rates">Курсы</span></div>
        <div class="tab" data-target="tab-settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span data-i18n="tab_settings">Настройки</span></div>
        <div class="tab" data-target="tab-plans"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><span data-i18n="tab_plans">Тарифы</span></div>
    </div>
    
    <div id="tab-dash" class="tab-content active">
        <div style="font-size: 12px; color: var(--subtext); text-align: center; margin-bottom: 12px;"><span data-i18n="your_currency">Ваша валюта:</span> <strong id="lbl-target-currency" style="color:var(--text);">RUB</strong></div>
        <div class="grid-2x2" id="dashboard-grid"></div>
    </div>
    
    <div id="tab-settings" class="tab-content">
        <div class="setting-group"><label data-i18n="lbl_lang">Язык / Language</label>
            <select id="sel-lang">
                <option value="auto" data-i18n="opt_auto">Авто (Браузер) / Auto</option>
                <option value="ru">🇷🇺 Русский</option><option value="en">🇬🇧 English</option>
                <option value="kk">🇰🇿 Қазақша</option><option value="uk">🇺🇦 Українська</option>
                <option value="zh">🇨🇳 中文 (Chinese)</option><option value="de">🇩🇪 Deutsch</option>
                <option value="es">🇪🇸 Español</option>
            </select>
        </div>
        <div class="setting-group"><label data-i18n="lbl_target">Ваша национальная валюта</label>
            <select id="sel-target">
                <option value="RUB" data-i18n="cur_rub">🇷🇺 Российский рубль (RUB)</option><option value="EUR" data-i18n="cur_eur">🇪🇺 Euro (EUR)</option><option value="USD" data-i18n="cur_usd">🇺🇸 US Dollar (USD)</option><option value="CNY" data-i18n="cur_cny">🇨🇳 Chinese Yuan (CNY)</option><option value="KZT" data-i18n="cur_kzt">🇰🇿 Казахский тенге (KZT)</option><option value="UAH" data-i18n="cur_uah">🇺🇦 Українська гривня (UAH)</option><option value="BYN" data-i18n="cur_byn">🇧🇾 Беларускі рубель (BYN)</option><option value="GBP" data-i18n="cur_gbp">🇬🇧 British Pound (GBP)</option>
            </select>
        </div>
        <div class="setting-group"><label><span data-i18n="lbl_source">Источник курса</span> <span class="badge pro-plus">PRO+</span></label>
            <select id="sel-source">
                <option value="market" data-i18n="opt_market">🌐 Рыночный (Биржи)</option>
                <option value="official" data-i18n="opt_official">🏛 Официальный Нацбанк</option>
            </select>
        </div>
        <div class="setting-group"><label data-i18n="lbl_dash">Валюты для Дашборда (Топ 4)</label>
            <div class="grid-2x2"><select class="sel-dash" id="dash-1"></select><select class="sel-dash" id="dash-2"></select><select class="sel-dash" id="dash-3"></select><select class="sel-dash" id="dash-4"></select></div>
        </div>
        <button class="btn-save" id="btn-save-settings"><span data-i18n="btn_save">Сохранить</span></button>
        <div style="margin-top: 20px; font-size: 10px; color: var(--subtext); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px;">
            <span>SyncRate Enterprise v15.0</span>
            <a href="#" id="update-link" style="color: var(--primary); text-decoration: none; font-weight: 700;" data-i18n="check_updates">Проверить обновления</a>
            <span id="new-version-badge" class="update-badge">NEW</span>
        </div>
    </div>
    
    <div id="tab-plans" class="tab-content">
        <label class="plan" id="plan-basic"><input type="radio" name="tier" value="basic"><div class="plan-header"><div class="plan-title" data-i18n="tier_basic">Базовая</div><div>0 $</div></div><p class="plan-desc" data-i18n="desc_basic">Конвертация только из USD.</p></label>
        <label class="plan" id="plan-pro"><input type="radio" name="tier" value="pro"><div class="plan-header"><div class="plan-title">PRO <span class="badge pro">PRO</span></div><div style="color:var(--primary); font-weight:800;">2 $ <span data-i18n="lifetime">навсегда</span></div></div><p class="plan-desc" data-i18n="desc_pro">Топ-8 фиатных валют мира.</p></label>
        <label class="plan" id="plan-pro_plus"><input type="radio" name="tier" value="pro_plus"><div class="plan-header"><div class="plan-title">PRO+ <span class="badge pro-plus">PRO+</span></div><div style="color:#e53935; font-weight:800;">5 $ <span data-i18n="lifetime">навсегда</span></div></div><p class="plan-desc" data-i18n="desc_pro_plus">Нацбанки СНГ, Все валюты, Топ-30 Крипты.</p></label>
        <button class="btn-save" id="btn-upgrade" style="display:none; background:#f39c12;" data-i18n="btn_pay">💳 Оплатить доступ</button>
    </div>
    <div class="footer">
        v15.0 | SyncRate Enterprise
        <span class="legal">© 2026 SyncRate. Protected by DMCA laws. Piracy prohibited.</span>
    </div>
    <script src="popup.js"></script>
</body>
</html>`,
  landing: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SyncRate | The Ultimate Currency Converter</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --bg: #09090b; --card-bg: rgba(24, 24, 27, 0.6); --border: rgba(255,255,255,0.1); 
            --primary: #8b5cf6; --accent: #10b981; --gold: #facc15; --text: #fafafa; --subtext: #a1a1aa;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background: var(--bg); color: var(--text); overflow-x: hidden; line-height: 1.6; position: relative; }
        
        .ambient-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; pointer-events: none; }
        .orb-1 { position: absolute; top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 60%); filter: blur(80px); animation: drift 15s infinite alternate ease-in-out; }
        .orb-2 { position: absolute; bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 60%); filter: blur(100px); animation: drift 20s infinite alternate-reverse ease-in-out; }
        .orb-3 { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(250,204,21,0.05) 0%, transparent 60%); filter: blur(100px); animation: pulse 10s infinite alternate ease-in-out; }
        @keyframes drift { 0% { transform: translate(0, 0); } 100% { transform: translate(10%, 10%); } }
        @keyframes pulse { 0% { transform: translate(-50%, -50%) scale(1); } 100% { transform: translate(-50%, -50%) scale(1.2); } }

        nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 8%; background: rgba(9, 9, 11, 0.7); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 1000; border-bottom: 1px solid var(--border); }
        .logo { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 8px; text-decoration: none; color: white; transition: 0.3s; }
        .logo:hover { transform: scale(1.05); text-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
        .logo svg { width: 28px; height: 28px; stroke: var(--primary); stroke-width: 2.5; fill: none; }
        
        .btn { background: var(--primary); color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; transition: 0.3s; border: none; cursor: pointer; display: inline-block; text-align: center; }
        .btn:hover { background: #7c3aed; box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); transform: translateY(-2px); }

        .hero { text-align: center; padding: 120px 20px 60px; }
        .hero h1 { font-size: clamp(40px, 6vw, 76px); font-weight: 900; margin-bottom: 24px; line-height: 1.1; letter-spacing: -2px; }
        .hero h1 span { background: linear-gradient(135deg, #c4b5fd, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero p { font-size: 20px; color: var(--subtext); max-width: 650px; margin: 0 auto 40px; font-weight: 400; }

        .features-container { max-width: 1200px; margin: 0 auto 120px; padding: 0 5%; }
        .bento-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .bento-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 24px; padding: 40px; backdrop-filter: blur(20px); transition: 0.4s ease; position: relative; overflow: hidden; }
        .bento-card:hover { border-color: rgba(139, 92, 246, 0.5); transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        
        .pricing { padding: 0 5% 100px; text-align: center; }
        .price-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; max-width: 1100px; margin: 50px auto 0; align-items: center;}
        .price-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 24px; padding: 40px; text-align: left; transition: 0.3s;}
        .price-card.pro-plus { border-color: var(--gold); transform: scale(1.05); z-index: 2;}

        footer { border-top: 1px solid var(--border); padding: 60px 5% 40px; text-align: center; background: rgba(0,0,0,0.5); }
    </style>
</head>
<body>
    <div class="ambient-container">
        <div class="orb-1"></div><div class="orb-2"></div><div class="orb-3"></div>
    </div>
    <nav>
        <a href="#" class="logo">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            SyncRate
        </a>
        <a href="#download" class="btn">Install Extension</a>
    </nav>
    <section class="hero">
        <h1>Magic conversion<br><span>in 1 click.</span></h1>
        <p>Instantly convert any currency on a website to your money by highlighting text. 160+ fiats, National Banks, and Top-30 Crypto.</p>
        <div class="flex justify-center gap-4">
            <a href="#download" class="btn">Get SyncRate</a>
            <a href="#features" class="btn" style="background: transparent; border: 1px solid var(--border);">Learn More</a>
        </div>
    </section>
    <section id="features" class="features-container">
        <div class="bento-grid">
            <div class="bento-card">
                <h3>Smart Parsing</h3>
                <p>Recognizes suffixes like K, M, B and any currency symbols automatically.</p>
            </div>
            <div class="bento-card">
                <h3>National Banks</h3>
                <p>Official rates from ECB, CBRF, NBU, NBRB for maximum precision.</p>
            </div>
            <div class="bento-card">
                <h3>Top-30 Crypto</h3>
                <p>Real-time rates for Bitcoin, Ethereum, Solana and 30+ other coins.</p>
            </div>
        </div>
    </section>
    <section id="download" class="pricing">
        <h2>Choose Your Plan</h2>
        <div class="price-grid">
            <div class="price-card">
                <h3>Basic</h3>
                <h1>Free</h1>
                <p>Only USD conversion. 2 dashboard slots.</p>
            </div>
            <div class="price-card pro-plus">
                <h3>PRO+</h3>
                <h1>$5</h1>
                <p>160+ currencies, National Banks, Crypto. Unlimited slots.</p>
            </div>
        </div>
    </section>
    <section class="py-20 px-5 text-center bg-gradient-to-b from-transparent to-purple-900/20">
        <div class="max-w-4xl mx-auto bento-card border-purple-500/30">
            <h2 class="text-3xl md:text-5xl font-black mb-6">Try PRO+ for Free</h2>
            <p class="text-xl text-zinc-400 mb-10">Install the extension now and get 48 hours of full access to all Enterprise features automatically. No credit card required.</p>
            <a href="#download" class="btn text-lg px-10 py-4">Start Free Test</a>
        </div>
    </section>
    <footer>
        <p>© 2026 SyncRate. All rights reserved.</p>
    </footer>
</body>
</html>`,
  updatesXml: `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/updateflash/statustext/1.0' protocol='2.0'>
  <app appid='msjrecxeaytix2n65pvx6i'>
    <updatecheck codebase='https://ais-pre-msjrecxeaytix2n65pvx6i-307655937505.us-west2.run.app/SyncRate.zip' version='15.0' />
  </app>
</gupdate>`,
  popupJs: `const DICT={'ru':{opt_auto:'Авто (Браузер)',lbl_lang:'Язык интерфейса',tab_rates:'Курсы',tab_settings:'Настройки',tab_plans:'Тарифы',your_currency:'Ваша валюта:',lbl_target:'Целевая валюта',lbl_source:'Источник курса',lbl_dash:'Валюты дашборда',btn_save:'Сохранить настройки',btn_pay:'💳 Оплатить доступ',tier_basic:'Базовая',lifetime:'(навсегда)',desc_basic:'Только USD. 2 слота в дашборде.',desc_pro:'8 валют (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слота. Темная тема.',desc_pro_plus:'160+ валют, Нацбанки (СНГ, ЕС), Топ-30 Крипты. Безлимитные слоты.',trial_left:'🎁 PRO+ Trial активен. Осталось часов: ',opt_market:'🌐 Рыночный (Биржи)',opt_official:'🏛 Официальный Нацбанк',opt_fiat:'🌍 Фиатные',opt_crypto:'🪙 Крипта',cur_rub:'🇷🇺 Российский рубль (RUB)',cur_eur:'🇪🇺 Евро (EUR)',cur_usd:'🇺🇸 Доллар США (USD)',cur_cny:'🇨🇳 Китайский юань (CNY)',cur_kzt:'🇰🇿 Казахский тенге (KZT)',cur_uah:'🇺🇦 Украинская гривна (UAH)',cur_byn:'🇧🇾 Белорусский рубль (BYN)',cur_gbp:'🇬🇧 Британский фунт (GBP)',cur_try:'🇹🇷 Турецкая лира (TRY)',cur_chf:'🇨🇭 Швейцарский франк (CHF)',cur_jpy:'🇯🇵 Японская иена (JPY)',cur_cad:'🇨🇦 Канадский доллар (CAD)',cur_aed:'🇦🇪 Дирхам ОАЭ (AED)',update_info:'Для обновления скачайте новую версию на сайте.',check_updates:'Проверить обновления',ready:'Готово!'},'uk':{opt_auto:'Авто (Браузер)',lbl_lang:'Мова інтерфейсу',tab_rates:'Курси',tab_settings:'Налаштування',tab_plans:'Тарифи',your_currency:'Ваша валюта:',lbl_target:'Цільова валюта',lbl_source:'Джерело курсу',lbl_dash:'Валюти дашборду',btn_save:'Зберегти налаштування',btn_pay:'💳 Оплатити доступ',tier_basic:'Базова',lifetime:'(назавжди)',desc_basic:'Тільки USD. 2 слоти в дашборді.',desc_pro:'8 валют (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слоти. Темна тема.',desc_pro_plus:'160+ валют, Нацбанки (СНД, ЄС), Топ-30 Крипти. Безлімітні слоти.',trial_left:'🎁 PRO+ Trial активний. Залишилося годин: ',opt_market:'🌐 Ринковий (Біржі)',opt_official:'🏛 Офіційний Нацбанк',opt_fiat:'🌍 Фіатні',opt_crypto:'🪙 Крипта',cur_rub:'🇷🇺 Російський рубль (RUB)',cur_eur:'🇪🇺 Євро (EUR)',cur_usd:'🇺🇸 Доллар США (USD)',cur_cny:'🇨🇳 Китайський юань (CNY)',cur_kzt:'🇰🇿 Казахський тенге (KZT)',cur_uah:'🇺🇦 Українська гривня (UAH)',cur_byn:'🇧🇾 Білоруський рубль (BYN)',cur_gbp:'🇬🇧 Британський фунт (GBP)',cur_try:'🇹🇷 Турецька ліра (TRY)',cur_chf:'🇨🇭 Швейцарський франк (CHF)',cur_jpy:'🇯🇵 Японська єна (JPY)',cur_cad:'🇨🇦 Канадський долар (CAD)',cur_aed:'🇦🇪 Дірхам ОАЕ (AED)',update_info:'Для оновлення скачайте нову версію на сайті.',check_updates:'Перевірити оновлення',ready:'Готово!'},'kk':{opt_auto:'Авто (Браузер)',lbl_lang:'Интерфейс тілі',tab_rates:'Бағамдар',tab_settings:'Параметрлер',tab_plans:'Тарифтер',your_currency:'Сіздің валютаңыз:',lbl_target:'Мақсатты валюта',lbl_source:'Курс көзі',lbl_dash:'Дашборд валюталары',btn_save:'Сақтау',btn_pay:'💳 Төлеу',tier_basic:'Негізгі',lifetime:'(мәңгілікке)',desc_basic:'Тек USD. Дашбордта 2 слот.',desc_pro:'8 валюта (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слот. Қараңғы тақырып.',desc_pro_plus:'160+ валюта, Ұлттық банктер (ТМД, ЕО), Топ-30 Крипто. Шексіз слоттар.',trial_left:'🎁 PRO+ Trial белсенді. Қалған сағат: ',opt_market:'🌐 Нарықтық (Биржалар)',opt_official:'🏛 Ресми Ұлттық банк',opt_fiat:'🌍 Фиат',opt_crypto:'🪙 Криптовалюта',cur_rub:'🇷🇺 Ресей рублі (RUB)',cur_eur:'🇪🇺 Еуро (EUR)',cur_usd:'🇺🇸 АҚШ доллары (USD)',cur_cny:'🇨🇳 Қытай юані (CNY)',cur_kzt:'🇰🇿 Қазақстан теңгесі (KZT)',cur_uah:'🇺🇦 Украин гривнасы (UAH)',cur_byn:'🇧🇾 Беларусь рублі (BYN)',cur_gbp:'🇬🇧 Британ фунты (GBP)',cur_try:'🇹🇷 Түрік лирасы (TRY)',cur_chf:'🇨🇭 Швейцария франкі (CHF)',cur_jpy:'🇯🇵 Жапон иенасы (JPY)',cur_cad:'🇨🇦 Канада доллары (CAD)',cur_aed:'🇦🇪 БАӘ дирхамы (AED)',update_info:'Жаңарту үшін сайттан жаңа нұсқаны жүктеп алыңыз.',check_updates:'Жаңартуларды тексеру',ready:'Дайын!'},'en':{opt_auto:'Auto (Browser)',lbl_lang:'Language',tab_rates:'Rates',tab_settings:'Settings',tab_plans:'Plans',your_currency:'Your Currency:',lbl_target:'Target Currency',lbl_source:'Rate Source',lbl_dash:'Dashboard Currencies',btn_save:'Save Settings',btn_pay:'💳 Pay for Lifetime',tier_basic:'Basic',lifetime:'(lifetime)',desc_basic:'Only USD. 2 dashboard slots.',desc_pro:'8 currencies (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 slots. Dark mode.',desc_pro_plus:'160+ fiats, National Banks (CIS, EU), Top-30 Crypto. Unlimited slots.',trial_left:'🎁 PRO+ Trial active. Hours left: ',opt_market:'🌐 Market (Live)',opt_official:'🏛 Official National Bank',opt_fiat:'🌍 Fiat Currencies',opt_crypto:'🪙 Crypto',cur_rub:'🇷🇺 Russian Ruble (RUB)',cur_eur:'🇪🇺 Euro (EUR)',cur_usd:'🇺🇸 US Dollar (USD)',cur_cny:'🇨🇳 Chinese Yuan (CNY)',cur_kzt:'🇰🇿 Kazakh Tenge (KZT)',cur_uah:'🇺🇦 Ukrainian Hryvnia (UAH)',cur_byn:'🇧🇾 Belarusian Ruble (BYN)',cur_gbp:'🇬🇧 British Pound (GBP)',cur_try:'🇹🇷 Turkish Lira (TRY)',cur_chf:'🇨🇭 Swiss Franc (CHF)',cur_jpy:'🇯🇵 Japanese Yen (JPY)',cur_cad:'🇨🇦 Canadian Dollar (CAD)',cur_aed:'🇦🇪 UAE Dirham (AED)',update_info:'To update, download the new version from the website.',check_updates:'Check for Updates',ready:'Ready!'},'zh':{opt_auto:'自动 (浏览器)',lbl_lang:'语言 / Language',tab_rates:'汇率',tab_settings:'设置',tab_plans:'计划',your_currency:'您的货币:',lbl_target:'目标货币',lbl_source:'汇率来源',lbl_dash:'仪表板货币',btn_save:'保存设置',btn_pay:'💳 终身购买',tier_basic:'基础版',lifetime:'(终身)',desc_basic:'仅支持 USD. 2个槽位。',desc_pro:'8 种货币 (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED)。4 个插槽。深色模式。',desc_pro_plus:'160+ 法定货币，国家银行（独联体，欧盟），前30名加密货币。无限插槽。',trial_left:'🎁 PRO+ 试用期生效。剩余小时：',opt_market:'🌐 市场 (外汇)',opt_official:'🏛 官方国家银行',opt_fiat:'🌍 法定货币 (Fiat)',opt_crypto:'🪙 加密货币 (Crypto)',cur_rub:'🇷🇺 俄罗斯卢布 (RUB)',cur_eur:'🇪🇺 欧元 (EUR)',cur_usd:'🇺🇸 美元 (USD)',cur_cny:'🇨🇳 人民币 (CNY)',cur_kzt:'🇰🇿 哈萨克斯坦坚戈 (KZT)',cur_uah:'🇺🇦 乌克兰格里夫纳 (UAH)',cur_byn:'🇧🇾 白俄罗斯卢布 (BYN)',cur_gbp:'🇬🇧 英镑 (GBP)',cur_try:'🇹🇷 土耳其里ла (TRY)',cur_chf:'🇨🇭 瑞士法郎 (CHF)',cur_jpy:'🇯🇵 日元 (JPY)',cur_cad:'🇨🇦 加拿大元 (CAD)',cur_aed:'🇦🇪 阿联酋迪拉姆 (AED)',update_info:'要更新，请从网站下载新版本。',check_updates:'检查更新',ready:'完成！'},'de':{opt_auto:'Auto (Browser)',lbl_lang:'Sprache / Language',tab_rates:'Kurse',tab_settings:'Einstell.',tab_plans:'Tarife',your_currency:'Ihre Währung:',lbl_target:'Zielwährung',lbl_source:'Kursquelle',lbl_dash:'Dashboard-Währungen',btn_save:'Speichern',btn_pay:'💳 Für immer bezahlen',tier_basic:'Basis',lifetime:'(lebenslang)',desc_basic:'Konvertierung nur aus USD.',desc_pro:'8 Währungen (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 Slots. Dunkelmodus.',desc_pro_plus:'160+ Fiats, Nationalbanken (GUS, EU), Top-30 Krypto. Unbegrenzte Slots.',trial_left:'🎁 PRO+ Trial aktiv. Stunden: ',opt_market:'🌐 Markt (Forex)',opt_official:'🏛 Offizielle Nationalbank',opt_fiat:'🌍 Fiat',opt_crypto:'🪙 Krypto',cur_rub:'🇷🇺 Russischer Rubel (RUB)',cur_eur:'🇪🇺 Euro (EUR)',cur_usd:'🇺🇸 US-Dollar (USD)',cur_cny:'🇨🇳 Chinesischer Yuan (CNY)',cur_kzt:'🇰🇿 Kasachischer Tenge (KZT)',cur_uah:'🇺🇦 Ukrainische Hrywnja (UAH)',cur_byn:'🇧🇾 Weißrussischer Rubel (BYN)',cur_gbp:'🇬🇧 Britisches Pfund (GBP)',cur_try:'🇹🇷 Türkische Lira (TRY)',cur_chf:'🇨🇭 Schweizer Franken (CHF)',cur_jpy:'🇯🇵 Japanischer Yen (JPY)',cur_cad:'🇨🇦 Kanadischer Dollar (CAD)',cur_aed:'🇦🇪 VAE-Dirham (AED)',update_info:'Zum Aktualisieren laden Sie die neue Version von der Website herunter.',check_updates:'Auf Updates prüfen',ready:'Fertig!'},'es':{opt_auto:'Auto (Navegador)',lbl_lang:'Idioma / Language',tab_rates:'Tasas',tab_settings:'Ajustes',tab_plans:'Planes',your_currency:'Tu moneda:',lbl_target:'Moneda objetivo',lbl_source:'Fuente de la tasa',lbl_dash:'Monedas del panel',btn_save:'Guardar ajustes',btn_pay:'💳 Pagar de por vida',tier_basic:'Básico',lifetime:'(de por vida)',desc_basic:'Solo desde USD. 2 monedas.',desc_pro:'8 monedas (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 ranuras. Modo oscuro.',desc_pro_plus:'160+ fiats, Bancos Nacionales (GUS, UE), Top-30 Cripto. Ranuras ilimitadas.',trial_left:'🎁 Prueba PRO+ activa. Horas: ',opt_market:'🌐 Mercado (Bolsas)',opt_official:'🏛 Banco Nacional Oficial',opt_fiat:'🌍 Fiat',opt_crypto:'🪙 Cripto',cur_rub:'🇷🇺 Rublo ruso (RUB)',cur_eur:'🇪🇺 Euro (EUR)',cur_usd:'🇺🇸 Dólar (USD)',cur_cny:'🇨🇳 Yuan chino (CNY)',cur_kzt:'🇰🇿 Tenge kazajo (KZT)',cur_uah:'🇺🇦 Grivna ucraniana (UAH)',cur_byn:'🇧🇾 Rublo bielorruso (BYN)',cur_gbp:'🇬🇧 Libra británica (GBP)',cur_try:'🇹🇷 Lira turca (TRY)',cur_chf:'🇨🇭 Franco suizo (CHF)',cur_jpy:'🇯🇵 Yen japonés (JPY)',cur_cad:'🇨🇦 Dólar canadiense (CAD)',cur_aed:'🇦🇪 Dirham de los EAU (AED)',update_info:'Para actualizar, descargue la nueva versión desde el sitio web.',check_updates:'Buscar actualizaciones',ready:'¡Listo!'}};
const FIAT_CURRENCIES=['USD','EUR','GBP','CHF','JPY','CNY','CAD','AED','TRY','RUB','KZT','UAH','BYN'];
const CRYPTO_CURRENCIES=['BTC','ETH','USDT','SOL','BNB','XRP','ADA','DOGE','DOT','MATIC','SHIB','LTC'];
const BANK_NAMES={'RUB':'ЦБ РФ','UAH':'НБУ','BYN':'НБРБ','EUR':'ECB'};
document.addEventListener('DOMContentLoaded', async () => {
    const state = await chrome.storage.local.get({
        lang: 'auto',
        targetCurrency: 'RUB',
        rateSource: 'market',
        dashboardBases: ['USD', 'EUR', 'BTC', 'ETH'],
        theme: 'dark',
        appTier: 'basic',
        trialStart: null
    });

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
    const isTrialActive = state.trialStart && (Date.now() - state.trialStart < 48 * 60 * 60 * 1000);
    const activeTier = (state.appTier === 'pro_plus' || isTrialActive) ? 'pro_plus' : state.appTier;

    if (isTrialActive && state.appTier === 'basic') {
        const hoursLeft = Math.max(0, Math.floor((48 * 60 * 60 * 1000 - (Date.now() - state.trialStart)) / (1000 * 60 * 60)));
        trialBanner.style.display = 'block';
        trialBanner.textContent = i18n('trial_left') + hoursLeft;
    }

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
        const selectedTier = document.querySelector('input[name="tier"]:checked').value;
        const newSettings = {
            lang: langSel.value,
            targetCurrency: targetSel.value,
            rateSource: sourceSel.value,
            dashboardBases: dashSels.map(s => s.value),
            appTier: selectedTier
        };
        chrome.storage.local.set(newSettings, () => {
            saveBtn.textContent = i18n('ready');
            setTimeout(() => {
                saveBtn.textContent = i18n('btn_save');
                window.location.reload();
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
                state.dashboardBases.forEach((base, i) => {
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

    // Plan Selection
    const planRadios = document.querySelectorAll('input[name="tier"]');
    planRadios.forEach(radio => {
        if (radio.value === state.appTier) {
            radio.checked = true;
            radio.closest('.plan').classList.add('active');
            upgradeBtn.style.display = radio.value === 'basic' ? 'none' : 'block';
        }
        radio.addEventListener('change', () => {
            document.querySelectorAll('.plan').forEach(p => p.classList.remove('active'));
            radio.closest('.plan').classList.add('active');
            upgradeBtn.style.display = radio.value === 'basic' ? 'none' : 'block';
        });
    });

    document.getElementById('donate-btn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://buymeacoffee.com' });
    });

    document.getElementById('feedback-btn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'mailto:askoreebipiatnica@gmail.com?subject=SyncRate Feedback' });
    });

    document.getElementById('update-link').addEventListener('click', async (e) => {
        e.preventDefault();
        const link = document.getElementById('update-link');
        const originalText = link.textContent;
        link.textContent = '...';
        try {
            const res = await fetch('https://ais-pre-msjrecxeaytix2n65pvx6i-307655937505.us-west2.run.app/version.json');
            if (res.ok) {
                const data = await res.json();
                if (data.version > 15.0) {
                    document.getElementById('new-version-badge').style.display = 'inline-block';
                    link.textContent = 'New version ' + data.version + ' available!';
                    setTimeout(() => {
                        chrome.tabs.create({ url: 'https://ais-pre-msjrecxeaytix2n65pvx6i-307655937505.us-west2.run.app' });
                        link.textContent = originalText;
                    }, 1500);
                } else {
                    link.textContent = 'Latest version installed';
                    setTimeout(() => { link.textContent = originalText; }, 2000);
                }
            } else {
                chrome.tabs.create({ url: 'https://ais-pre-msjrecxeaytix2n65pvx6i-307655937505.us-west2.run.app' });
                link.textContent = originalText;
            }
        } catch (err) {
            chrome.tabs.create({ url: 'https://ais-pre-msjrecxeaytix2n65pvx6i-307655937505.us-west2.run.app' });
            link.textContent = originalText;
        }
    });
});
`,
  background: `const API_FIAT="https://open.er-api.com/v6/latest/";const CRYPTO_API="https://min-api.cryptocompare.com/data/price?fsym=";const CBRF_API="https://www.cbr-xml-daily.ru/daily_json.js";const NBU_API="https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";const NBRB_API="https://api.nbrb.by/exrates/rates?periodicity=0";const CRYPTO_CODES=['BTC','ETH','USDT','BNB','SOL','XRP','USDC','ADA','AVAX','DOGE','DOT','TRX','LINK','MATIC','TON','SHIB','LTC','BCH','ATOM','XLM','NEAR','UNI','XMR','ETC','ICP','FIL','APT','LDO','ARB','VET','MKR','SAT','WAVES'];chrome.runtime.onInstalled.addListener(()=>{chrome.storage.local.get(['trialStart'],(res)=>{if(!res.trialStart)chrome.storage.local.set({trialStart:Date.now()});});});chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{if(request.action==="GET_RATE"){getCrossRate(request.from,request.to,request.source).then(sendResponse);return true;}if(request.action==="GET_DASHBOARD"){Promise.all(request.bases.map(b=>getCrossRate(b,request.target,request.source))).then(results=>{sendResponse({success:true,rates:results.map(r=>r.success?r.rate:null)});});return true;}});async function getCryptoUsdPrice(coin){if(coin==='USDT'||coin==='USDC')return 1;try{const res=await fetch(CRYPTO_API+coin+"&tsyms=USD");const data=await res.json();if(data.USD)return parseFloat(data.USD);throw new Error();}catch(e){const res=await fetch(API_FIAT+"USD");const data=await res.json();if(data.rates[coin])return 1/data.rates[coin];return 1;}}async function getCrossRate(fromCode,targetCode,sourceCode){if(fromCode===targetCode)return{success:true,rate:1,date:"Live"};try{const cacheKey="v15_rate_"+fromCode+"_"+targetCode+"_"+sourceCode;const cachedWrap=await chrome.storage.local.get([cacheKey]);const cachedItem=cachedWrap[cacheKey];const isCrypto=CRYPTO_CODES.includes(fromCode);const CACHE_TTL=isCrypto?60*1000:(sourceCode==='official'?12*60*60*1000:60*60*1000);if(cachedItem&&cachedItem.timestamp&&(Date.now()-cachedItem.timestamp<CACHE_TTL)){return{success:true,rate:cachedItem.rate,date:cachedItem.date};}let finalRate=null,dateToReturn="";if(sourceCode==='official'){try{let targetUsdRate=null;let targetBankName="";if(targetCode==='RUB'){const res=await fetch(CBRF_API);const data=await res.json();if(data.Valute && data.Valute['USD']){targetUsdRate=data.Valute['USD'].Value;targetBankName="ЦБ РФ";if(!isCrypto&&fromCode!=='USD'){if(fromCode==='EUR' && data.Valute['EUR'])finalRate=data.Valute['EUR'].Value;else if(data.Valute[fromCode])finalRate=data.Valute[fromCode].Value/data.Valute[fromCode].Nominal;}}}else if(targetCode==='UAH'){const res=await fetch(NBU_API);const data=await res.json();const usd=data.find(c=>c.cc==='USD');if(usd){targetUsdRate=usd.rate;targetBankName="НБУ";if(!isCrypto&&fromCode!=='USD'){const curObj=data.find(c=>c.cc===fromCode);if(curObj)finalRate=curObj.rate;}}}else if(targetCode==='BYN'){const res=await fetch(NBRB_API);const data=await res.json();const usdObj=data.find(c=>c.Cur_Abbreviation==='USD');if(usdObj){targetUsdRate=usdObj.Cur_OfficialRate/usdObj.Cur_Scale;targetBankName="НБРБ";if(!isCrypto&&fromCode!=='USD'){const curObj=data.find(c=>c.Cur_Abbreviation===fromCode);if(curObj)finalRate=curObj.Cur_OfficialRate/curObj.Cur_Scale;}}}else if(targetCode==='EUR'){const res=await fetch(API_FIAT+"EUR");const data=await res.json();if(data.rates && data.rates['USD']){targetUsdRate=1/data.rates['USD'];targetBankName="ECB";if(!isCrypto && data.rates[fromCode])finalRate=1/data.rates[fromCode];}}if(!finalRate&&targetUsdRate){if(isCrypto){finalRate=await getCryptoUsdPrice(fromCode)*targetUsdRate;}else if(fromCode==='USD'){finalRate=targetUsdRate;}}if(finalRate)dateToReturn=targetBankName;else throw new Error();}catch(e){sourceCode='market';}}if(!finalRate||sourceCode==='market'){if(isCrypto){const cryptoUsd=await getCryptoUsdPrice(fromCode);if(targetCode==='USD'){finalRate=cryptoUsd;dateToReturn="Live";}else{const res=await fetch(API_FIAT+"USD");const data=await res.json();finalRate=cryptoUsd*data.rates[targetCode];dateToReturn="Live";}}else{const res=await fetch(API_FIAT+fromCode);const data=await res.json();finalRate=data.rates[targetCode];dateToReturn="Live";}}if(finalRate){await chrome.storage.local.set({[cacheKey]:{rate:finalRate,date:dateToReturn,timestamp:Date.now()}});return{success:true,rate:finalRate,date:dateToReturn};}throw new Error();}catch(error){return{success:false};}}`,
  content: `const CRYPTO_MAP={'BTC':'BTC','BITCOIN':'BTC','БИТКОИН':'BTC','БИТОК':'BTC','ETH':'ETH','ETHEREUM':'ETH','ЭФИРИУМ':'ETH','ЭФИР':'ETH','USDT':'USDT','TETHER':'USDT','ТЕЗЕР':'USDT','BNB':'BNB','BINANCECOIN':'BNB','SOL':'SOL','SOLANA':'SOL','СОЛАНА':'SOL','XRP':'XRP','RIPPLE':'XRP','РИПЛ':'XRP','USDC':'USDC','USDCOIN':'USDC','ADA':'ADA','CARDANO':'ADA','КАРДАНО':'ADA','AVAX':'AVAX','AVALANCHE':'AVAX','АВАКС':'AVAX','DOGE':'DOGE','DOGECOIN':'DOGE','ДОГИКОИН':'DOGE','ДОГИ':'DOGE','DOT':'DOT','POLKADOT':'DOT','ПОЛКАДОТ':'DOT','TRX':'TRX','TRON':'TRX','ТРОН':'TRX','LINK':'LINK','CHAINLINK':'LINK','ЛИНК':'LINK','MATIC':'MATIC','POLYGON':'MATIC','МАТИК':'MATIC','TON':'TON','TONCOIN':'TON','ТОН':'TON','SHIB':'SHIB','SHIBAINU':'SHIB','ШИБА':'SHIB','LTC':'LTC','LITECOIN':'LTC','ЛАЙТКОИН':'LTC','BCH':'BCH','BITCOINCASH':'BCH','БИТКОИНКЕШ':'BCH','SAT':'SAT','SATOSHI':'SAT','САТОШИ':'SAT','WAVES':'WAVES','ВЕЙВС':'WAVES'};const FIAT_MAP={'$':'USD','USD':'USD','€':'EUR','EUR':'EUR','£':'GBP','GBP':'GBP','¥':'CNY','CNY':'CNY','JPY':'JPY','₣':'CHF','FR.':'CHF','CHF':'CHF','A$':'AUD','AUD':'AUD','C$':'CAD','CAD':'CAD','₺':'TRY','TRY':'TRY','AED':'AED','₴':'UAH','UAH':'UAH','ГРН':'UAH','ГРИВНА':'UAH','ГРИВЕН':'UAH','₸':'KZT','KZT':'KZT','ТНГ':'KZT','ТЕНГЕ':'KZT','₼':'AZN','AZN':'AZN','BGN':'BGN','LEV':'BGN','BR':'BYN','BYN':'BYN','БР':'BYN','БЕЛРУБ':'BYN','BYR':'BYN','РБ':'BYN','₹':'INR','INR':'INR','KGS':'KGS','₩':'KRW','KRW':'KRW','L':'MDL','MDL':'MDL','SM':'TJS','TJS':'TJS','TMT':'TMT','UZS':'UZS','SUM':'UZS','₪':'ILS','ILS':'ILS','¢':'USD','₽':'RUB','Р':'RUB','РУБ':'RUB','РУБ.':'RUB','РУБЛЕЙ':'RUB','RUB':'RUB','ДОЛЛАР':'USD','ДОЛЛАРОВ':'USD','ЕВРО':'EUR','ЮАНЬ':'CNY','ИЕНА':'JPY','ТЕНГЕ':'KZT'};const CURRENCY_MAP={...FIAT_MAP,...CRYPTO_MAP};const CRYPTO_CODES=Object.values(CRYPTO_MAP);const PRO_CURRENCIES=['USD','EUR','GBP','CHF','JPY','CAD','CNY','AED'];let hideTimeout=null,currentTooltip=null;document.addEventListener('mouseup',handleSelection);document.addEventListener('mousedown',(e)=>{if(currentTooltip&&currentTooltip.contains(e.target))return;removeTooltip();});async function handleSelection(event){try{if(!chrome.runtime?.id)return;const selection=window.getSelection();let text=selection.toString();text=text.replace(/[\\u00A0\\u202F\\u200B-\\u200D\\uFEFF]/g,' ').trim();if(!text||text.length>50)return;function isSelectionInSensitiveField(){const sel=window.getSelection();if(!sel.rangeCount)return false;const node=sel.getRangeAt(0).commonAncestorContainer;const el=node.nodeType===1?node:node.parentElement;if(!el)return false;const closestInput=el.closest('input, textarea');if(!closestInput)return false;const type=(closestInput.type||'').toLowerCase();const name=(closestInput.name||'').toLowerCase();const id=(closestInput.id||'').toLowerCase();return type==='password'||type==='hidden'||name.includes('cc')||name.includes('card')||name.includes('cvv')||name.includes('password')||name.includes('secret')||id.includes('cc')||id.includes('card')||id.includes('cvv')||id.includes('password')||id.includes('secret');}if(isSelectionInSensitiveField())return;const parseResult=parseCurrencyString(text);if(!parseResult)return;const settings=await chrome.storage.local.get({appTier:'basic',targetCurrency:'RUB',rateSource:'market',trialStart:null,lang:'auto'});let currentLang=settings.lang==='auto'?(navigator.language.split('-')[0]||'en'):settings.lang;if(currentLang==='ua')currentLang='uk';const C_DICT={'uk':{lock:'Блокування',req:'Потрібен тариф'},'ru':{lock:'Блокировка',req:'Требуется тариф'},'en':{lock:'Locked',req:'Requires plan'},'de':{lock:'Gesperrt',req:'Erfordert Plan'},'es':{lock:'Bloqueado',req:'Requiere plan'},'zh':{lock:'已锁定',req:'需要方案'},'kk':{lock:'Блокталған',req:'Тариф қажет'}};const m=C_DICT[currentLang]||C_DICT['en'];if(parseResult.isSat){showTooltip(event.pageX,event.pageY,parseResult.amount,"Live","BTC",currentLang);return;}if(parseResult.currency===settings.targetCurrency){showTooltip(event.pageX,event.pageY,parseResult.amount,"Live",settings.targetCurrency,currentLang);return;}const isTrialActive=settings.trialStart&&((Date.now()-settings.trialStart)<48*60*60*1000);const activeTier=(settings.appTier==='pro_plus'||isTrialActive)?'pro_plus':settings.appTier;const isByDomain=window.location.hostname.endsWith('.by');const allowedBasic=['USD','EUR','RUB'];if(isByDomain)allowedBasic.push('BYN');if(activeTier==='basic'&&!allowedBasic.includes(parseResult.currency))return showUpsell(event.pageX,event.pageY,parseResult.currency,"PRO",m);if(activeTier==='pro'&&!PRO_CURRENCIES.includes(parseResult.currency))return showUpsell(event.pageX,event.pageY,parseResult.currency,"PRO+",m);const actualSource=activeTier==='pro_plus'?settings.rateSource:'market';const res=await chrome.runtime.sendMessage({action:"GET_RATE",from:parseResult.currency,to:settings.targetCurrency,source:actualSource});if(res&&res.success&&res.rate)showTooltip(event.pageX,event.pageY,parseResult.amount*res.rate,res.date,settings.targetCurrency,currentLang);}catch(e){}}function parseCurrencyString(text){    const suffixRegex=/^([0-9\\s.,]+)\\s*((?:[KMBTКМБТ](?![A-Za-zА-Яа-яЁё])|тыс\\.?|млн\\.?|млрд\\.?|трлн\\.?))?\\s*([$€£¥₽₺₴₸₼₹₩₪¢A-Za-zА-Яа-яЁё.\\s]{1,25})$/i;
    const prefixRegex=/^([$€£¥₽₺₴₸₼₹₩₪¢A-Za-zА-Яа-яЁё.\\s]{1,25})\\s*([0-9\\s.,]+)\\s*((?:[KMBTКМБТ](?![A-Za-zА-Яа-яЁё])|тыс\\.?|млн\\.?|млрд\\.?|трлн\\.?))?$/i;
    let match=text.match(suffixRegex);
    let isSuffix=true;
    if(!match){
        match=text.match(prefixRegex);
        isSuffix=false;
    }
    if(!match)return null;
    let numStr,curStr,multStr;
    if(isSuffix){
        numStr=match[1];
        multStr=match[2]||"";
        curStr=match[3];
    }else{
        curStr=match[1];
        numStr=match[2];
        multStr=match[3]||"";
    }
    numStr=numStr.trim();
    curStr=curStr.trim().toUpperCase();
    multStr=multStr.trim().toLowerCase();
    if(curStr.endsWith('.')&&curStr!=='FR.')curStr=curStr.slice(0,-1);
    const cleanCurStr=curStr.replace(/[^A-ZА-ЯЁ$€£¥₽₺₴₸₼₹₩₪¢]/g,'');
    let isoCode=CURRENCY_MAP[cleanCurStr]||(Object.values(CURRENCY_MAP).includes(cleanCurStr)?cleanCurStr:null);
    if(!isoCode)return null;
    if(window.location.hostname.endsWith('.by')&&isoCode==='RUB'&&curStr!=='RUB')isoCode='BYN';
    let cleanNum=numStr.replace(/\\s/g,'');
    let separators=cleanNum.match(/[.,]/g);
    let amount=0;
    if(!separators){
        amount=parseFloat(cleanNum);
    }else if(separators.length===1){
        let sep=separators[0];
        let parts=cleanNum.split(sep);
        if(parts[1].length===3&&parts[0]!=='0'&&parts[0]!=='-0'&&!CRYPTO_CODES.includes(isoCode))amount=parseFloat(cleanNum.replace(sep,''));
        else amount=parseFloat(cleanNum.replace(sep,'.'));
    }else{
        let lastSepIdx=Math.max(cleanNum.lastIndexOf('.'),cleanNum.lastIndexOf(','));
        amount=parseFloat(cleanNum.substring(0,lastSepIdx).replace(/[.,]/g,'')+'.'+cleanNum.substring(lastSepIdx+1));
    }
    if(isNaN(amount))return null;
    multStr=multStr.replace('.','');
    if(multStr==='k'||multStr==='тыс'||multStr==='к')amount*=1000;
    else if(multStr==='m'||multStr==='млн'||multStr==='м')amount*=1000000;
    else if(multStr==='b'||multStr==='млрд'||multStr==='б')amount*=1000000000;
    else if(multStr==='t'||multStr==='трлн'||multStr==='т')amount*=1000000000000;
    if(!CRYPTO_CODES.includes(isoCode)){
        if(cleanCurStr==='¢')amount*=0.01;
    }
    const isSatVal=isoCode==='SAT';
    if(isSatVal)amount*=0.00000001;
    const finalCur=isSatVal?'BTC':isoCode;
    return{amount,currency:finalCur,isSat:isSatVal};
}function createBase(x,y,callback){removeTooltip();const t=document.createElement('div');t.id='edge-currency-converter-tooltip';t.style.cssText='all: initial; position: absolute !important; left: '+(x+15)+'px !important; top: '+(y+35)+'px !important; padding: 12px 16px !important; border-radius: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important; z-index: 2147483647 !important; font-family: -apple-system, BlinkMacSystemFont, sans-serif !important; pointer-events: none !important; opacity: 0 !important; transform: translateY(5px) !important; transition: opacity 0.2s, transform 0.2s !important; display: flex !important; flex-direction: column !important; min-width: 140px !important;';chrome.storage.local.get(['theme'],(res)=>{const isDark=res.theme==='dark';const bgColor=isDark?'#161b22':'#ffffff';const textColor=isDark?'#f0f6fc':'#1a1a1a';const borderColor=isDark?'#30363d':'#e0e0e0';t.style.setProperty('background',bgColor,'important');t.style.setProperty('color',textColor,'important');t.style.setProperty('border','1px solid '+borderColor,'important');callback(t,textColor);requestAnimationFrame(()=>{t.style.setProperty('opacity','1','important');t.style.setProperty('transform','translateY(0)','important');});});document.body.appendChild(t);currentTooltip=t;hideTimeout=setTimeout(removeTooltip,7000);}function showTooltip(x,y,val,date,target,lang){
    const locales = {
        'uk': 'uk-UA',
        'ru': 'ru-RU',
        'de': 'de-DE',
        'es': 'es-ES',
        'zh': 'zh-CN',
        'kk': 'kk-KZ'
    };
    const locale = locales[lang] || 'en-US';
    createBase(x,y,(t,textColor)=>{
        const formatted=new Intl.NumberFormat(locale,{
            style:'decimal',
            minimumFractionDigits: val < 0.01 ? 4 : 2,
            maximumFractionDigits: val < 0.01 ? 8 : 2
        }).format(val);
        const icon=date==='Live'?'⚡':'🏛';
        
        const mainSpan = document.createElement('span');
        mainSpan.style.cssText = 'color: '+textColor+' !important; font-family: inherit !important; font-size: 16px!important; font-weight: 800!important; margin-bottom: 4px!important; display: block !important;';
        mainSpan.textContent = formatted + ' ' + target;
        
        const subSpan = document.createElement('span');
        subSpan.style.cssText = 'font-family: inherit !important; font-size: 11px!important; color:#8b949e!important; display: block !important;';
        subSpan.textContent = icon + ' ' + date;
        
        t.appendChild(mainSpan);
        t.appendChild(subSpan);
    });
}
function showUpsell(x,y,cur,tier,m){
    createBase(x,y,(t,textColor)=>{
        const mainSpan = document.createElement('span');
        mainSpan.style.cssText = 'color: '+textColor+' !important; font-family: inherit !important; font-size:13px!important; font-weight:700!important; margin-bottom:4px!important; display: block !important;';
        mainSpan.textContent = '🔒 ' + m.lock + ' ' + cur;
        
        const subSpan = document.createElement('span');
        subSpan.style.cssText = 'font-family: inherit !important; font-size:12px!important; color:#8b949e!important; display: block !important;';
        subSpan.textContent = m.req + ' ';
        
        const b = document.createElement('b');
        b.style.cssText = 'color:#8957e5!important';
        b.textContent = tier;
        
        subSpan.appendChild(b);
        t.appendChild(mainSpan);
        t.appendChild(subSpan);
    });
}function removeTooltip(){if(hideTimeout)clearTimeout(hideTimeout);const existing=document.getElementById('edge-currency-converter-tooltip');if(existing)existing.remove();if(currentTooltip&&currentTooltip.parentNode){try{currentTooltip.remove()}catch(err){}}currentTooltip=null;}`
};
