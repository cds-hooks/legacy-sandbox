import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/es';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "Error al cargar el contenido.",
  "Terra.datePicker.today": "Hoy",
  "Terra.datePicker.openCalendar": "Abrir calendario",
  "Terra.form.field.optional": "(opcional)",
  "Terra.form.select.defaultDisplay": "- Predeterminado -",
  "Terra.Overlay.loading": "Cargando..."
};
const areTranslationsLoaded = true;
const locale = 'es';
export {
  areTranslationsLoaded,
  locale,
  messages
};