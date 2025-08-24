import { en } from './en';
import { hi } from './hi';

export const locales = {
    en,
    hi
} as const;

export type Locale = keyof typeof locales;

export function useTranslations(locale: Locale) {
    return locales[locale];
}

export { en, hi };
