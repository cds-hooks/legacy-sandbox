import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/ar';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "This content failed to load.",
  "Terra.datePicker.today": "Today",
  "Terra.datePicker.openCalendar": "Open Calendar",
  "Terra.form.field.optional": "(اختياري)",
  "Terra.form.select.defaultDisplay": "- Select -",
  "Terra.Overlay.loading": "Loading..."
};
const areTranslationsLoaded = true;
const locale = 'ar';
export {
  areTranslationsLoaded,
  locale,
  messages
};