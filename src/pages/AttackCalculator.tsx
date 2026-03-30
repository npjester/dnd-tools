import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import CasinoIcon from '@mui/icons-material/Casino';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { AttackProfile, AttackResults, IndividualAttackRoll } from '../types';
import { CREATURE_PRESETS, DAMAGE_TYPES } from '../data/creatures';
import { formatDice, simulateAttack } from '../utils/dice';

const MAX_DISPLAYED_ROLLS = 100;

function runSimulation(
  creatureCount: number,
  attacksPerCreature: number,
  attack: AttackProfile,
  armorClass: number,
): AttackResults {
  const rolls: IndividualAttackRoll[] = [];

  for (let i = 0; i < creatureCount * attacksPerCreature; i++) {
    rolls.push(simulateAttack(attack.attackBonus, attack.damage, armorClass));
  }

  const hits = rolls.filter((r) => r.hit).length;
  const criticalHits = rolls.filter((r) => r.criticalHit).length;
  const totalDamage = rolls.reduce((sum, r) => sum + r.damage, 0);
  const averageDamagePerHit = hits > 0 ? totalDamage / hits : 0;

  return {
    totalCreatures: creatureCount,
    attacksPerCreature,
    totalAttacks: rolls.length,
    hits,
    misses: rolls.length - hits,
    criticalHits,
    totalDamage,
    averageDamagePerHit,
    rolls,
  };
}

export default function AttackCalculator() {
  const navigate = useNavigate();

  // Creature & attack selection
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Skeleton');
  const [selectedAttackName, setSelectedAttackName] = useState<string>('Shortbow');

  // Mutable attack fields (allow full customisation)
  const [attackBonus, setAttackBonus] = useState<number>(4);
  const [diceCount, setDiceCount] = useState<number>(1);
  const [diceSides, setDiceSides] = useState<number>(6);
  const [diceModifier, setDiceModifier] = useState<number>(2);
  const [damageType, setDamageType] = useState<string>('piercing');

  // Simulation parameters
  const [creatureCount, setCreatureCount] = useState<number>(20);
  const [attacksPerCreature, setAttacksPerCreature] = useState<number>(1);
  const [armorClass, setArmorClass] = useState<number>(15);

  const [results, setResults] = useState<AttackResults | null>(null);
  const [showAllRolls, setShowAllRolls] = useState(false);

  const selectedPreset = CREATURE_PRESETS.find((p) => p.name === selectedPresetName);

  function applyPreset(presetName: string) {
    const preset = CREATURE_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setSelectedPresetName(presetName);
    const firstAttack = preset.attacks[0];
    setSelectedAttackName(firstAttack.name);
    applyAttackProfile(firstAttack);
  }

  function applyAttackProfile(profile: AttackProfile) {
    setAttackBonus(profile.attackBonus);
    setDiceCount(profile.damage.count);
    setDiceSides(profile.damage.sides);
    setDiceModifier(profile.damage.modifier);
    setDamageType(profile.damageType);
  }

  function handleAttackChange(attackName: string) {
    setSelectedAttackName(attackName);
    const attack = selectedPreset?.attacks.find((a) => a.name === attackName);
    if (attack) applyAttackProfile(attack);
  }

  function handleSimulate() {
    const attack: AttackProfile = {
      name: selectedAttackName,
      attackBonus,
      damage: { count: diceCount, sides: diceSides, modifier: diceModifier },
      damageType,
    };
    const res = runSimulation(creatureCount, attacksPerCreature, attack, armorClass);
    setResults(res);
    setShowAllRolls(false);
  }

  const displayedRolls = results
    ? showAllRolls
      ? results.rolls
      : results.rolls.slice(0, MAX_DISPLAYED_ROLLS)
    : [];

  const hitRate = results ? ((results.hits / results.totalAttacks) * 100).toFixed(1) : null;

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
          ⚔️ Attack Calculator
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Left panel: inputs */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Creature &amp; Attack
            </Typography>

            {/* Creature preset */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="creature-label">Creature Preset</InputLabel>
              <Select
                labelId="creature-label"
                value={selectedPresetName}
                label="Creature Preset"
                onChange={(e) => applyPreset(e.target.value)}
              >
                {CREATURE_PRESETS.map((p) => (
                  <MenuItem key={p.name} value={p.name}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Attack selection */}
            {selectedPreset && selectedPreset.attacks.length > 1 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="attack-label">Attack</InputLabel>
                <Select
                  labelId="attack-label"
                  value={selectedAttackName}
                  label="Attack"
                  onChange={(e) => handleAttackChange(e.target.value)}
                >
                  {selectedPreset.attacks.map((a) => (
                    <MenuItem key={a.name} value={a.name}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Attack Stats (editable)
            </Typography>

            {/* Attack bonus */}
            <TextField
              label="Attack Bonus"
              type="number"
              value={attackBonus}
              onChange={(e) => setAttackBonus(Number(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
              slotProps={{ htmlInput: { min: -10, max: 20 } }}
            />

            {/* Damage dice */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                label="# Dice"
                type="number"
                value={diceCount}
                onChange={(e) => setDiceCount(Math.max(1, Number(e.target.value)))}
                slotProps={{ htmlInput: { min: 1, max: 20 } }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Sides"
                type="number"
                value={diceSides}
                onChange={(e) => setDiceSides(Math.max(2, Number(e.target.value)))}
                slotProps={{ htmlInput: { min: 2, max: 100 } }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Modifier"
                type="number"
                value={diceModifier}
                onChange={(e) => setDiceModifier(Number(e.target.value))}
                slotProps={{ htmlInput: { min: -10, max: 20 } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            {/* Damage type */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="damage-type-label">Damage Type</InputLabel>
              <Select
                labelId="damage-type-label"
                value={damageType}
                label="Damage Type"
                onChange={(e) => setDamageType(e.target.value)}
              >
                {DAMAGE_TYPES.map((dt) => (
                  <MenuItem key={dt} value={dt}>
                    {dt.charAt(0).toUpperCase() + dt.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Damage expression:{' '}
                <strong>
                  {formatDice({ count: diceCount, sides: diceSides, modifier: diceModifier })}{' '}
                  {damageType}
                </strong>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Simulation Parameters
            </Typography>

            {/* Creature count */}
            <Typography gutterBottom>
              Number of Creatures: <strong>{creatureCount}</strong>
            </Typography>
            <Slider
              value={creatureCount}
              onChange={(_, v) => setCreatureCount(v as number)}
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
              sx={{ mb: 3 }}
            />

            {/* Attacks per creature */}
            <Typography gutterBottom>
              Attacks per Creature: <strong>{attacksPerCreature}</strong>
            </Typography>
            <Slider
              value={attacksPerCreature}
              onChange={(_, v) => setAttacksPerCreature(v as number)}
              min={1}
              max={5}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
              ]}
              sx={{ mb: 3 }}
            />

            {/* Armor class */}
            <Typography gutterBottom>
              Target Armor Class (AC): <strong>{armorClass}</strong>
            </Typography>
            <Slider
              value={armorClass}
              onChange={(_, v) => setArmorClass(v as number)}
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
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              size="large"
              startIcon={<CasinoIcon />}
              onClick={handleSimulate}
              fullWidth
              color="error"
            >
              Roll Attacks
            </Button>
          </Paper>
        </Grid>

        {/* Right panel: results */}
        <Grid size={{ xs: 12, md: 7 }}>
          {!results && (
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box>
                <CasinoIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Configure your attack on the left and click <strong>Roll Attacks</strong> to see the results.
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
                  {results.totalCreatures} {selectedPresetName}
                  {results.totalCreatures !== 1 ? 's' : ''} using{' '}
                  <strong>{selectedAttackName}</strong> ({attacksPerCreature} attack
                  {attacksPerCreature !== 1 ? 's' : ''} each) vs AC {armorClass} — Attack Bonus:{' '}
                  {attackBonus >= 0 ? '+' : ''}
                  {attackBonus}, Damage:{' '}
                  {formatDice({ count: diceCount, sides: diceSides, modifier: diceModifier })}{' '}
                  {damageType}
                </Typography>

                <Grid container spacing={2}>
                  {[
                    { label: 'Total Attacks', value: results.totalAttacks, color: 'text.primary' },
                    { label: 'Hits', value: results.hits, color: 'success.main' },
                    { label: 'Misses', value: results.misses, color: 'error.main' },
                    { label: 'Critical Hits', value: results.criticalHits, color: 'warning.main' },
                    { label: 'Hit Rate', value: `${hitRate}%`, color: 'info.main' },
                    { label: 'Total Damage', value: results.totalDamage, color: 'secondary.main' },
                    {
                      label: 'Avg Dmg / Hit',
                      value: results.averageDamagePerHit.toFixed(1),
                      color: 'text.primary',
                    },
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
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Individual Rolls
                  </Typography>
                  {results.totalAttacks > MAX_DISPLAYED_ROLLS && (
                    <Typography variant="caption" color="text.secondary">
                      Showing {showAllRolls ? results.totalAttacks : Math.min(MAX_DISPLAYED_ROLLS, results.totalAttacks)} of{' '}
                      {results.totalAttacks}
                    </Typography>
                  )}
                </Stack>

                {results.totalAttacks > MAX_DISPLAYED_ROLLS && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    There are {results.totalAttacks} rolls. Showing the first {MAX_DISPLAYED_ROLLS} by default.
                  </Alert>
                )}

                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell align="center">d20</TableCell>
                        <TableCell align="center">Bonus</TableCell>
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">Result</TableCell>
                        <TableCell align="center">Damage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedRolls.map((roll, idx) => (
                        <TableRow
                          key={idx}
                          sx={{
                            backgroundColor: roll.criticalHit
                              ? 'warning.light'
                              : roll.hit
                                ? 'success.light'
                                : 'inherit',
                            opacity: roll.hit ? 1 : 0.6,
                          }}
                        >
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell align="center">
                            <Tooltip title={roll.d20Roll === 20 ? 'Natural 20!' : roll.d20Roll === 1 ? 'Critical Miss!' : ''}>
                              <span
                                style={{
                                  fontWeight: roll.d20Roll === 20 || roll.d20Roll === 1 ? 700 : 400,
                                  color: roll.d20Roll === 20 ? '#ed6c02' : roll.d20Roll === 1 ? '#d32f2f' : 'inherit',
                                }}
                              >
                                {roll.d20Roll}
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            {roll.attackBonus >= 0 ? '+' : ''}
                            {roll.attackBonus}
                          </TableCell>
                          <TableCell align="center">{roll.total}</TableCell>
                          <TableCell align="center">
                            {roll.criticalHit ? (
                              <Chip label="Critical!" size="small" color="warning" />
                            ) : roll.hit ? (
                              <Chip label="Hit" size="small" color="success" />
                            ) : (
                              <Chip label="Miss" size="small" color="default" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {roll.hit ? (
                              <Tooltip
                                title={`Rolls: [${roll.damageRolls.join(', ')}]${diceModifier > 0 ? ` + ${diceModifier}` : diceModifier < 0 ? ` - ${Math.abs(diceModifier)}` : ''}`}
                              >
                                <span>{roll.damage}</span>
                              </Tooltip>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {results.totalAttacks > MAX_DISPLAYED_ROLLS && !showAllRolls && (
                  <Button
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => setShowAllRolls(true)}
                  >
                    Show all {results.totalAttacks} rolls
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
