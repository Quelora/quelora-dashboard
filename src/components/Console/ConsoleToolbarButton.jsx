import { useTranslation } from 'react-i18next';
import { IconButton, Tooltip } from '@mui/material';
import { Terminal as TerminalIcon } from '@mui/icons-material';

const ConsoleToolbarButton = ({ open, setOpen }) => {
  const { t } = useTranslation();

  const handleToggle = () => {
    const newState = !open;
    setOpen(newState);
    sessionStorage.setItem('consoleDrawerOpen', newState.toString());
  };

  return (
    <Tooltip title={t('console.toggle')}>
      <IconButton
        color="inherit"
        onClick={handleToggle}
        aria-label={t('console.toggle')}
      >
        <TerminalIcon />
      </IconButton>
    </Tooltip>
  );
};

export default ConsoleToolbarButton;