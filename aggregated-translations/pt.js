import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/pt';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "Falha ao carregar conteúdo.",
  "Terra.datePicker.today": "Hoje",
  "Terra.datePicker.openCalendar": "Abrir calendário",
  "Terra.form.field.optional": "(opcional)",
  "Terra.form.select.defaultDisplay": "- Selecione -",
  "Terra.Overlay.loading": "Carregando..."
};
const areTranslationsLoaded = true;
const locale = 'pt';
export {
  areTranslationsLoaded,
  locale,
  messages
};