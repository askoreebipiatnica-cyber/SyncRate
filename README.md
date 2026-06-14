# SyncRate - The Ultimate Currency & Crypto Converter

SyncRate is a powerful browser extension (Enterprise Edition v15.0) that eliminates the need to copy prices and open a calculator. Simply highlight any amount on any website, and the extension instantly shows the equivalent in your local currency right next to the cursor.

## Features

- **Instant Conversion**: Highlight text to see the magic.
- **160+ Fiat Currencies**: Full support for global currencies.
- **National Banks**: Integration with ECB, CBRF, NBU, NBRB.
- **Top-30 Crypto**: Real-time rates for major cryptocurrencies.
- **Privacy First**: No data collection. All calculations happen locally.
- **Auto-Updates**: Over-the-air updates for the extension.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## ⚠️ CRITICAL NOTICE / ВАЖНОЕ ПРИМЕЧАНИЕ ⚠️

> [!WARNING]
> **ENGLISH:** When installing as a Chrome extension, you **MUST** select the subfolder named **`extension`** inside this project, **NOT** the repository's main folder. Selecting the main folder will throw an error: *"Manifest file is missing or unreadable"*.
>
> **РУССКИЙ:** При установке расширения в Chrome вы **ОБЯЗАТЕЛЬНО** должны выбрать подпапку **`extension`** внутри папки проекта, а **НЕ** саму главную корневую папку репозитория. Если выбрать саму корневую папку всего репозитория, то Chrome выдаст ошибку: *"Файл манифеста отсутствует или недоступен для чтения"*.

## Chrome Extension Installation / Установка расширения в браузер

### 🇬🇧 English: If you downloaded/cloned this repository from GitHub:
1. **Open your browser's extensions page**: Go to `chrome://extensions/` (or `edge://extensions/`).
2. **Enable Developer mode**: Toggle the switch in the top-right corner.
3. **Click "Load unpacked"**: Click the button on the top-left.
4. **Choose the correct folder**: Select the **`extension`** folder **inside** this downloaded project directory, **NOT** the main root directory of the project.
5. Setup is complete! The extension is now active.

---

### 🇷🇺 Русский: Если вы скачали или клонировали проект с GitHub:
1. **Откройте страницу расширений**: Перейдите по адресу `chrome://extensions/` (в Chrome) или `edge://extensions/` (в Edge).
2. **Включите режим разработчика**: Переключите тумблер «Режим разработчика» в правом верхнем углу.
3. **Нажмите «Загрузить распакованное расширение»**: Кнопка в левом верхнем углу.
4. **Выберите ПРАВИЛЬНУЮ папку**: Выберите папку **`extension`**, которая находится **внутри** скачанного каталога проекта, а **НЕ** сам корень проекта (не главную папку всего проекта).
5. На этом установка завершена! Расширение готово к работе.

## License

© 2026 SyncRate. All rights reserved.
This tool is provided for authorized developers only. Reverse engineering or unauthorized distribution is strictly prohibited.

