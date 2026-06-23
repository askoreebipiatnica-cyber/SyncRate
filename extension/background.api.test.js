// background.api.test.js
import { getCrossRate } from './background';

// Инициализируем мок для Chrome Extension API, используемого в getCrossRate
global.chrome = {
    storage: {
        local: {
            get: jest.fn().mockResolvedValue({}),
            set: jest.fn().mockResolvedValue({})
        }
    }
};

// Мокаем глобальный fetch
global.fetch = jest.fn();

describe('CrossRate API Resilience', () => {
    beforeEach(() => {
        fetch.mockClear();
        chrome.storage.local.get.mockClear();
        chrome.storage.local.set.mockClear();
    });

    it('should gracefully fallback to "market" if Official Bank API is down', async () => {
        // Симулируем падение API ЦБ РФ (500 Internal Server Error)
        fetch.mockImplementationOnce(() => Promise.reject(new Error('API Down')));
        
        // Симулируем успешный ответ от Market API (open.er-api)
        fetch.mockImplementationOnce(() => Promise.resolve({
            json: () => Promise.resolve({ rates: { RUB: 90.5 } })
        }));

        // Запрашиваем курс USD -> RUB из источника "official"
        const result = await getCrossRate('USD', 'RUB', 'official');

        // Проверки QA:
        expect(result.success).toBe(true);
        expect(result.rate).toBe(90.5);
        expect(result.date).toBe('Live'); // Должен вернуть Live, так как переключился на рынок
        expect(fetch).toHaveBeenCalledTimes(2); // Ровно два вызова: падение 1-го, успех 2-го
    });
});
