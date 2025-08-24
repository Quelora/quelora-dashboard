// ./src/pages/ClientPage.jsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Client from '../components/Client/Client';

const ClientePage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('client.title');
  }, [t]);

  return <Client />;
};

export default ClientePage;