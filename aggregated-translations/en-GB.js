import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/en';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "This content failed to load.",
  "Terra.datePicker.today": "Today",
  "Terra.datePicker.openCalendar": "Open Calendar",
  "Terra.form.field.optional": "(optional)",
  "Terra.form.select.defaultDisplay": "- Select -",
  "Terra.Overlay.loading": "Loading..."
};
const areTranslationsLoaded = true;
const locale = 'en-GB';
export {
  areTranslationsLoaded,
  locale,
  messages
};