import {
  AppBar,
  CssBaseline,
  IconButton,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Home from './pages/Home';
import AttackCalculator from './pages/AttackCalculator';
import LegendaryActions from './pages/LegendaryActions';
import SaveCalculator from './pages/SaveCalculator';

function App() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#7c4dff',
          },
          secondary: {
            main: '#ff6d00',
          },
          ...(mode === 'dark'
            ? {
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
              }
            : {}),
        },
        typography: {
          fontFamily: '"Segoe UI", Roboto, Arial, sans-serif',
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppBar position="sticky" color="default" elevation={1} enableColorOnDark>
          <Toolbar variant="dense">
            <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
              ⚔️ D&amp;D Tools
            </Typography>
            <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton
                onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                color="inherit"
                size="small"
              >
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/attack-calculator" element={<AttackCalculator />} />
          <Route path="/legendary-actions" element={<LegendaryActions />} />
          <Route path="/save-calculator" element={<SaveCalculator />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
