import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, AlertCircle, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ru' | 'en' | 'zh' | 'kk' | 'de' | 'uk' | 'es';
}

export default function TrialModal({ isOpen, onClose, lang }: TrialModalProps) {
  const [installId, setInstallId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cleanId = installId.trim();
    if (!cleanId) {
      setError(
        lang === 'ru'
          ? 'Пожалуйста, введите ваш ID установки.'
          : 'Please enter your install ID.'
      );
      return;
    }

    if (!/^inst-[a-z0-9]{20,30}$/.test(cleanId)) {
      setError(
        lang === 'ru'
          ? 'Неверный формат ID. Он должен начинаться с "inst-" и содержать от 20 до 30 символов.'
          : 'Invalid ID format. It should start with "inst-" and have 20 to 30 characters.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installId: cleanId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || (lang === 'ru' ? 'Произошла ошибка' : 'An error occurred'));
      }
    } catch (err) {
      setError(
        lang === 'ru'
          ? 'Не удалось связаться с сервером. Попробуйте еще раз.'
          : 'Could not connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const text = {
    ru: {
      title: 'Активация бесплатного PRO+',
      desc: 'Получите полный беспрепятственный доступ ко всем функциям SyncRate Enterprise на 48 часов прямо сейчас.',
      step1: '1. Установите и откройте расширение SyncRate.',
      step2: '2. Скопируйте ваш уникальный ID установки (находится внизу поп-апа настроек расширения, начинается с "inst-").',
      step3: '3. Вставьте ID ниже и нажмите «Активировать» для мгновенной активации по воздуху.',
      label: 'ID Установки (Install ID)',
      placeholder: 'например, inst-a1b2c3d4e5f6g7h8i9j0',
      btnActivate: 'Активировать пробный период',
      btnActivating: 'Активация...',
      successTitle: 'Триал успешно активирован!',
      successDesc: '48 часов бесплатного доступа PRO+ уже привязаны к вашему устройству. Пожалуйста, перезапустите ваш браузер или расширение, чтобы применить изменения.',
      btnClose: 'Закрыть',
      howToFind: 'Как найти ID установки?',
    },
    en: {
      title: 'Activate Free PRO+',
      desc: 'Get full, unrestricted access to all SyncRate Enterprise features for 48 hours right now.',
      step1: '1. Install and open the SyncRate extension.',
      step2: '2. Copy your unique Install ID (found at the bottom of the extension settings popup, starts with "inst-").',
      step3: '3. Paste the ID below and click "Activate" for instant over-the-air activation.',
      label: 'Install ID',
      placeholder: 'e.g. inst-a1b2c3d4e5f6g7h8i9j0',
      btnActivate: 'Activate Trial Period',
      btnActivating: 'Activating...',
      successTitle: 'Trial Successfully Activated!',
      successDesc: '48 hours of free PRO+ access are now linked to your device. Please restart your browser or the extension to apply changes.',
      btnClose: 'Close',
      howToFind: 'How to find Install ID?',
    },
    zh: {
      title: '激活免费 PRO+',
      desc: '立即免费获得 48 小时的 SyncRate 企业版完整无限制访问权限。',
      step1: '1. 安装并打开 SyncRate 扩展。',
      step2: '2. 复制您的唯一安装 ID（可在扩展设置弹窗底部找到，以 "inst-" 开头）。',
      step3: '3. 将 ID 粘贴在下方并点击“激活”以进行即时空中激活。',
      label: '安装 ID (Install ID)',
      placeholder: '例如 inst-a1b2c3d4e5f6g7h8i9j0',
      btnActivate: '激活试用期',
      btnActivating: '激活中...',
      successTitle: '试用期已成功激活！',
      successDesc: '48 小时免费 PRO+ 访问权限已绑定到您的设备。请重启浏览器或扩展程序以应用更改。',
      btnClose: '关闭',
      howToFind: '如何查找安装 ID？',
    },
    kk: {
      title: 'Тегін PRO+ белсендіру',
      desc: 'Дәл қазір 48 сағатқа SyncRate Enterprise барлық функцияларына толық және шектеусіз қол жеткізіңіз.',
      step1: '1. SyncRate кеңейтімін орнатып, ашыңыз.',
      step2: '2. Бірегей орнату идентификаторын (Install ID) көшіріңіз (кеңейтімнің реттеулер поп-апының төменгі жағында орналасқан, "inst-" деп басталады).',
      step3: '3. Идентификаторды төменге қойып, лезде белсендіру үшін «Белсендіру» батырмасын басыңыз.',
      label: 'Орнату идентификаторы (Install ID)',
      placeholder: 'мысалы, inst-a1b2c3d4e5f6g7h8i9j0',
      btnActivate: 'Сынақ мерзімін белсендіру',
      btnActivating: 'Белсендіру...',
      successTitle: 'Сынақ мерзімі сәтті белсендірілді!',
      successDesc: 'PRO+ тегін қолжетімділігінің 48 сағаты құрылғыңызға сәтті тіркелді. Өзгерістерді қолдану үшін браузерді немесе кеңейтімді қайта іске қосыңыз.',
      btnClose: 'Жабу',
      howToFind: 'Орнату идентификаторын қалай табуға болады?',
    },
    de: {
      title: 'Kostenloses PRO+ aktivieren',
      desc: 'Erhalten Sie jetzt 48 Stunden lang vollen, uneingeschränkten Zugriff auf alle SyncRate Enterprise-Funktionen.',
      step1: '1. Installieren und öffnen Sie die SyncRate-Erweiterung.',
      step2: '2. Kopieren Sie Ihre eindeutige Installations-ID (befindet sich unten im Einstellungs-Popup der Erweiterung, beginnt mit "inst-").',
      step3: '3. Fügen Sie die ID unten ein und klicken Sie auf "Aktivieren" für eine sofortige Aktivierung over-the-air.',
      label: 'Installations-ID (Install ID)',
      placeholder: 'z. B. inst-a1b2c3d4e5f6g7h8i9j0',
      btnActivate: 'Testzeitraum aktivieren',
      btnActivating: 'Aktivierung...',
      successTitle: 'Testzeitraum erfolgreich aktiviert!',
      successDesc: '48 Stunden kostenloser PRO+-Zugriff sind jetzt mit Ihrem Gerät verknüpft. Bitte starten Sie Ihren Browser oder die Erweiterung neu, um die Änderungen zu übernehmen.',
      btnClose: 'Schließen',
      howToFind: 'Wie finde ich meine Installations-ID?',
    },
    es: {
      title: 'Activar PRO+ Gratis',
      desc: 'Obtenga acceso completo e ilimitado a todas las funciones de SyncRate Enterprise durante 48 horas ahora mismo.',
      step1: '1. Instale y abra la extensión SyncRate.',
      step2: '2. Copie su ID de instalación único (se encuentra en la parte inferior del menú de configuración de la extensión, comienza con "inst-").',
      step3: '3. Pegue el ID a continuación y haga clic en "Activar" para una activación instantánea en el aire.',
      label: 'ID de instalación (Install ID)',
      placeholder: 'p. ej. inst-a1b2c3d4e5f6g7h8i9j0',
      btnActivate: 'Activar Período de Prueba',
      btnActivating: 'Activando...',
      successTitle: '¡Prueba activada con éxito!',
      successDesc: '48 horas de acceso gratuito a PRO+ ya están vinculadas a su dispositivo. Reinicie su navegador o la extensión para aplicar los cambios.',
      btnClose: 'Cerrar',
      howToFind: '¿Cómo encontrar el ID de instalación?',
    },
    uk: {
      title: 'Активація безкоштовного PRO+',
      desc: 'Отримайте повний безперешкодний доступ до всіх функцій SyncRate Enterprise на 48 годин прямо зараз.',
      step1: '1. Встановіть та відкрийте розширення SyncRate.',
      step2: '2. Скопіюйте ваш унікальний ID встановлення (знаходиться внизу поп-апу налаштувань розширення, починається з "inst-").',
      step3: '3. Вставте ID нижче та натисніть «Активувати» для миттєвої активації по повітрю.',
      label: 'ID Встановлення (Install ID)',
      placeholder: 'наприклад, inst-a1b2c3d4e5f6g7h8i9j0',
      btnActivate: 'Активувати пробний період',
      btnActivating: 'Активація...',
      successTitle: 'Тріал успішно активовано!',
      successDesc: '48 годин безкоштовного доступу PRO+ вже прив\'язані до вашого пристрою. Будь ласка, перезапустіть ваш браузер або розширення, щоб застосувати зміни.',
      btnClose: 'Закрити',
      howToFind: 'Як знайти ID встановлення?',
    },
  };

  const t = text[lang] || text['en'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0d1117]/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#161b22] border border-[#30363d] rounded-[2.5rem] p-8 md:p-12 max-w-xl w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#8b949e] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {!success ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#6e40c9]/10 border border-[#6e40c9]/20 flex items-center justify-center text-[#a371f7]">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">{t.title}</h3>
            </div>
            <p className="text-sm text-[#8b949e] leading-relaxed mb-6">{t.desc}</p>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-5 mb-6 text-xs space-y-3">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#a371f7]" />
                {t.howToFind}
              </span>
              <p className="text-[#8b949e] leading-relaxed">{t.step1}</p>
              <p className="text-[#8b949e] leading-relaxed">{t.step2}</p>
              <p className="text-[#8b949e] leading-relaxed">{t.step3}</p>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  {t.label}
                </label>
                <input
                  type="text"
                  value={installId}
                  onChange={(e) => setInstallId(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full bg-zinc-950 border border-[#30363d] rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white placeholder-zinc-500 transition-all font-mono"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-lg text-xs font-semibold border bg-red-500/10 border-red-500/20 text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6e40c9] hover:bg-[#8957e5] text-white border-none py-3.5 px-6 rounded-xl font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 select-none disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-[#6e40c9]/15"
              >
                {loading ? t.btnActivating : t.btnActivate}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{t.successTitle}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mb-6">
              {t.successDesc}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors text-white cursor-pointer"
            >
              {t.btnClose}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
