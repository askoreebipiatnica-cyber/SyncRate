import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ru' | 'en' | 'zh' | 'kk' | 'de' | 'uk' | 'es';
}

const localTexts = {
  ru: {
    title: 'Активация бесплатного PRO+',
    desc: 'Введите ID вашего устройства (Install ID), чтобы получить 48 часов полного PRO+ доступа.',
    placeholder: 'inst-xxxxxxxxxxxxxxxxxxxxxx',
    btn_activate: 'Активировать PRO+',
    success_title: 'PRO+ активирован!',
    success_desc: '48 часов бесплатного PRO+ успешно начислены на ваше устройство. Пожалуйста, перезапустите браузер или обновите расширение для вступления изменений в силу.',
    id_help: 'Где найти ID устройства?',
    id_help_desc: 'Откройте меню расширения в браузере. ID устройства находится в самом низу панели настроек (формат inst-xxx).',
    error_empty: 'ID устройства не может быть пустым',
    error_invalid: 'Неверный формат ID устройства. Должен начинаться с "inst-"',
  },
  en: {
    title: 'Activate Free PRO+',
    desc: 'Enter your device ID (Install ID) to get 48 hours of full PRO+ access.',
    placeholder: 'inst-xxxxxxxxxxxxxxxxxxxxxx',
    btn_activate: 'Activate PRO+',
    success_title: 'PRO+ Activated!',
    success_desc: '48 hours of free PRO+ have been successfully granted to your device. Please restart your browser or reload the extension to apply the changes.',
    id_help: 'Where to find Device ID?',
    id_help_desc: 'Open the extension popup in your browser. Your Device ID is at the very bottom of the settings tab (starts with "inst-").',
    error_empty: 'Device ID cannot be empty',
    error_invalid: 'Invalid Device ID format. It must start with "inst-"',
  },
  zh: {
    title: '激活免费 PRO+',
    desc: '输入您的设备 ID (Install ID) 以获得 48 小时的完整 PRO+ 访问权限。',
    placeholder: 'inst-xxxxxxxxxxxxxxxxxxxxxx',
    btn_activate: '激活 PRO+',
    success_title: 'PRO+ 已激活！',
    success_desc: '已成功为您的设备授予 48 小时的免费 PRO+ 访问权限。请重启浏览器或重新加载扩展程序以应用更改。',
    id_help: '在哪里可以找到设备 ID？',
    id_help_desc: '在浏览器中打开扩展程序弹出窗口。您的设备 ID 位于设置选项卡的最底部（以 “inst-” 开头）。',
    error_empty: '设备 ID 不能为空',
    error_invalid: '设备 ID 格式无效。必须以 “inst-” 开头',
  },
  kk: {
    title: 'Тегін PRO+ нұсқасын белсендіру',
    desc: '48 сағаттық толық PRO+ рұқсатын алу үшін құрылғыңыздың ID-ін (Install ID) енгізіңіз.',
    placeholder: 'inst-xxxxxxxxxxxxxxxxxxxxxx',
    btn_activate: 'PRO+-ды белсендіру',
    success_title: 'PRO+ белсендірілді!',
    success_desc: 'Құрылғыңызға 48 сағаттық тегін PRO+ сәтті берілді. Өзгерістер күшіне енуі үшін браузерді қайта іске қосыңыз немесе кеңейтімді жаңартыңыз.',
    id_help: 'Құрылғы ID-ін қайдан табуға болады?',
    id_help_desc: 'Браузердегі кеңейтім мәзірін ашыңыз. Құрылғы ID параметрлер панелінің ең төменгі жағында орналасқан ("inst-" форматында).',
    error_empty: 'Құрылғы ID-і бос болмауы керек',
    error_invalid: 'Құрылғы ID форматы қате. Ол "inst-" белгісінен басталуы керек',
  },
  de: {
    title: 'Kostenloses PRO+ aktivieren',
    desc: 'Geben Sie Ihre Geräte-ID (Install ID) ein, um 48 Stunden vollen PRO+-Zugriff zu erhalten.',
    placeholder: 'inst-xxxxxxxxxxxxxxxxxxxxxx',
    btn_activate: 'PRO+ aktivieren',
    success_title: 'PRO+ aktiviert!',
    success_desc: '48 Stunden kostenloses PRO+ wurden erfolgreich für Ihr Gerät freigeschaltet. Bitte starten Sie Ihren Browser neu oder laden Sie die Erweiterung neu, um die Änderungen zu übernehmen.',
    id_help: 'Wo finde ich die Geräte-ID?',
    id_help_desc: 'Öffnen Sie das Erweiterungsmenü im Browser. Die Geräte-ID befindet sich ganz unten in den Einstellungen (Format: inst-xxx).',
    error_empty: 'Geräte-ID darf nicht leer sein',
    error_invalid: 'Ungültiges Format der Geräte-ID. Muss mit "inst-" beginnen',
  },
  uk: {
    title: 'Активація безкоштовного PRO+',
    desc: 'Введіть ID вашого пристрою (Install ID), щоб отримати 48 годин повного PRO+ доступу.',
    placeholder: 'inst-xxxxxxxxxxxxxxxxxxxxxx',
    btn_activate: 'Активувати PRO+',
    success_title: 'PRO+ активовано!',
    success_desc: '48 годин безкоштовного PRO+ успішно нараховано на ваш пристрій. Будь ласка, перезапустіть браузер або оновіть розширення, щоб зміни набули чинності.',
    id_help: 'Де знайти ID пристрою?',
    id_help_desc: 'Відкрийте меню розширення в браузері. ID пристрою знаходиться в самому низу панелі налаштувань (формат inst-xxx).',
    error_empty: 'ID пристрою не може бути порожнім',
    error_invalid: 'Невірний формат ID пристрою. Повинен починатися з "inst-"',
  },
  es: {
    title: 'Activar PRO+ Gratis',
    desc: 'Ingrese el ID de su dispositivo (Install ID) para obtener 48 horas de acceso completo a PRO+.',
    placeholder: 'inst-xxxxxxxxxxxxxxxxxxxxxx',
    btn_activate: 'Activar PRO+',
    success_title: '¡PRO+ Activado!',
    success_desc: 'Se han otorgado con éxito 48 horas de PRO+ gratuito a su dispositivo. Reinicie su navegador o vuelva a cargar la extensión para aplicar los cambios.',
    id_help: '¿Dónde encontrar el ID del dispositivo?',
    id_help_desc: 'Abra el menú de la extensión en el navegador. El ID del dispositivo está en la parte inferior del panel de configuración (formato inst-xxx).',
    error_empty: 'El ID del dispositivo no puede estar vacío',
    error_invalid: 'Formato de ID de dispositivo no válido. Debe comenzar con "inst-"',
  }
};

export const TrialModal: React.FC<TrialModalProps> = ({ isOpen, onClose, lang }) => {
  const [installId, setInstallId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const t = localTexts[lang] || localTexts['en'];

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = installId.trim();
    if (!trimmedId) {
      setError(t.error_empty);
      return;
    }

    if (!trimmedId.startsWith('inst-') || trimmedId.length < 15) {
      setError(t.error_invalid);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installId: trimmedId }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Activation failed');
      }
    } catch (err) {
      console.error('Trial activation error:', err);
      setError(lang === 'ru' ? 'Ошибка сети при подключении к серверу' : 'Network error connecting to activation server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0d1117] border border-zinc-800 p-8 text-white shadow-2xl shadow-purple-500/10"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-[#f39c12]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {!success ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#6e40c9]/10 text-[#8957e5] rounded-2xl border border-[#6e40c9]/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">{t.title}</h3>
            </div>

            <p className="text-[#8b949e] mb-6 leading-relaxed text-sm">
              {t.desc}
            </p>

            <form onSubmit={handleActivate} className="space-y-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder={t.placeholder}
                  value={installId}
                  onChange={(e) => setInstallId(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-[#6e40c9] focus:ring-1 focus:ring-[#6e40c9] text-sm text-white font-mono placeholder-zinc-600 transition-all disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6e40c9] hover:bg-[#8957e5] disabled:bg-[#6e40c9]/50 text-white font-black py-3 rounded-xl text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {t.btn_activate}
              </button>
            </form>

            <div className="border-t border-zinc-800/80 pt-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{t.id_help}</h4>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                {t.id_help_desc}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-emerald-950/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-900/30 mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black mb-3 text-white tracking-tight">{t.success_title}</h3>
            <p className="text-[#8b949e] text-sm leading-relaxed mb-6">
              {t.success_desc}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
