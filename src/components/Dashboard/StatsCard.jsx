// ./components/Dashboard/StatsCard.jsx
import { CardContent, Typography, useTheme, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const StatsCard = ({ title, value, icon }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box className="stats-card" sx={{ 
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
    }}>
      <CardContent sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        padding: '16px !important',
        '&:last-child': { paddingBottom: '16px !important' }
      }}>
        <div>
          <Typography className="stats-card-title" variant="subtitle2">
            {t(title)}
          </Typography>
          <Typography className="stats-card-value">
            {value}
          </Typography>
        </div>
        {icon && (
          <Box className="stats-card-icon">
            {icon}
          </Box>
        )}
      </CardContent>
    </Box>
  );
};

export default StatsCard;