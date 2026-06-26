export interface LicenseRecord {
  hash: string;
  tier: string;
  createdAt: string;
  activatedAt?: string;
  isUsed: boolean;
}

// Хранилище в оперативной памяти (In-Memory заглушка)
const licenseDb = new Map<string, LicenseRecord>();

/**
 * Имитирует сохранение лицензионного ключа в базу данных.
 * В БД сохраняется ТОЛЬКО хеш ключа, сам ключ в открытом виде никогда не записывается.
 * Идентификатором (ID) записи является SHA-256 хеш ключа, что гарантирует быстрый поиск O(1) и безопасность.
 * @param keyHash Хеш ключа (формат salt:hash)
 * @param keyId Уникальный безопасный ID ключа (например, SHA-256 от открытого ключа)
 * @param tier Уровень лицензии
 */
export async function saveLicense(keyId: string, keyHash: string, tier: string): Promise<void> {
  licenseDb.set(keyId, {
    hash: keyHash,
    tier: tier.toUpperCase(),
    createdAt: new Date().toISOString(),
    isUsed: false
  });
}

/**
 * Ищет запись лицензии в базе данных по её уникальному безопасному идентификатору (ID).
 * @param keyId Уникальный безопасный ID ключа (SHA-256 от открытого ключа)
 * @returns Запись лицензии или null, если не найдена
 */
export async function findLicense(keyId: string): Promise<LicenseRecord | null> {
  const record = licenseDb.get(keyId);
  if (!record) return null;
  return { ...record };
}

/**
 * Помечает лицензию как активированную.
 * @param keyId Уникальный безопасный ID ключа
 */
export async function activateLicense(keyId: string): Promise<boolean> {
  const record = licenseDb.get(keyId);
  if (!record) return false;
  
  record.isUsed = true;
  record.activatedAt = new Date().toISOString();
  licenseDb.set(keyId, record);
  return true;
}

/**
 * Возвращает все зарегистрированные лицензии (для целей мониторинга/администрирования).
 */
export async function getAllLicenses(): Promise<Record<string, LicenseRecord>> {
  const result: Record<string, LicenseRecord> = {};
  for (const [id, record] of licenseDb.entries()) {
    result[id] = record;
  }
  return result;
}
