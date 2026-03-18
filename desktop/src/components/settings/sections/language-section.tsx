import { appLanguageLabels, supportedLanguages } from '@/i18n/languages';
import { useSettingsStore } from '@/stores/settings-store';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LanguageSection = () => {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useSettingsStore();

  const onSelectLanguage = async (nextLanguage: (typeof supportedLanguages)[number]) => {
    await setLanguage(nextLanguage);
    await i18n.changeLanguage(nextLanguage);
  };

  return (
    <div>
      <h2 className="text-xl font-light text-foreground mb-4">{t('settings.language.title')}</h2>
      <div className="bg-card rounded-md p-4 border border-border shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
            <Languages size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-5 break-words">{t('settings.language.title')}</p>
            <p className="text-xs text-muted-foreground leading-5 break-words">{t('settings.language.description')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {supportedLanguages.map((lang) => {
            const active = language === lang;
            return (
              <button
                key={lang}
                onClick={() => void onSelectLanguage(lang)}
                className={[
                  'min-h-10 rounded-md border text-xs sm:text-sm px-2 transition-all',
                  'whitespace-normal break-words leading-tight',
                  active
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted',
                ].join(' ')}
                title={appLanguageLabels[lang]}
              >
                {appLanguageLabels[lang]}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground mt-3 break-words leading-5">{t('settings.language.helper')}</p>
      </div>
    </div>
  );
};
