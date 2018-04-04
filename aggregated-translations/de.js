import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/de';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "Inhalt konnte nicht geladen werden.",
  "Terra.datePicker.today": "Heute",
  "Terra.datePicker.openCalendar": "Kalender öffnen",
  "Terra.form.field.optional": "(Optional)",
  "Terra.form.select.defaultDisplay": "- Auswählen -",
  "Terra.Overlay.loading": "Ladevorgang..."
};
const areTranslationsLoaded = true;
const locale = 'de';
export {
  areTranslationsLoaded,
  locale,
  messages
};