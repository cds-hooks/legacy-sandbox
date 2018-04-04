import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/fr';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "Échec du chargement du contenu.",
  "Terra.datePicker.today": "Aujourd'hui",
  "Terra.datePicker.openCalendar": "Ouvrir le calendrier",
  "Terra.form.field.optional": "(facultatif)",
  "Terra.form.select.defaultDisplay": "Sélectionner",
  "Terra.Overlay.loading": "Chargement..."
};
const areTranslationsLoaded = true;
const locale = 'fr';
export {
  areTranslationsLoaded,
  locale,
  messages
};