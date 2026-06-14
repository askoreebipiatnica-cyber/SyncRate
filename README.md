# SyncRate - The Ultimate Currency & Crypto Converter / Мультивалютный конвертер прямо на страницах сайтов

[English](#english) | [Русский](#русский)

---

<a name="english"></a>
## 🇬🇧 English: Description & Installation Guide

**SyncRate** is an elegant, powerful, and privacy-focused browser extension (Enterprise Edition v15.0) designed to save you from copying prices and switching to external calculators. Simply highlight any amount or price in any currency on any website, and the converter will instantly display the converted value in your target custom currency in a stylish hover tooltip right next to the cursor.

### Key Features
* **Select & Convert**: Seamless instant matching of text selections.
* **160+ Fiat Currencies & Top Cryptocurrencies**: Fully integrated with live exchange platforms and major global fiat currencies.
* **Official Exchange Rates**: Real-time reference rates from the European Central Bank (ECB), Central Bank of the Russian Federation (CBRF), National Bank of Ukraine (NBU), and National Bank of the Republic of Belarus (NBRB).
* **Multi-language UI**: Localization for English, Russian, Ukrainian, Kazakh, German, Spanish, and Chinese.
* **Local Caching & Offline Support**: Optimized caching reduces network requests and keeps the browser lightweight.
* **Privacy-First Design**: Performs all conversion algorithms locally without storing or tracking sensitive user data.

---

### ⚠️ CRITICAL SETUP REQUIREMENT

> [!WARNING]
> When loading this unpacked extension into your browser, you **MUST** select the subfolder named **`extension`** inside this project directory, **NOT** the repository's main root folder. Selecting the main root folder will trigger an error: *"Manifest file is missing or unreadable"*.

---

### How to Install the Chrome Extension

1. **Download/Clone the Repository**:
   Clone or download this repository onto your machine.
2. **Open browser settings**:
   In your browser (Chrome, Edge, Opera, Brave), go to:
   * Google Chrome: `chrome://extensions/`
   * Microsoft Edge: `edge://extensions/`
3. **Enable Developer Mode**:
   Toggle the **"Developer mode"** switch located in the top-right corner.
4. **Load Unpacked Extension**:
   Click the **"Load unpacked"** button on the top-left.
5. **Select the `extension` folder**:
   In the file browser, navigate to the cloned project folder and select the subfolder named **`extension`** (which contains `manifest.json`).
6. **Congratulations!**
   The extension is installed. Pin it to your toolbar, configure your target currency and national bank preference in the popup settings, and highlight any price on any web page to see instant conversions.

---

<a name="русский"></a>
## 🇷🇺 Русский: Описание и руководство по установке

**SyncRate** — это элегантное, мощное и конфиденциальное браузерное расширение (Enterprise Edition v15.0), которое избавляет вас от необходимости вручную копировать цены и переходить в калькуляторы. Достаточно выделить любую сумму в валюте или крипте на любом сайте, и конвертер мгновенно отобразит эквивалент в выбранной вами валюте в аккуратной всплывающей подсказке прямо около курсора мыши.

### Основные возможности
* **Выдели и Конвертируй**: Микросекундный запуск и разбор денежных сумм прямо на лету при выделении текста.
* **Более 160 фиатных валют и топ-30 криптовалют**: Полная интеграция с биржами и основными мировыми активами.
* **Официальные курсы ЦБ**: Интеграция с Центральным банком РФ (ЦБ РФ), Национальным банком Украины (НБУ), Национальным банком Республики Беларусь (НБРБ) и Европейским центральным банком (ЕЦБ).
* **Мультиязычный интерфейс**: Поддержка английского, русского, украинского, казахского, немецкого, испанского и китайского языков.
* **Локальное кэширование курсов**: Умное кэширование экономит трафик и обеспечивает мгновенную отзывчивость.
* **Высокая конфиденциальность**: Все вычисления происходят прямо в браузере; личные данные пользователей не собираются и никуда не передаются.

---

### ⚠️ КРИТИЧЕСКИ ВАЖНОЕ ПРИМЕЧАНИЕ ПРИ УСТАНОВКЕ

> [!WARNING]
> При добавлении расширения в браузер вы **ОБЯЗАНЫ** выбрать именно вложенную папку **`extension`** в каталоге проекта, а **НЕ** его главную корневую папку. Если выбрать саму корневую папку всего репозитория, браузер выдаст ошибку: *"Файл манифеста отсутствует или недоступен для чтения"*.

---

### Инструкция по установке расширения в браузер Chrome / Edge

1. **Скачайте или клонируйте проект**:
   Клонируйте репозиторий или скачайте архив с кодом на компьютер и распакуйте его.
2. **Перейдите в меню расширений браузера**:
   В адресной строке введите:
   * Google Chrome: `chrome://extensions/`
   * Microsoft Edge: `edge://extensions/`
3. **Включите «Режим разработчика»**:
   Переключите тумблер в правом верхнем углу экрана в активное состояние.
4. **Загрузите распакованное расширение**:
   Нажмите на кнопку **«Загрузить распакованное расширение»** в левом верхнем углу страницы.
5. **Выберите правильную папку**:
   В открывшемся окне выбора папок найдите каталог проекта и выберите подпапку **`extension`** (внутри которой непосредственно лежит файл `manifest.json`).
6. **Готово!**
   Расширение успешно установлено. Закрепите его на панели задач, выберите свою целевую валюту в настройках всплывающего окна (popup) и наслаждайтесь мгновенным пересчетом цен на любых сайтах!

---

## Technical Maintenance (Node Server & Build) / Сборка и запуск веб-сервера

This project includes an optional enterprise dashboard server and sandbox payment pages. To build or deploy the full-stack version:

Этот проект также включает в себя опциональный веб-сервер панели управления и страниц оплаты. Для сборки и развертывания full-stack сервера:

```bash
# Install dependencies / Установка зависимостей
npm install

# Run dev mode / Запуск режима разработки
npm run dev

# Production build / Сборка проекта
npm run build

# Start server / Запуск сервера
npm start
```

## License / Лицензия

© 2026 SyncRate. All rights reserved. Registered developers access only. Unauthorized redistribution or modification is strictly prohibited.
© 2026 SyncRate. Все права защищены. Доступ разрешен только верифицированным разработчикам. Несанкционированное распространение или модификация строго запрещены.
