import { useMemo } from 'react';
import { resolveAppConfig } from './config';
import { createRepository } from './data';
import { I18nProvider } from './i18n';
import { SetupScreen } from './screens/SetupScreen';
import { Root } from './screens/Root';
import { AppProvider } from './state/AppProvider';

const config = resolveAppConfig(import.meta.env);

export default function App() {
  const repo = useMemo(() => (config.ok ? createRepository(config) : null), []);
  if (!config.ok || !repo) {
    return (
      <I18nProvider>
        <SetupScreen reason={config.ok ? 'missing-mode' : config.reason} />
      </I18nProvider>
    );
  }
  return (
    <I18nProvider>
      <AppProvider repo={repo}>
        <Root />
      </AppProvider>
    </I18nProvider>
  );
}
