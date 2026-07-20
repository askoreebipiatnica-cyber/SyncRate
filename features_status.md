# SyncRate — Feature Status Tracker / Таблица статуса возможностей

This document tracks all completed functional modules and user scenarios for the SyncRate Open Source project (both frontend landing pages and extension components).

В этом документе отслеживаются все готовые функциональные возможности и сценарии использования открытого проекта SyncRate (как веб-интерфейса, так и самого расширения).

---

## Web Landing Page / Веб-сайт проекта

| ID | Feature Name / Модуль | User Story (Пользовательская история) | Expected Behavior (Ожидаемое поведение) | Status | Notes (Заметки) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LP-01** | Multi-language UI / Мультиязычность лендинга | As a global user, I want to see the webpage in my native language so I can easily understand the project. | Auto-detects browser language. Manual language switcher (RU, EN, ZH, KK, DE, ES, UK) updates all texts instantly without page reload. | **Completed** | Full localization is responsive and robust. |
| **LP-02** | Interactive Live Demo / Демонстрация конвертации | As a visitor, I want to see how the conversion popup looks, so I can understand the extension's value. | Interactive `ConversionAnimation` simulates text highlighting on a webpage and showcases the elegant popup converter tooltip in action. | **Completed** | Smooth animations, mobile-friendly design. |
| **LP-03** | Source Code & ZIP Download / Скачивание ZIP-архива | As a developer/user, I want to download the ZIP package directly to install it manually in developer mode. | Clicking the download button serves the packed or source ZIP archive with the correct `application/zip` MIME-type. | **Completed** | Instant local downloading is fully integrated. |
| **LP-04** | CRX Extension Download / Скачивание CRX-пакета | As an advanced user, I want to download the compiled CRX file to install it directly. | Clicking the download button serves the `.crx` file with the correct Chrome extension MIME-type. | **Completed** | Seamless downloading. |
| **LP-05** | Community Feedback Hub / Форма обратной связи | As a user, I want to send suggestions or report bugs directly to the project maintainers. | Interactive feedback form with automatic diagnostics data (version, browser, environment specs) automatically submitted securely. | **Completed** | Saves messages directly to the community hub DB. |

---

## Chrome / Edge Extension / Браузерное расширение

| ID | Feature Name / Модуль | User Story (Пользовательская история) | Expected Behavior (Ожидаемое поведение) | Status | Notes (Заметки) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EXT-01**| Select & Convert / Выдели и Конвертируй | As a user, I want to highlight any text selection on any website to get an immediate conversion. | Microsecond parser recognizes currency formats, symbols (e.g., $, €, ₽, ₴, ₸) and values, displaying a sleek hover tooltip near the cursor. | **Completed** | High precision parsing with multi-separator support. |
| **EXT-02**| 160+ Currencies & Crypto / Поддержка 160+ валют | As a user, I want to convert not only global fiat currencies but also popular crypto assets. | Supports major international fiat codes and top cryptocurrencies (BTC, ETH, USDT, SOL, etc.) with real-time exchange rates. | **Completed** | Comprehensive currency matrix. |
| **EXT-03**| Official Bank Rates / Официальные курсы ЦБ | As a user, I want to view rates based on official central banks' statements. | Real-time exchange rate source selectors for the European Central Bank (ECB), CB RF, NBU, and NBRB. | **Completed** | Highly accurate source mappings. |
| **EXT-04**| Multi-slot Dashboard / Панель мониторинга | As a user, I want to monitor multiple currency pairs simultaneously inside my extension settings popup. | Fully-featured 4-slot live currency dashboard in the extension popup menu. All slots unlocked for everyone. | **Completed** | Fast asynchronous updating. |
| **EXT-05**| Intelligent IP Geo-Detection / Автоопределение по IP | As a user, I want the extension to automatically set my local currency upon initial installation. | Silent geographical detection translates the user's IP country code into the correct local currency code automatically. | **Completed** | High accuracy location provider. |
| **EXT-06**| Smart Local Caching / Локальное кэширование | As a user, I want the extension to load cached rates instantly, even when offline. | Optimized client-side SQLite/storage cache reduces unnecessary web requests and keeps the browser lightweight. | **Completed** | Built-in offline support. |
| **EXT-07**| Multi-language popup / Мультиязычный попап | As a user, I want the settings popup to match my preferred language. | Popup UI is localized to English, Russian, Ukrainian, Kazakh, German, Spanish, and Chinese. | **Completed** | Fluid translation mechanism. |
