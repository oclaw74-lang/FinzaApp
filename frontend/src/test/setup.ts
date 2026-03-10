import '@testing-library/jest-dom'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from '@/i18n/locales/es'
import en from '@/i18n/locales/en'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { es: { translation: es }, en: { translation: en } },
    lng: 'es',
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  })
}
