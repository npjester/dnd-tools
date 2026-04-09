import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { IndividualSaveRoll, SaveResults } from '../types';
import { simulateSave } from '../utils/dice';

const MAX_DISPLAYED_ROLLS = 100;

interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  marks: { value: number; label: string }[];
  onChange: (value: number) => void;
}

function SliderWithInput({ label, value, min, max, step, marks, onChange }: SliderWithInputProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography>{label}</Typography>
        <TextField
          type="number"
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) {
              onChange(Math.max(min, Math.min(max, v)));
            }
          }}
          size="small"
          slotProps={{ htmlInput: { min, max, step } }}
          sx={{ width: 80 }}
        />
      </Stack>
      <Slider
        value={value}
        onChange={(_, v) => onChange(v as number)}
        min={min}
        max={max}
        step={step}
        marks={marks}
      />
    </Box>
  );
}

function runSimulation(
  creatureCount: number,
  saveDC: number,
  saveBonus: number,
): SaveResults {
  const rolls: IndividualSaveRoll[] = [];

  for (let i = 0; i < creatureCount; i++) {
    rolls.push(simulateSave(saveBonus, saveDC));
  }

  const successes = rolls.filter((r) => r.success).length;
  const naturalTwenties = rolls.filter((r) => r.naturalTwenty).length;
  const naturalOnes = rolls.filter((r) => r.naturalOne).length;

  return {
    totalCreatures: creatureCount,
    saveDC,
    saveBonus,
    successes,
    failures: creatureCount - successes,
    naturalTwenties,
    naturalOnes,
    rolls,
  };
}

export default function SaveCalculator() {
  const navigate = useNavigate();

  const [creatureCount, setCreatureCount] = useState<number>(20);
  const [saveDC, setSaveDC] = useState<number>(15);
  const [saveBonus, setSaveBonus] = useState<number>(0);

  const [results, setResults] = useState<SaveResults | null>(null);
  const [showAllRolls, setShowAllRolls] = useState(false);

  function handleSimulate() {
    const res = runSimulation(creatureCount, saveDC, saveBonus);
    setResults(res);
    setShowAllRolls(false);
  }

  const displayedRolls = results
    ? showAllRolls
      ? results.rolls
      : results.rolls.slice(0, MAX_DISPLAYED_ROLLS)
    : [];

  const successRate = results
    ? ((results.successes / results.totalCreatures) * 100).toFixed(1)
    : null;

  const saveBonusLabel = saveBonus >= 0 ? `+${saveBonus}` : `${saveBonus}`;

  return (
    <Box sx={{ py: 4, px: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
          size="small"
        >
          Home
        </Button>
        <Typography variant="h4" component="h1" fontWeight={700}>
          🛡️ Save Calculator
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Left panel: inputs */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Simulation Parameters
            </Typography>

            {/* Creature count */}
            <SliderWithInput
              label="Number of Monsters"
              value={creatureCount}
              min={1}
              max={100}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 75, label: '75' },
                { value: 100, label: '100' },
              ]}
              onChange={setCreatureCount}
            />

            {/* Save DC */}
            <SliderWithInput
              label="Target Save DC"
              value={saveDC}
              min={1}
              max={30}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 10, label: '10' },
                { value: 15, label: '15' },
                { value: 20, label: '20' },
                { value: 30, label: '30' },
              ]}
              onChange={setSaveDC}
            />

            {/* Save bonus */}
            <SliderWithInput
              label="Monster Save Bonus"
              value={saveBonus}
              min={-10}
              max={20}
              step={1}
              marks={[
                { value: -10, label: '−10' },
                { value: 0, label: '0' },
                { value: 10, label: '+10' },
                { value: 20, label: '+20' },
              ]}
              onChange={setSaveBonus}
            />

            <Button
              variant="contained"
              size="large"
              startIcon={<ShieldIcon />}
              onClick={handleSimulate}
              fullWidth
              color="primary"
            >
              Roll Saves
            </Button>
          </Paper>
        </Grid>

        {/* Right panel: results */}
        <Grid size={{ xs: 12, md: 7 }}>
          {!results && (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box>
                <ShieldIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Configure the save parameters on the left and click{' '}
                  <strong>Roll Saves</strong> to see the results.
                </Typography>
              </Box>
            </Paper>
          )}

          {results && (
            <Stack spacing={3}>
              {/* Summary cards */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {results.totalCreatures} monster{results.totalCreatures !== 1 ? 's' : ''} making
                  a saving throw (save bonus: <strong>{saveBonusLabel}</strong>) against DC{' '}
                  <strong>{results.saveDC}</strong>
                </Typography>

                <Grid container spacing={2}>
                  {[
                    { label: 'Total Rolls', value: results.totalCreatures, color: 'text.primary' },
                    { label: 'Successes', value: results.successes, color: 'success.main' },
                    { label: 'Failures', value: results.failures, color: 'error.main' },
                    {
                      label: 'Natural 20s',
                      value: results.naturalTwenties,
                      color: 'warning.main',
                    },
                    { label: 'Natural 1s', value: results.naturalOnes, color: 'error.light' },
                    { label: 'Success Rate', value: `${successRate}%`, color: 'info.main' },
                  ].map(({ label, value, color }) => (
                    <Grid key={label} size={{ xs: 6, sm: 4 }}>
                      <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight={700} sx={{ color }}>
                          {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Roll details table */}
              <Paper sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    Individual Rolls
                  </Typography>
                  {results.totalCreatures > MAX_DISPLAYED_ROLLS && (
                    <Typography variant="caption" color="text.secondary">
                      Showing{' '}
                      {showAllRolls
                        ? results.totalCreatures
                        : Math.min(MAX_DISPLAYED_ROLLS, results.totalCreatures)}{' '}
                      of {results.totalCreatures}
                    </Typography>
                  )}
                </Stack>

                {results.totalCreatures > MAX_DISPLAYED_ROLLS && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    There are {results.totalCreatures} rolls. Showing the first{' '}
                    {MAX_DISPLAYED_ROLLS} by default.
                  </Alert>
                )}

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell align="center">d20</TableCell>
                        <TableCell align="center">Bonus</TableCell>
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">vs DC {results.saveDC}</TableCell>
                        <TableCell align="center">Result</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedRolls.map((roll, idx) => (
                        <TableRow
                          key={idx}
                          sx={{
                            backgroundColor: roll.naturalTwenty
                              ? 'warning.light'
                              : roll.success
                                ? 'success.light'
                                : 'inherit',
                            opacity: roll.success ? 1 : 0.6,
                          }}
                        >
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell align="center">
                            <Tooltip
                              title={
                                roll.naturalTwenty
                                  ? 'Natural 20!'
                                  : roll.naturalOne
                                    ? 'Natural 1!'
                                    : ''
                              }
                            >
                              <Box
                                component="span"
                                sx={{
                                  fontWeight:
                                    roll.naturalTwenty || roll.naturalOne ? 700 : 400,
                                  color: roll.naturalTwenty
                                    ? 'warning.main'
                                    : roll.naturalOne
                                      ? 'error.main'
                                      : 'inherit',
                                }}
                              >
                                {roll.d20Roll}
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            {roll.saveBonus >= 0 ? '+' : ''}
                            {roll.saveBonus}
                          </TableCell>
                          <TableCell align="center">{roll.total}</TableCell>
                          <TableCell align="center">
                            {roll.naturalTwenty
                              ? '≥ DC (nat 20)'
                              : roll.naturalOne
                                ? '< DC (nat 1)'
                                : roll.total >= results.saveDC
                                  ? `≥ ${results.saveDC}`
                                  : `< ${results.saveDC}`}
                          </TableCell>
                          <TableCell align="center">
                            {roll.naturalTwenty ? (
                              <Chip label="Nat 20!" size="small" color="warning" />
                            ) : roll.success ? (
                              <Chip label="Success" size="small" color="success" />
                            ) : roll.naturalOne ? (
                              <Chip label="Nat 1!" size="small" color="error" />
                            ) : (
                              <Chip label="Failure" size="small" color="default" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {results.totalCreatures > MAX_DISPLAYED_ROLLS && !showAllRolls && (
                  <Button size="small" sx={{ mt: 2 }} onClick={() => setShowAllRolls(true)}>
                    Show all {results.totalCreatures} rolls
                  </Button>
                )}
              </Paper>
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
