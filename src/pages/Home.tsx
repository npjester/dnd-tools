import { Box, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CasinoIcon from '@mui/icons-material/Casino';

interface ToolEntry {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

const tools: ToolEntry[] = [
  {
    title: 'Attack Calculator',
    description:
      'Simulate attacks for a horde of creatures. Calculate hits and total damage against a target armor class.',
    path: '/attack-calculator',
    icon: <CasinoIcon sx={{ fontSize: 64, color: 'error.main' }} />,
  },
  {
    title: 'Legendary Actions Tracker',
    description:
      'Track legendary actions for multiple creatures during combat. Mark used actions, reset per creature or all at once.',
    path: '/legendary-actions',
    icon: <AutoAwesomeIcon sx={{ fontSize: 64, color: 'secondary.main' }} />,
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 6, px: 3, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
          ⚔️ D&amp;D Tools
        </Typography>
        <Typography variant="h6" color="text.secondary">
          A collection of utilities to help Dungeon Masters and players run smoother sessions.
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {tools.map((tool) => (
          <Grid key={tool.path} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(tool.path)}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{tool.icon}</Box>
                  <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
                    {tool.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tool.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
