import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ko from './locales/ko.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko }
    },
    lng: "en", // 👈 기본 접속 언어를 영어로 설정!
    fallbackLng: "en", // 에러 나면 무조건 영어로 띄움
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;