// ./src/pages/ProfilePage.jsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Profile from '../components/Profile/Profile';

const ProfilePage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('profile.title');
  }, [t]);

  return <Profile />;
};

export default ProfilePage;