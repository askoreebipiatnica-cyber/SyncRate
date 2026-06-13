/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  Download, ShieldCheck, RefreshCw, Globe, Sparkles, CheckCircle2, 
  AlertCircle, FileJson, FileCode, Layout, MousePointer2, 
  Coins, Landmark, ChevronRight, Languages, Star, Lock, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { templates } from './templates';

type Language = 'ru' | 'en' | 'zh' | 'kk' | 'de' | 'uk' | 'es';

const translations = {
  ru: {
    title: 'SyncRate',
    subtitle: 'Ультимативный конвертер валют и крипты',
    hero_title: 'Магия конвертации в 1 клик.',
    hero_desc: 'Мгновенно переводит любую валюту на сайте в ваши деньги при выделении текста. 160+ фиатных валют, Нацбанки и Топ-30 крипты.',
    btn_download: 'Установить',
    btn_download_zip: 'Скачать ZIP',
    features_title: 'Почему SyncRate?',
    product_desc_title: 'Что такое SyncRate?',
    product_desc_text: 'SyncRate — это мощное расширение для браузера, которое избавляет вас от необходимости копировать цены и открывать калькулятор. Просто выделите любую сумму на любом сайте, и расширение мгновенно покажет эквивалент в вашей валюте прямо возле курсора. Идеально для онлайн-шопинга, работы с криптой и анализа зарубежных рынков.',
    enterprise_grade_title: 'Корпоративный уровень',
    enterprise_grade_desc: 'Нам доверяют тысячи профессионалов для точного парсинга и конвертации финансовых данных.',
    feature_usd_conv: 'Конвертация USD',
    feature_dashboard_slots: 'слота в дашборде',
    feature_no_crypto: 'Без крипты',
    feature_top8: 'Топ-8 мировых валют',
    feature_dark_mode: 'Поддержка темной темы',
    feature_all_fiats: 'Все 160+ фиатных валют',
    feature_nat_banks: 'Нацбанки (СНГ, ЕС)',
    feature_top30_crypto: 'Поддержка Топ-30 крипты',
    instant_conversion: 'МГНОВЕННАЯ КОНВЕРТАЦИЯ',
    version_badge: 'V15.0 Enterprise Edition',
    tariffs_subtitle: 'Выберите план, который подходит именно вам.',
    popular_badge: 'Популярный',
    demo_price: 'Цена: 129.99 $',
    demo_result: '≈ 12 345 ₽',
    feature_1_title: 'Умный парсинг',
    feature_1_desc: 'Распознает суффиксы K, M, B, тыс, млн, млрд, трлн и любые символы валют.',
    feature_2_title: 'Нацбанки и Крипта',
    feature_2_desc: 'Интеграция с ЦБ РФ, НБУ, НБРБ, ЕЦБ и курсы Топ-30 криптовалют в реальном времени.',
    feature_3_title: 'Конфиденциальность',
    feature_3_desc: 'Никакого сбора данных. Все вычисления происходят локально в вашем браузере.',
    tariffs_title: 'Тарифные планы',
    tier_basic: 'Базовая',
    tier_pro: 'PRO',
    tier_pro_plus: 'PRO+',
    price_free: 'Бесплатно',
    price_pro: '2 $',
    price_pro_plus: '5 $',
    lifetime: 'навсегда',
    desc_basic: 'Только USD. 2 слота в дашборде.',
    desc_pro: '8 валют (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слота. Темная тема.',
    desc_pro_plus: '160+ валют, Нацбанки (СНГ, ЕС), Топ-30 Крипты. Безлимитные слоты.',
    legal_notice: 'ЮРИДИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ',
    legal_desc: 'Этот инструмент предназначен для авторизованных разработчиков. Реверс-инжиниринг, несанкционированное распространение или модификация ядра SyncRate строго запрещены и защищены международными законами об авторском праве и DMCA.',
    copyright: '© 2026 SyncRate. Все права защищены.',
    bundling: 'Сборка...',
    download_zip_desc: 'Загрузите полный исходный код расширения SyncRate v15.0 для ручной установки или деплоя.',
    btn_instructions: 'Инструкция по установке',
    btn_capabilities: 'Возможности',
    modal_instructions_title: 'Как установить SyncRate?',
    modal_capabilities_title: 'Полный список возможностей',
    instruction_step_1: 'Скачайте ZIP-архив с расширением кнопкой выше.',
    instruction_step_2: 'Распакуйте архив в любую постоянную папку на диске.',
    instruction_step_3: 'Откройте страницу расширений в браузере (введите chrome://extensions в адресную строку).',
    instruction_step_4: 'Включите "Режим разработчика" (Developer mode) в правом верхнем углу.',
    instruction_step_5: 'Нажмите кнопку "Загрузить распакованное расширение" (Load unpacked) и выберите папку с расширением.',
    instruction_step_6: 'Закрепите меню расширения в верхней панели браузера для быстрого доступа.',
    instruction_step_7: 'Все настройки расширения (валюта, язык, источник курса) находятся в этом меню.',
    instruction_step_8: 'Обновления будут происходить автоматически "по воздуху" при выходе новой версии.',
    feedback_title: 'Обратная связь',
    feedback_desc: 'Есть идеи по улучшению или нашли ошибку? Мы всегда рады критике и похвале!',
    btn_feedback: 'Написать разработчику',
    update_title: 'Авто-обновления',
    update_desc: 'SyncRate Enterprise теперь поддерживает автоматические обновления. Вам больше не нужно скачивать архивы вручную — расширение обновится само.',
    download: "Скачать расширение",
    browsers_supported: "Поддерживаемые браузеры",
    capability_1: "Конвертация 160+ валют",
    capability_2: "Курсы Нацбанков (ЦБ РФ, ЕЦБ, НБУ, НБРБ)",
    capability_3: "Топ-30 Криптовалют в реальном времени",
    capability_4: "Умный парсинг текста (K, M, B, символы)",
    capability_5: "Настраиваемый дашборд в поп-апе",
    capability_6: "Автоматическое обновление курсов",
    capability_7: "Темная и светлая темы",
    capability_8: "Поддержка 7 языков интерфейса",
    free_test_title: "Попробуйте PRO+ бесплатно",
    free_test_desc: "Установите расширение сейчас и получите 48 часов полного доступа ко всем Enterprise-функциям автоматически.",
    btn_start_test: "Начать бесплатный тест",
    ready: 'Готово!'
  },
  en: {
    title: 'SyncRate',
    subtitle: 'The Ultimate Currency & Crypto Converter',
    hero_title: 'Magic conversion in 1 click.',
    hero_desc: 'Instantly convert any currency on a website to your money by highlighting text. 160+ fiats, National Banks, and Top-30 Crypto.',
    btn_download: 'Install',
    btn_download_zip: 'Download ZIP',
    features_title: 'Why SyncRate?',
    product_desc_title: 'What is SyncRate?',
    product_desc_text: 'SyncRate is a powerful browser extension that eliminates the need to copy prices and open a calculator. Simply highlight any amount on any website, and the extension will instantly show the equivalent in your currency right next to the cursor. Perfect for online shopping, crypto trading, and analyzing foreign markets.',
    enterprise_grade_title: 'Enterprise Grade',
    enterprise_grade_desc: 'Trusted by thousands of professionals for accurate financial data parsing and conversion.',
    feature_usd_conv: 'USD Conversion',
    feature_dashboard_slots: 'Dashboard Slots',
    feature_no_crypto: 'No Crypto',
    feature_top8: 'Top-8 World Currencies',
    feature_dark_mode: 'Dark Mode Support',
    feature_all_fiats: 'All 160+ Fiat Currencies',
    feature_nat_banks: 'National Banks (CIS, EU)',
    feature_top30_crypto: 'Top-30 Crypto Support',
    instant_conversion: 'INSTANT CONVERSION',
    version_badge: 'V15.0 Enterprise Edition',
    tariffs_subtitle: 'Choose the plan that fits your needs.',
    popular_badge: 'Popular',
    demo_price: 'Price: 129.99 $',
    demo_result: '≈ 120.50 €',
    feature_1_title: 'Smart Parsing',
    feature_1_desc: 'Recognizes suffixes like K, M, B, millions, billions and any currency symbols.',
    feature_2_title: 'Banks & Crypto',
    feature_2_desc: 'Integration with ECB, CBRF, NBU, NBRB and real-time Top-30 Crypto rates.',
    feature_3_title: 'Privacy First',
    feature_3_desc: 'No data collection. All calculations happen locally in your browser.',
    tariffs_title: 'Pricing Plans',
    tier_basic: 'Basic',
    tier_pro: 'PRO',
    tier_pro_plus: 'PRO+',
    price_free: 'Free',
    price_pro: '2 $',
    price_pro_plus: '5 $',
    lifetime: 'lifetime',
    desc_basic: 'Only USD. 2 dashboard slots.',
    desc_pro: '8 currencies (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 slots. Dark mode.',
    desc_pro_plus: '160+ fiats, National Banks (CIS, EU), Top-30 Crypto. Unlimited slots.',
    legal_notice: 'LEGAL NOTICE',
    legal_desc: 'This tool is provided for authorized developers only. Reverse engineering, unauthorized distribution, or modification of the SyncRate core engine is strictly prohibited and protected under international copyright and DMCA laws.',
    copyright: '© 2026 SyncRate. All rights reserved.',
    bundling: 'Bundling...',
    download_zip_desc: 'Download the complete source code for SyncRate v15.0 for manual installation or deployment.',
    btn_instructions: 'Installation Guide',
    btn_capabilities: 'Capabilities',
    modal_instructions_title: 'How to install SyncRate?',
    modal_capabilities_title: 'Full List of Capabilities',
    instruction_step_1: 'Download the ZIP archive using the button above.',
    instruction_step_2: 'Unpack the archive into any permanent folder on your drive.',
    instruction_step_3: 'Open the extensions page in your browser (type chrome://extensions in the address bar).',
    instruction_step_4: 'Enable "Developer mode" in the top right corner.',
    instruction_step_5: 'Click "Load unpacked" and select the folder containing the extension.',
    instruction_step_6: 'Pin the extension to the top toolbar for quick access.',
    instruction_step_7: 'All settings (currency, language, rate source) are located in this menu.',
    instruction_step_8: 'Updates will happen automatically "over-the-air" when a new version is released.',
    feedback_title: 'Feedback',
    feedback_desc: 'Have ideas for improvement or found a bug? We always welcome criticism and praise!',
    btn_feedback: 'Contact Developer',
    update_title: 'Auto-Updates',
    update_desc: 'SyncRate Enterprise now supports over-the-air automatic updates. No more manual ZIP downloads — the extension updates itself.',
    download: "Download Extension",
    browsers_supported: "Supported Browsers",
    capability_1: "160+ Currencies Conversion",
    capability_2: "National Banks (ECB, CBR, NBU, NBRB)",
    capability_3: "Top-30 Crypto in Real-time",
    capability_4: "Smart Text Parsing (K, M, B, symbols)",
    capability_5: "Customizable Popup Dashboard",
    capability_6: "Automatic Rate Updates",
    capability_7: "Dark and Light Themes",
    capability_8: "Support for 7 Interface Languages",
    free_test_title: "Try PRO+ for Free",
    free_test_desc: "Install the extension now and get 48 hours of full access to all Enterprise features automatically.",
    btn_start_test: "Start Free Test",
    ready: 'Ready!'
  },
  zh: {
    title: 'SyncRate',
    subtitle: '终极货币和加密货币转换器',
    hero_title: '一键魔力转换',
    hero_desc: '突出显示网站上的任何货币，即可立即将其转换为您的本地货币。支持160多种法定货币、国家银行和前30名加密货币。',
    btn_download: '安装',
    btn_download_zip: '下载 ZIP',
    features_title: '为什么选择 SyncRate？',
    product_desc_title: '什么是 SyncRate？',
    product_desc_text: 'SyncRate 是一款功能强大的浏览器扩展，无需复制价格和打开计算器。只需突出显示任何网站上的任何金额，扩展程序就会立即在光标旁边显示等值的本地货币。非常适合在线购物、加密货币交易和分析国外市场。',
    enterprise_grade_title: '企业级',
    enterprise_grade_desc: '深受数千名专业人士信赖，可进行准确的财务数据解析和转换。',
    feature_usd_conv: '美元转换',
    feature_dashboard_slots: '个仪表板插槽',
    feature_no_crypto: '无加密货币',
    feature_top8: '全球前8大货币',
    feature_dark_mode: '深色模式支持',
    feature_all_fiats: '所有 160 多种法定货币',
    feature_nat_banks: '国家银行（独联体、欧盟）',
    feature_top30_crypto: '前30名加密货币支持',
    instant_conversion: '即时转换',
    version_badge: 'V15.0 企业版',
    tariffs_subtitle: '选择适合您需求的计划。',
    popular_badge: '热门',
    demo_price: '价格: 129.99 $',
    demo_result: '≈ 935.50 ¥',
    feature_1_title: '智能解析',
    feature_1_desc: '识别 K、M、B、百万、十亿等后缀以及任何货币符号。',
    feature_2_title: '银行与加密货币',
    feature_2_desc: '与 ECB、CBRF、NBU、NBRB 集成，并提供实时前30名加密货币汇率。',
    feature_3_title: '隐私至上',
    feature_3_desc: '不收集数据。所有计算都在您的浏览器本地进行。',
    tariffs_title: '定价计划',
    tier_basic: '基础版',
    tier_pro: '专业版',
    tier_pro_plus: '专业增强版',
    price_free: '免费',
    price_pro: '2 美元',
    price_pro_plus: '5 美元',
    lifetime: '终身',
    desc_basic: '仅限美元。2个仪表板插槽。',
    desc_pro: '8 种货币 (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED)。4 个插槽。深色模式。',
    desc_pro_plus: '160+ 法定货币，国家银行（独联体，欧盟），前30名加密货币。无限插槽。',
    legal_notice: '法律声明',
    legal_desc: '此工具仅供授权开发人员使用。严禁对 SyncRate 核心引擎进行逆向工程、未经授权的分发或修改，并受国际版权法和 DMCA 的保护。',
    copyright: '© 2026 SyncRate。保留所有权利。',
    bundling: '打包中...',
    download_zip_desc: '下载 SyncRate v15.0 的完整源代码，用于手动安装或部署。',
    btn_instructions: '安装指南',
    btn_capabilities: '功能介绍',
    modal_instructions_title: '如何安装 SyncRate？',
    modal_capabilities_title: '完整功能列表',
    instruction_step_1: '使用上面的按钮下载 ZIP 压缩包。',
    instruction_step_2: '将压缩包解压到磁盘上的任何永久文件夹中。',
    instruction_step_3: '在浏览器中打开扩展程序页面（在地址栏输入 chrome://extensions）。',
    instruction_step_4: '打开右上角的“开发者模式”。',
    instruction_step_5: '点击“加载已解压的扩展程序”并选择包含扩展程序的文件夹。',
    instruction_step_6: '将扩展程序固定在顶部工具栏以便快速访问。',
    instruction_step_7: '所有设置（货币、语言、汇率来源）都位于此菜单中。',
    instruction_step_8: '当新版本发布时，更新将通过“空中下载”自动进行。',
    feedback_title: '反馈',
    feedback_desc: '有改进建议或发现错误？我们随时欢迎您的批评和表扬！',
    btn_feedback: '联系开发人员',
    update_title: '自动更新',
    update_desc: 'SyncRate Enterprise 现在支持空中下载自动更新。不再需要手动下载 ZIP — 扩展程序会自动更新。',
    free_test_title: "免费试用 PRO+",
    free_test_desc: "立即安装扩展程序，即可自动获得 48 小时所有企业级功能的完整访问权限。",
    btn_start_test: "开始免费测试",
    ready: '完成！'
  },
  kk: {
    title: 'SyncRate',
    subtitle: 'Валюта және крипто конвертері',
    hero_title: '1 рет басу арқылы сиқырлы конвертация.',
    hero_desc: 'Мәтінді белгілеу арқылы сайттағы кез келген валютаны өз ақшаңызға лезде аударыңыз. 160+ фиаттық валюта, Ұлттық банктер және Топ-30 крипто.',
    btn_download: 'Орнату',
    btn_download_zip: 'ZIP жүктеу',
    features_title: 'Неліктен SyncRate?',
    product_desc_title: 'SyncRate дегеніміз не?',
    product_desc_text: 'SyncRate — бағаларды көшіру және калькуляторды ашу қажеттілігін жоятын қуатты браузер кеңейтімі. Кез келген сайттағы кез келген соманы белгілеңіз, сонда кеңейтім курсордың жанында өз валютаңыздағы баламаны лезде көрсетеді. Онлайн-шопинг, криптомен жұмыс және шетелдік нарықтарды талдау үшін өте қолайлы.',
    enterprise_grade_title: 'Корпоративтік деңгей',
    enterprise_grade_desc: 'Қаржылық деректерді дәл талдау және айырбастау үшін мыңдаған мамандар бізге сенеді.',
    feature_usd_conv: 'USD конвертациясы',
    feature_dashboard_slots: 'дашбордтағы слот',
    feature_no_crypto: 'Криптосыз',
    feature_top8: 'Әлемдік топ-8 валюта',
    feature_dark_mode: 'Қараңғы тақырыпты қолдау',
    feature_all_fiats: 'Барлық 160+ фиаттық валюта',
    feature_nat_banks: 'Ұлттық банктер (ТМД, ЕО)',
    feature_top30_crypto: 'Топ-30 криптоны қолдау',
    instant_conversion: 'ЛЕЗДЕ КОНВЕРТАЦИЯЛАУ',
    version_badge: 'V15.0 Enterprise Edition',
    tariffs_subtitle: 'Сіздің қажеттіліктеріңізге сәйкес келетін жоспарды таңдаңыз.',
    popular_badge: 'Танымал',
    demo_price: 'Бағасы: 129.99 $',
    demo_result: '≈ 58 450 ₸',
    feature_1_title: 'Ақылды парсинг',
    feature_1_desc: 'K, M, B, мың, млн, млрд, трлн суффикстерін және кез келген валюта белгілерін таниды.',
    feature_2_title: 'Ұлттық банктер және Крипто',
    feature_2_desc: 'РФ Орталық банкі, ҰБ, БРҰБ, ЕОБ интеграциясы және нақты уақыттағы Топ-30 криптовалюта бағамдары.',
    feature_3_title: 'Құпиялылық',
    feature_3_desc: 'Деректер жиналмайды. Барлық есептеулер браузеріңізде жергілікті түрде орындалады.',
    tariffs_title: 'Тарифтік жоспарлар',
    tier_basic: 'Негізгі',
    tier_pro: 'PRO',
    tier_pro_plus: 'PRO+',
    price_free: 'Тегін',
    price_pro: '2 $',
    price_pro_plus: '5 $',
    lifetime: 'мәңгілікке',
    desc_basic: 'Тек USD. Дашбордта 2 слот.',
    desc_pro: '8 валюта (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слот. Қараңғы тақырып.',
    desc_pro_plus: '160+ валюта, Ұлттық банктер (ТМД, ЕО), Топ-30 Крипто. Шексіз слоттар.',
    legal_notice: 'ҚҰҚЫҚТЫҚ ЕСКЕРТУ',
    legal_desc: 'Бұл құрал тек уәкілетті әзірлеушілерге арналған. SyncRate негізгі қозғалтқышын кері инжинирингтеуге, рұқсатсыз таратуға немесе өзгертуге қатаң тыйым салынады және халықаралық авторлық құқық және DMCA заңдарымен қорғалады.',
    copyright: '© 2026 SyncRate. Барлық құқықтар қорғалған.',
    bundling: 'Жинақтау...',
    download_zip_desc: 'Қолмен орнату немесе деплой жасау үшін SyncRate v15.0 кеңейтімінің толық бастапқы кодын жүктеңіз.',
    btn_instructions: 'Орнату нұсқаулығы',
    btn_capabilities: 'Мүмкіндіктер',
    modal_instructions_title: 'SyncRate қалай орнатылады?',
    modal_capabilities_title: 'Мүмкіндіктердің толық тізімі',
    instruction_step_1: 'Жоғарыдағы батырма арқылы ZIP мұрағатын жүктеңіз.',
    instruction_step_2: 'Мұрағатты дискідегі кез келген тұрақты қалтаға шығарыңыз.',
    instruction_step_3: 'Браузерде кеңейтімдер бетін ашыңыз (мекенжай жолына chrome://extensions енгізіңіз).',
    instruction_step_4: 'Жоғарғы оң жақ бұрыштағы "Әзірлеуші режимін" (Developer mode) қосыңыз.',
    instruction_step_5: '"Жүктелген кеңейтімді жүктеу" (Load unpacked) батырмасын басып, кеңейтімі бар қалтаны таңдаңыз.',
    instruction_step_6: 'Жылдам қол жеткізу үшін кеңейтімді жоғарғы панельге бекітіңіз.',
    instruction_step_7: 'Кеңейтімнің барлық параметрлері (валюта, тіл, курс көзі) осы мәзірде орналасқан.',
    instruction_step_8: 'Кеңейтімді жаңарту үшін жаңа ZIP жүктеп алып, орнатуды қайталаңыз (ескі параметрлер сақталады).',
    feedback_title: 'Кері байланыс',
    feedback_desc: 'Жақсарту бойынша идеяларыңыз бар ма немесе қате таптыңыз ба? Біз әрқашан сын мен мақтауға қуаныштымыз!',
    btn_feedback: 'Әзірлеушіге жазу',
    update_title: 'Авто-жаңартулар',
    update_desc: 'SyncRate Enterprise енді әуе арқылы автоматты жаңартуларды қолдайды. ZIP файлдарын қолмен жүктеудің қажеті жоқ — кеңейтім өзі жаңартылады.',
    free_test_title: "PRO+ нұсқасын тегін қолданып көріңіз",
    free_test_desc: "Кеңейтімді қазір орнатыңыз және барлық Enterprise функцияларына 48 сағаттық толық қолжетімділікті автоматты түрде алыңыз.",
    btn_start_test: "Тегін тестті бастау",
    ready: 'Дайын!'
  },
  de: {
    title: 'SyncRate',
    subtitle: 'Der ultimative Währungs- und Kryptokonverter',
    hero_title: 'Magische Konvertierung mit 1 Klick.',
    hero_desc: 'Konvertieren Sie jede Währung auf einer Website sofort in Ihr Geld, indem Sie Text markieren. 160+ Fiats, Nationalbanken und Top-30 Krypto.',
    btn_download: 'Installieren',
    btn_download_zip: 'ZIP laden',
    features_title: 'Warum SyncRate?',
    product_desc_title: 'Was ist SyncRate?',
    product_desc_text: 'SyncRate ist eine leistungsstarke Browser-Erweiterung, die das Kopieren von Preisen und das Öffnen eines Taschenrechners überflüssig macht. Markieren Sie einfach einen Betrag auf einer beliebigen Website, und die Erweiterung zeigt sofort den Gegenwert in Ihrer Währung direkt neben dem Cursor an. Perfekt für Online-Shopping, Krypto-Handel und die Analyse ausländischer Märkte.',
    enterprise_grade_title: 'Enterprise-Niveau',
    enterprise_grade_desc: 'Tausende von Fachleuten vertrauen uns für die genaue Analyse und Konvertierung von Finanzdaten.',
    feature_usd_conv: 'USD-Konvertierung',
    feature_dashboard_slots: 'Dashboard-Slots',
    feature_no_crypto: 'Kein Krypto',
    feature_top8: 'Top-8 Weltwährungen',
    feature_dark_mode: 'Unterstützung für Dunkelmodus',
    feature_all_fiats: 'Alle 160+ Fiat-Währungen',
    feature_nat_banks: 'Nationalbanken (GUS, EU)',
    feature_top30_crypto: 'Top-30 Krypto-Unterstützung',
    instant_conversion: 'SOFORTIGE KONVERTIERUNG',
    version_badge: 'V15.0 Enterprise Edition',
    tariffs_subtitle: 'Wählen Sie den Plan, der zu Ihren Bedürfnissen passt.',
    popular_badge: 'Beliebt',
    demo_price: 'Preis: 129.99 $',
    demo_result: '≈ 120.50 €',
    feature_1_title: 'Intelligentes Parsing',
    feature_1_desc: 'Erkennt Suffixe wie K, M, B, Millionen, Milliarden und alle Währungssymbole.',
    feature_2_title: 'Banken & Krypto',
    feature_2_desc: 'Integration mit EZB, CBRF, NBU, NBRB und Echtzeit-Top-30-Kryptokurse.',
    feature_3_title: 'Datenschutz zuerst',
    feature_3_desc: 'Keine Datenerfassung. Alle Berechnungen erfolgen lokal in Ihrem Browser.',
    tariffs_title: 'Tarifpläne',
    tier_basic: 'Basis',
    tier_pro: 'PRO',
    tier_pro_plus: 'PRO+',
    price_free: 'Kostenlos',
    price_pro: '2 $',
    price_pro_plus: '5 $',
    lifetime: 'auf Lebenszeit',
    desc_basic: 'Nur USD. 2 Dashboard-Slots.',
    desc_pro: '8 Währungen (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 Slots. Dunkelmodus.',
    desc_pro_plus: '160+ Fiats, Nationalbanken (GUS, EU), Top-30 Krypto. Unbegrenzte Slots.',
    legal_notice: 'RECHTLICHER HINWEIS',
    legal_desc: 'Dieses Tool wird nur für autorisierte Entwickler bereitgestellt. Reverse Engineering, unbefugte Verbreitung oder Modifikation der SyncRate Core Engine ist strengstens untersagt.',
    copyright: '© 2026 SyncRate. Alle Rechte vorbehalten.',
    bundling: 'Bündelung...',
    download_zip_desc: 'Laden Sie den vollständigen Quellcode von SyncRate v15.0 für die manuelle Installation herunter.',
    btn_instructions: 'Installationsanleitung',
    btn_capabilities: 'Funktionen',
    modal_instructions_title: 'Wie installiere ich SyncRate?',
    modal_capabilities_title: 'Vollständige Funktionsliste',
    instruction_step_1: 'Laden Sie das ZIP-Archiv über die Schaltfläche oben herunter.',
    instruction_step_2: 'Entpacken Sie das Archiv in einen permanenten Ordner auf Ihrer Festplatte.',
    instruction_step_3: 'Öffnen Sie die Erweiterungsseite in Ihrem Browser (geben Sie chrome://extensions in die Adressleiste ein).',
    instruction_step_4: 'Aktivieren Sie den "Entwicklermodus" oben rechts.',
    instruction_step_5: 'Klicken Sie auf "Entpackte Erweiterung laden" und wählen Sie den Ordner mit der Erweiterung aus.',
    instruction_step_6: 'Fixieren Sie die Erweiterung in der oberen Symbolleiste für schnellen Zugriff.',
    instruction_step_7: 'Alle Einstellungen (Währung, Sprache, Kursquelle) befinden sich in diesem Menü.',
    instruction_step_8: 'Updates erfolgen automatisch "over-the-air", wenn eine neue Version veröffentlicht wird.',
    feedback_title: 'Feedback',
    feedback_desc: 'Haben Sie Verbesserungsvorschläge oder einen Fehler gefunden? Wir freuen uns immer über Kritik und Lob!',
    btn_feedback: 'Entwickler kontaktieren',
    update_title: 'Auto-Updates',
    update_desc: 'SyncRate Enterprise unterstützt jetzt automatische Over-the-Air-Updates. Keine manuellen ZIP-Downloads mehr – die Erweiterung aktualisiert sich von selbst.',
    free_test_title: "PRO+ kostenlos testen",
    free_test_desc: "Installieren Sie die Erweiterung jetzt und erhalten Sie automatisch 48 Stunden vollen Zugriff auf alle Enterprise-Funktionen.",
    btn_start_test: "Kostenlosen Test starten",
    ready: 'Fertig!'
  },
  uk: {
    title: 'SyncRate',
    btn_download: 'Завантажити',
    btn_download_zip: 'Завантажити ZIP',
    hero_title: 'Миттєва конвертація валют у вашому браузері',
    hero_subtitle: 'Просто виділіть суму на будь-якому сайті, і SyncRate миттєво покаже еквівалент у вашій валюті.',
    download: 'Завантажити SyncRate v15.0',
    features_title: 'Можливості',
    product_desc_title: 'Що таке SyncRate?',
    product_desc_text: 'SyncRate — це потужне розширення для браузера, яке позбавляє необхідності копіювати ціни та відкривати калькулятор. Просто виділіть суму на будь-якому сайті, і розширення миттєво покаже еквівалент у вашій валюті прямо біля курсору. Ідеально для онлайн-шопінгу, криптотрейдингу та аналізу іноземних ринків.',
    enterprise_grade_title: 'Рівень Enterprise',
    enterprise_grade_desc: 'Тисячі професіоналів довіряють нам точний аналіз та конвертацію фінансових даних.',
    feature_usd_conv: 'Конвертація USD',
    feature_dashboard_slots: 'Слоти дашборду',
    feature_no_crypto: 'Без крипто',
    feature_top8: 'Топ-8 світових валют',
    feature_dark_mode: 'Підтримка темної теми',
    feature_all_fiats: 'Всі 160+ фіатних валют',
    feature_nat_banks: 'Нацбанки (СНД, ЄС)',
    feature_top30_crypto: 'Підтримка топ-30 крипто',
    instant_conversion: 'МИТТЄВА КОНВЕРТАЦІЯ',
    version_badge: 'V15.0 Enterprise Edition',
    tariffs_subtitle: 'Оберіть план, який відповідає вашим потребам.',
    popular_badge: 'Популярно',
    demo_price: 'Ціна: 129.99 $',
    demo_result: '≈ 5 432.10 ₴',
    feature_1_title: 'Розумний парсинг',
    feature_1_desc: 'Розпізнає суфікси K, M, B, мільйони, мільярди та всі символи валют.',
    feature_2_title: 'Банки та Крипто',
    feature_2_desc: 'Інтеграція з ЄЦБ, ЦБРФ, НБУ, НБРБ та актуальні курси топ-30 крипто.',
    feature_3_title: 'Приватність перш за все',
    feature_3_desc: 'Ніякого збору даних. Всі розрахунки відбуваються локально у вашому браузері.',
    tariffs_title: 'Тарифні плани',
    tier_basic: 'Базовий',
    tier_pro: 'PRO',
    tier_pro_plus: 'PRO+',
    price_free: 'Безкоштовно',
    price_pro: '2 $',
    price_pro_plus: '5 $',
    lifetime: 'назавжди',
    desc_basic: 'Тільки USD. 2 слоти дашборду.',
    desc_pro: '8 валют (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 слоти. Темна тема.',
    desc_pro_plus: '160+ фіатів, Нацбанки (СНД, ЄС), топ-30 крипто. Безлімітні слоти.',
    legal_notice: 'ЮРИДИЧНЕ ПОВІДОМЛЕННЯ',
    legal_desc: 'Цей інструмент надається тільки для авторизованих розробників. Реверс-інжиніринг, несанкціоноване розповсюдження або модифікація SyncRate Core Engine суворо заборонені та захищені міжнародними законами про авторське право та DMCA.',
    copyright: '© 2026 SyncRate. Всі права захищені.',
    bundling: 'Збірка...',
    download_zip_desc: 'Завантажте повний вихідний код SyncRate v15.0 для ручного встановлення або розгортання.',
    btn_instructions: 'Інструкція зі встановлення',
    btn_capabilities: 'Можливості',
    modal_instructions_title: 'Як встановити SyncRate?',
    modal_capabilities_title: 'Повний список можливостей',
    instruction_step_1: 'Завантажте ZIP-архів, натиснувши кнопку вище.',
    instruction_step_2: 'Розпакуйте архів у постійну папку на вашому диску.',
    instruction_step_3: 'Відкрийте сторінку розширень у вашому браузері (введіть chrome://extensions в адресному рядку).',
    instruction_step_4: 'Увімкніть "Режим розробника" у верхньому правому куті.',
    instruction_step_5: 'Натисніть "Завантажити розпаковане розширення" та виберіть папку з розширенням.',
    instruction_step_6: 'Закріпіть меню розширення у верхній панелі браузера для швидкого доступу.',
    instruction_step_7: 'Всі налаштування розширення (валюта, мова, джерело курсу) знаходяться в цьому меню.',
    instruction_step_8: 'Оновлення відбуватимуться автоматично "по повітрю" при виході нової версії.',
    feedback_title: 'Зворотній зв\'язок',
    feedback_desc: 'Маєте ідеї щодо покращення або знайшли помилку? Ми завжди раді критиці та похвалі!',
    btn_feedback: 'Написати розробнику',
    update_title: 'Авто-оновлення',
    update_desc: 'SyncRate Enterprise тепер підтримує автоматичні оновлення по повітрю. Вам більше не потрібно завантажувати архіви вручную — розширення оновиться саме.',
    ready: 'Готово!',
    browsers_supported: 'Підтримувані браузери: Chrome, Edge, Brave, Opera, Vivaldi (всі на базі Chromium).',
    capability_1: 'Миттєва конвертація при виділенні суми на сторінці.',
    capability_2: 'Підтримка 160+ фіатних валют з автоматичним оновленням курсів.',
    capability_3: 'Офіційні курси нацбанків (ЄЦБ, ЦБРФ, НБУ, НБРБ).',
    capability_4: 'Підтримка топ-30 криптовалют (Bitcoin, Ethereum, Solana тощо).',
    capability_5: 'Розумний парсинг: розуміє "10k", "$5.5M", "1.2 млрд" та інші скорочення.',
    capability_6: 'Дашборд, що налаштовується, для відстеження обраних курсів.',
    capability_7: 'Автоматична темна тема та мінімалістичний дизайн.',
    capability_8: '100% приватність: розширення не збирає дані та не має бекенду.',
    free_test_title: "Спробуйте PRO+ безкоштовно",
    free_test_desc: "Встановіть розширення зараз та отримайте 48 годин повного доступу до всіх Enterprise-функцій автоматично.",
    btn_start_test: "Почати безкоштовний тест"
  },
  es: {
    title: 'SyncRate',
    subtitle: 'El convertidor definitivo de divisas y criptomonedas',
    hero_title: 'Magia de conversión en 1 clic.',
    hero_desc: 'Convierte instantáneamente cualquier divisa en una página web a tu moneda al seleccionar el texto. 160+ divisas fiat, Bancos Nacionales y Top-30 cripto.',
    demo_price: 'Precio: 129.99 USD',
    demo_result: '121.50 €',
    btn_download: 'Instalar',
    btn_download_zip: 'Descargar ZIP',
    features_title: '¿Por qué SyncRate?',
    product_desc_title: '¿Qué es SyncRate?',
    product_desc_text: 'SyncRate es una potente extensión de navegador que elimina la necesidad de copiar precios y abrir una calculadora. Simplemente selecciona cualquier cantidad en cualquier sitio web y la extensión mostrará instantáneamente el equivalente en tu moneda justo al lado del cursor. Ideal para compras en línea, criptomonedas y análisis de mercados extranjeros.',
    enterprise_grade_title: 'Nivel Empresarial',
    enterprise_grade_desc: 'Miles de profesionales confían en nosotros para un análisis y conversión precisos de datos financieros.',
    feature_usd_conv: 'Conversión de USD',
    feature_dashboard_slots: 'ranuras en panel',
    feature_no_crypto: 'Sin criptomonedas',
    feature_top8: 'Top-8 Monedas Mundiales',
    feature_dark_mode: 'Soporte de modo oscuro',
    feature_all_fiats: 'Todas las 160+ monedas fiat',
    feature_nat_banks: 'Bancos Nacionales (GUS, UE)',
    feature_top30_crypto: 'Top-30 Criptomonedas',
    instant_conversion: 'CONVERSIÓN INSTANTÁNEA',
    version_badge: 'Edición empresarial V15.0',
    tariffs_subtitle: 'Elija el plan que se adapte a sus necesidades.',
    popular_badge: 'Popular',
    feature_1_title: 'Análisis Inteligente',
    feature_1_desc: 'Reconoce sufijos K, M, B, millones, miles de millones y todos los símbolos de moneda.',
    feature_2_title: 'Bancos y Cripto',
    feature_2_desc: 'Integración con BCE, CBRF, NBU, NBRB y tasas actualizadas de las 30 principales criptomonedas.',
    feature_3_title: 'Privacidad Primero',
    feature_3_desc: 'Sin recolección de datos. Todos los cálculos ocurren localmente en tu navegador.',
    tariffs_title: 'Planes de Precios',
    tier_basic: 'Básico',
    tier_pro: 'PRO',
    tier_pro_plus: 'PRO+',
    price_free: 'Gratis',
    price_pro: '2 $',
    price_pro_plus: '5 $',
    lifetime: 'de por vida',
    desc_basic: 'Solo USD. 2 ranuras en el panel.',
    desc_pro: '8 monedas (USD, EUR, GBP, CHF, JPY, CNY, CAD, AED). 4 ranuras. Modo oscuro.',
    desc_pro_plus: '160+ fiats, Bancos Nacionales (GUS, UE), Top-30 Cripto. Ranuras ilimitadas.',
    legal_notice: 'AVISO LEGAL',
    legal_desc: 'Esta herramienta se proporciona solo para desarrolladores autorizados. La ingeniería inversa, distribución no autorizada o modificación del motor central de SyncRate está estrictamente prohibida.',
    copyright: '© 2026 SyncRate. Todos los derechos reservados.',
    bundling: 'Empaquetando...',
    download_zip_desc: 'Descarga el código fuente completo de SyncRate v15.0 para instalación manual.',
    btn_instructions: 'Guía de Instalación',
    btn_capabilities: 'Capacidades',
    modal_instructions_title: '¿Cómo instalar SyncRate?',
    modal_capabilities_title: 'Lista Completa de Capacidades',
    instruction_step_1: 'Descarga el archivo ZIP usando el botón de arriba.',
    instruction_step_2: 'Descomprime el archivo en cualquier carpeta permanente de tu disco.',
    instruction_step_3: 'Abre la página de extensiones en tu navegador (escribe chrome://extensions en la barra de direcciones).',
    instruction_step_4: 'Activa el "Modo de desarrollador" en la esquina superior derecha.',
    instruction_step_5: 'Haz clic en "Cargar descomprimida" y selecciona la carpeta que contiene la extensión.',
    instruction_step_6: 'Fija la extensión en la barra de herramientas superior para un acceso rápido.',
    instruction_step_7: 'Todos los ajustes (moneda, idioma, fuente de tasa) se encuentran en este menú.',
    instruction_step_8: 'Las actualizaciones se realizarán automáticamente "por aire" cuando se lance una nueva versión.',
    feedback_title: 'Comentarios',
    feedback_desc: '¿Tiene ideas para mejorar o encontró un error? ¡Siempre agradecemos las críticas y elogios!',
    btn_feedback: 'Contactar al desarrollador',
    update_title: 'Auto-actualizaciones',
    update_desc: 'SyncRate Enterprise ahora admite actualizaciones automáticas por aire. No más descargas manuales de ZIP: la extensión se actualiza sola.',
    download: "Descargar Extensión",
    browsers_supported: "Navegadores compatibles: Chrome, Edge, Brave, Opera, Vivaldi (todos basados en Chromium).",
    capability_1: 'Conversión instantánea al seleccionar el importe.',
    capability_2: 'Más de 160 monedas con actualización automática.',
    capability_3: 'Tipos oficiales de bancos nacionales.',
    capability_4: 'Soporte para top-30 de criptomonedas.',
    capability_5: 'Análisis inteligente del texto (sufijos y símbolos).',
    capability_6: 'Panel de control personalizable.',
    capability_7: 'Modo oscuro automático y diseño minimalista.',
    capability_8: 'Privacidad 100%: sin cookies, trackers o servidores externos.',
    free_test_title: "Pruebe PRO+ Gratis",
    free_test_desc: "Instale la extensión ahora y obtenga automáticamente 48 horas de acceso completo a todas las funciones Enterprise.",
    btn_start_test: "Comenzar Prueba Gratis",
    ready: '¡Listo!'
  }
};

const ConversionAnimation = ({ price, result }: { price: string, result: string }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 shadow-2xl relative overflow-hidden w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-[#30363d] pb-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        
        <div className="relative text-xl font-medium text-[#c9d1d9] mb-8 py-2">
          {price.split(' ').map((word, i) => {
            const isTarget = word.includes('129.99') || word.includes('$') || word.includes('€') || word.includes('₽') || word.includes('₴');
            return (
              <span key={i} className="relative inline-block mr-2">
                {isTarget ? (
                  <motion.span
                    initial={{ backgroundColor: '#00000000' }}
                    animate={{ backgroundColor: ['#00000000', '#6e40c9', '#6e40c9', '#00000000'] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.3, 0.8, 1] }}
                    className="px-1 rounded text-white"
                  >
                    {word}
                  </motion.span>
                ) : word}
              </span>
            );
          })}
          
          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ 
              opacity: [0, 0, 1, 1, 0],
              scale: [0.8, 0.8, 1, 1, 0.8],
              y: [10, 10, 0, 0, 10]
            }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 0.8, 1] }}
            className="absolute left-[140px] top-[45px] bg-[#161b22] border border-[#30363d] p-3 rounded-xl shadow-xl z-20 min-w-[120px]"
          >
            <div className="text-sm font-bold text-[#f0f6fc] mb-1">{result}</div>
            <div className="text-[10px] text-[#8b949e] flex items-center gap-1">
              <span>⚡</span> Live Market
            </div>
          </motion.div>
          
          {/* Cursor */}
          <motion.div
            initial={{ x: -20, y: 10, opacity: 0 }}
            animate={{ 
              x: [-20, 40, 160, 160, -20],
              y: [10, 10, 10, 10, 10],
              opacity: [0, 1, 1, 1, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.8, 0.9, 1] }}
            className="absolute top-1 left-0 pointer-events-none z-20"
          >
            <MousePointer2 className="w-5 h-5 text-white fill-white shadow-lg" />
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ 
              opacity: [0, 0, 1, 1, 0],
              scale: [0.8, 0.8, 1, 1, 0.8],
              y: [10, 10, 0, 0, 10]
            }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 0.8, 0.9] }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-[#161b22] border border-[#6e40c9] rounded-xl px-4 py-2 shadow-[0_0_20px_rgba(110,64,201,0.3)] flex items-center gap-2 whitespace-nowrap z-30"
          >
            <div className="w-6 h-6 bg-[#6e40c9] rounded flex items-center justify-center">
              <RefreshCw className="w-3 h-3 text-white animate-spin-slow" />
            </div>
            <span className="text-sm font-bold text-white">{result}</span>
          </motion.div>
        </div>

        <div className="space-y-2 opacity-20">
          <div className="h-2 bg-[#30363d] rounded w-3/4" />
          <div className="h-2 bg-[#30363d] rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'ru') setLang('ru');
    else if (browserLang === 'de') setLang('de');
    else if (browserLang === 'uk' || browserLang === 'ua') setLang('uk');
    else if (browserLang === 'zh') setLang('zh');
    else if (browserLang === 'kk') setLang('kk');
    else if (browserLang === 'es') setLang('es');
    else setLang('en');
  }, []);

  const t = translations[lang];

  const generateIcon = (size: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#6e40c9');
        gradient.addColorStop(1, '#8957e5');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, size * 0.2);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = size * 0.1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(size * 0.5, size * 0.2);
        ctx.lineTo(size * 0.3, size * 0.6);
        ctx.lineTo(size * 0.5, size * 0.6);
        ctx.lineTo(size * 0.4, size * 0.9);
        ctx.lineTo(size * 0.7, size * 0.4);
        ctx.lineTo(size * 0.5, size * 0.4);
        ctx.lineTo(size * 0.6, size * 0.1);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.fill();
      }
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);
    setIsSuccess(false);

    try {
      const zip = new JSZip();
      const root = zip.folder('SyncRate');
      if (root) {
        root.file('manifest.json', templates.manifest);
        root.file('popup.html', templates.popupHtml);
        root.file('popup.js', templates.popupJs);
        root.file('background.js', templates.background);
        root.file('content.js', templates.content);
        root.file('store_ru.txt', templates.storeRu);
        root.file('store_en.txt', templates.storeEn);

        const iconFolder = root.folder('icons');
        if (iconFolder) {
          const icon16 = await generateIcon(16);
          const icon48 = await generateIcon(48);
          const icon128 = await generateIcon(128);
          iconFolder.file('icon16.png', icon16);
          iconFolder.file('icon48.png', icon48);
          iconFolder.file('icon128.png', icon128);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'SyncRate.zip');

      // Also publish to server for over-the-air updates
      try {
        const base64 = await zip.generateAsync({ type: 'base64' });
        const secret = (import.meta as any).env.VITE_PUBLISH_SECRET || "default_syncrate_secret_12345";
        await fetch('/api/publish', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`
          },
          body: JSON.stringify({ zipBase64: base64 })
        });
        console.log("Extension published to server for OTA updates.");
      } catch (err) {
        console.error("Failed to publish extension for OTA updates:", err);
      }

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error('Generation failed:', err);
      setError('Failed to generate extension package.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] font-sans selection:bg-[#6e40c9]/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#6e40c9]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#8957e5]/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-xl border-bottom border-[#30363d] px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6e40c9] to-[#8957e5] rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <span className="text-xl font-black tracking-tighter">{t.title}</span>
          </div>
          <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-full px-3 py-1 hover:border-[#6e40c9] transition-colors relative group">
            <Languages className="w-4 h-4 text-[#8b949e]" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-[#161b22] text-sm font-bold outline-none cursor-pointer pr-4 text-[#f0f6fc] relative z-10 border-none"
              style={{ colorScheme: 'dark' }}
            >
              <option value="ru" className="bg-[#161b22] text-[#f0f6fc]">RU</option>
              <option value="en" className="bg-[#161b22] text-[#f0f6fc]">EN</option>
              <option value="zh" className="bg-[#161b22] text-[#f0f6fc]">ZH</option>
              <option value="kk" className="bg-[#161b22] text-[#f0f6fc]">KK</option>
              <option value="de" className="bg-[#161b22] text-[#f0f6fc]">DE</option>
              <option value="es" className="bg-[#161b22] text-[#f0f6fc]">ES</option>
              <option value="uk" className="bg-[#161b22] text-[#f0f6fc]">UK</option>
            </select>
          </div>
            <button 
              onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden md:block bg-[#6e40c9] hover:bg-[#8957e5] text-white px-5 py-2 rounded-full text-sm font-bold transition-all"
            >
              {t.btn_download}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6e40c9]/10 border border-[#6e40c9]/20 text-[#a371f7] text-xs font-bold uppercase tracking-wider mb-8"
        >
          <Sparkles className="w-3 h-3" />
          {t.version_badge}
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-b from-white to-[#8b949e] bg-clip-text text-transparent leading-tight"
        >
          {t.hero_title}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-[#8b949e] max-w-3xl mx-auto leading-relaxed mb-12"
        >
          {t.hero_desc}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4"
        >
          <button 
            onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full md:w-auto bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#f0f6fc] transition-all flex items-center justify-center gap-2"
          >
            {t.btn_download}
            <ChevronRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full md:w-auto bg-[#161b22] border border-[#30363d] text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#1c2128] transition-all"
          >
            {t.tariffs_title}
          </button>
        </motion.div>
      </section>

      {/* Product Description Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-[#30363d]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-6">{t.product_desc_title}</h2>
            <p className="text-xl text-[#8b949e] leading-relaxed">
              {t.product_desc_text}
            </p>
          </div>
          <div className="relative">
            <div className="aspect-video bg-[#161b22] border border-[#30363d] rounded-3xl overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6e40c9]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <ConversionAnimation price={t.demo_price} result={t.demo_result} />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-[#8b949e] uppercase tracking-[0.3em] opacity-50 group-hover:opacity-100 transition-opacity">
                {t.instant_conversion}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-black tracking-tight mb-12 text-center">{t.features_title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#161b22] border border-[#30363d] p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <MousePointer2 className="w-32 h-32 text-[#6e40c9]" />
            </div>
            <h3 className="text-3xl font-black mb-4">{t.feature_1_title}</h3>
            <p className="text-lg text-[#8b949e] max-w-md">{t.feature_1_desc}</p>
          </div>
          <div className="bg-[#6e40c9]/10 border border-[#6e40c9]/30 p-10 rounded-[2.5rem] flex flex-col justify-between">
            <Coins className="w-12 h-12 text-[#a371f7] mb-8" />
            <div>
              <h3 className="text-2xl font-black mb-2">{t.feature_2_title}</h3>
              <p className="text-[#8b949e]">{t.feature_2_desc}</p>
            </div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] p-10 rounded-[2.5rem] flex flex-col justify-between">
            <ShieldCheck className="w-12 h-12 text-green-500 mb-8" />
            <div>
              <h3 className="text-2xl font-black mb-2">{t.feature_3_title}</h3>
              <p className="text-[#8b949e]">{t.feature_3_desc}</p>
            </div>
          </div>
          <div className="md:col-span-2 bg-[#161b22] border border-[#30363d] p-10 rounded-[2.5rem] flex items-center gap-8">
            <div className="hidden md:flex w-24 h-24 bg-[#0d1117] rounded-3xl items-center justify-center border border-[#30363d]">
              <Landmark className="w-12 h-12 text-[#a371f7]" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2">{t.enterprise_grade_title}</h3>
              <p className="text-[#8b949e]">{t.enterprise_grade_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black tracking-tight mb-4">{t.tariffs_title}</h2>
          <p className="text-[#8b949e] text-lg">{t.tariffs_subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic */}
          <div className="bg-[#161b22] border border-[#30363d] p-8 rounded-[2rem] flex flex-col">
            <h3 className="text-xl font-bold mb-2">{t.tier_basic}</h3>
            <div className="text-4xl font-black mb-6">{t.price_free}</div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-[#8b949e]">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>{t.feature_usd_conv}</span>
              </li>
              <li className="flex items-center gap-3 text-[#8b949e]">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>2 {t.feature_dashboard_slots}</span>
              </li>
              <li className="flex items-center gap-3 text-[#8b949e]/50">
                <Lock className="w-5 h-5" />
                <span>{t.feature_no_crypto}</span>
              </li>
            </ul>
            <p className="text-sm text-[#8b949e] italic">{t.desc_basic}</p>
          </div>

          {/* PRO */}
          <div className="bg-[#161b22] border-2 border-[#6e40c9] p-8 rounded-[2rem] flex flex-col relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold">{t.tier_pro}</h3>
              <span className="bg-[#6e40c9] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform">
                {t.popular_badge}
              </span>
            </div>
            <div className="text-4xl font-black mb-1">{t.price_pro}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#a371f7] mb-6">{t.lifetime}</div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-[#f0f6fc]">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>{t.feature_top8}</span>
              </li>
              <li className="flex items-center gap-3 text-[#f0f6fc]">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>4 {t.feature_dashboard_slots}</span>
              </li>
              <li className="flex items-center gap-3 text-[#f0f6fc]">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>{t.feature_dark_mode}</span>
              </li>
            </ul>
            <p className="text-sm text-[#8b949e] italic">{t.desc_pro}</p>
          </div>

          {/* PRO+ */}
          <div className="bg-gradient-to-b from-[#1c2128] to-[#161b22] border border-yellow-500/30 p-8 rounded-[2rem] flex flex-col relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-yellow-500">{t.tier_pro_plus}</h3>
              <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                VIP
              </span>
            </div>
            <div className="text-4xl font-black mb-1">{t.price_pro_plus}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 mb-6">{t.lifetime}</div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-[#f0f6fc]">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span>{t.feature_all_fiats}</span>
              </li>
              <li className="flex items-center gap-3 text-[#f0f6fc]">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span>{t.feature_nat_banks}</span>
              </li>
              <li className="flex items-center gap-3 text-[#f0f6fc]">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span>{t.feature_top30_crypto}</span>
              </li>
            </ul>
            <p className="text-sm text-[#8b949e] italic">{t.desc_pro_plus}</p>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <div className="bg-[#161b22] border border-[#30363d] rounded-[3rem] p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-black mb-6">{t.btn_download_zip}</h2>
          <p className="text-[#8b949e] text-lg mb-12 max-w-xl mx-auto">
            {t.download_zip_desc}
          </p>
          
          <div className="flex flex-col items-center space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#6e40c9] to-[#a371f7] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className={`relative flex items-center justify-center min-w-[280px] px-10 py-6 rounded-3xl border-4 transition-all duration-500 ${
                  isGenerating 
                    ? 'bg-[#161b22] border-[#30363d] cursor-wait' 
                    : 'bg-[#0d1117] border-[#6e40c9] hover:border-[#a371f7] hover:scale-105 active:scale-95'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 border-4 border-[#6e40c9] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#8b949e]">{t.bundling}</span>
                    </motion.div>
                  ) : isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <CheckCircle2 className="w-16 h-16 text-green-500 mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest text-green-500">{t.ready}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4"
                    >
                      <Download className="w-10 h-10 text-[#a371f7]" />
                      <span className="text-lg font-black text-center leading-tight">
                        {t.download}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setShowInstructions(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#6e40c9] transition-all text-sm font-bold"
            >
              <FileCode className="w-4 h-4 text-[#6e40c9]" />
              {t.btn_instructions}
            </button>
            <button 
              onClick={() => setShowCapabilities(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#6e40c9] transition-all text-sm font-bold"
            >
              <Layout className="w-4 h-4 text-[#6e40c9]" />
              {t.btn_capabilities}
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0d1117]/90 backdrop-blur-sm"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#161b22] border border-[#30363d] rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-3xl font-black tracking-tight">{t.modal_instructions_title}</h3>
                <button onClick={() => setShowInstructions(false)} className="text-[#8b949e] hover:text-white transition-colors">
                  <AlertCircle className="w-8 h-8 rotate-45" />
                </button>
              </div>
              <div className="space-y-6">
                {[
                  t.instruction_step_1,
                  t.instruction_step_2,
                  t.instruction_step_3,
                  t.instruction_step_4,
                  t.instruction_step_5,
                  t.instruction_step_6,
                  t.instruction_step_7,
                  t.instruction_step_8
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6e40c9] flex items-center justify-center font-black text-sm">
                      {i + 1}
                    </div>
                    <p className="text-[#c9d1d9] leading-relaxed">{step}</p>
                  </div>
                ))}
                <div className="mt-8 p-6 rounded-2xl bg-[#6e40c9]/10 border border-[#6e40c9]/20 flex items-start gap-4">
                  <Globe className="w-6 h-6 text-[#a371f7] flex-shrink-0" />
                  <p className="text-sm text-[#8b949e] font-medium">{t.browsers_supported}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCapabilities && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0d1117]/90 backdrop-blur-sm"
            onClick={() => setShowCapabilities(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#161b22] border border-[#30363d] rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-3xl font-black tracking-tight">{t.modal_capabilities_title}</h3>
                <button onClick={() => setShowCapabilities(false)} className="text-[#8b949e] hover:text-white transition-colors">
                  <AlertCircle className="w-8 h-8 rotate-45" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  t.capability_1, t.capability_2, t.capability_3, t.capability_4,
                  t.capability_5, t.capability_6, t.capability_7, t.capability_8
                ].map((cap, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#0d1117] border border-[#30363d] flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#c9d1d9] font-medium">{cap}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free Test Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-[3rem] bg-gradient-to-br from-[#6e40c9]/20 to-[#8957e5]/5 border border-[#6e40c9]/30 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#f39c12]/10 text-[#f39c12] px-4 py-2 rounded-full text-sm font-black mb-8 border border-[#f39c12]/20 uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Limited Offer
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none">
              {t.free_test_title}
            </h2>
            <p className="text-xl text-[#8b949e] leading-relaxed mb-12 max-w-2xl mx-auto">
              {t.free_test_desc}
            </p>
            <button 
              onClick={() => {
                const el = document.getElementById('download');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#6e40c9] text-white px-12 py-6 rounded-2xl font-black text-2xl hover:bg-[#8957e5] transition-all shadow-xl shadow-[#6e40c9]/20 active:scale-95"
            >
              {t.btn_start_test}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2.5rem] bg-[#161b22] border border-[#30363d] flex flex-col justify-between"
            >
              <div>
                <h2 className="text-4xl font-black mb-4 tracking-tight">{t.feedback_title}</h2>
                <p className="text-[#8b949e] text-lg leading-relaxed mb-8">
                  {t.feedback_desc}
                </p>
              </div>
              <a 
                href="mailto:askoreebipiatnica@gmail.com?subject=SyncRate Feedback"
                className="inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#c9d1d9] transition-all active:scale-95"
              >
                <Sparkles className="w-6 h-6" />
                {t.btn_feedback}
              </a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2.5rem] bg-[#6e40c9]/5 border border-[#6e40c9]/20 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-4xl font-black mb-4 tracking-tight">{t.update_title}</h2>
                <p className="text-[#8b949e] text-lg leading-relaxed mb-8">
                  {t.update_desc}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[#a371f7] font-black text-lg">
                <RefreshCw className="w-6 h-6 animate-spin-slow" />
                Enterprise v15.0
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-24 pt-12 pb-24 border-t border-[#30363d] text-center px-6">
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-[#ef4444]/5 border border-[#ef4444]/20 mb-12">
          <h4 className="text-[#ef4444] font-bold flex items-center justify-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5" />
            {t.legal_notice}
          </h4>
          <p className="text-sm text-[#8b949e] leading-relaxed text-justify">
            {t.legal_desc}
          </p>
        </div>
        <p className="text-sm text-[#8b949e] font-medium">
          {t.copyright}
        </p>
      </footer>
    </div>
  );
}


