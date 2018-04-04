import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/es';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "This content failed to load.",
  "Terra.datePicker.today": "Today",
  "Terra.datePicker.openCalendar": "Open Calendar",
  "Terra.form.field.optional": "(opcional)",
  "Terra.form.select.defaultDisplay": "- Predeterminado -",
  "Terra.Overlay.loading": "Loading..."
};
const areTranslationsLoaded = true;
const locale = 'es-US';
export {
  areTranslationsLoaded,
  locale,
  messages
};