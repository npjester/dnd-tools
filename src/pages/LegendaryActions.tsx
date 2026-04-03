import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TrackedCreature {
  id: number;
  name: string;
  maxActions: number;
  usedActions: number;
}

let nextId = 1;

export default function LegendaryActions() {
  const navigate = useNavigate();
  const [creatures, setCreatures] = useState<TrackedCreature[]>([]);
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState<number | ''>(3);

  function addCreature() {
    const name = newName.trim();
    const max = typeof newMax === 'number' ? newMax : 0;
    if (!name || max < 1) return;
    setCreatures((prev) => [
      ...prev,
      { id: nextId++, name, maxActions: max, usedActions: 0 },
    ]);
    setNewName('');
    setNewMax(3);
  }

  function deleteCreature(id: number) {
    setCreatures((prev) => prev.filter((c) => c.id !== id));
  }

  function deleteAll() {
    setCreatures([]);
  }

  function resetCreature(id: number) {
    setCreatures((prev) =>
      prev.map((c) => (c.id === id ? { ...c, usedActions: 0 } : c)),
    );
  }

  function resetAll() {
    setCreatures((prev) => prev.map((c) => ({ ...c, usedActions: 0 })));
  }

  function toggleAction(id: number, index: number) {
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        // If the pip clicked is already used (index < usedActions), set usedActions to index
        // which "un-uses" that pip and all after it.
        // If the pip is unused, set usedActions to index + 1 (use up through this pip).
        const newUsed = index < c.usedActions ? index : index + 1;
        return { ...c, usedActions: Math.max(0, Math.min(c.maxActions, newUsed)) };
      }),
    );
  }

  return (
    <Box sx={{ py: 4, px: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
        <Tooltip title="Back to home">
          <IconButton onClick={() => navigate('/')} size="small">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" fontWeight={700} sx={{ flexGrow: 1 }}>
          ✨ Legendary Actions Tracker
        </Typography>
        {creatures.length > 0 && (
          <>
            <Tooltip title="Reset all creatures">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={resetAll}
                size="small"
              >
                Reset All
              </Button>
            </Tooltip>
            <Tooltip title="Delete all creatures">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={deleteAll}
                size="small"
              >
                Delete All
              </Button>
            </Tooltip>
          </>
        )}
      </Stack>

      {/* Add Creature Form */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Add Creature
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
          <TextField
            label="Creature Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCreature()}
            size="small"
            fullWidth
            placeholder="e.g. Ancient Red Dragon"
          />
          <TextField
            label="Legendary Actions"
            type="number"
            value={newMax}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setNewMax(isNaN(v) ? '' : Math.max(1, Math.min(10, v)));
            }}
            size="small"
            slotProps={{ htmlInput: { min: 1, max: 10 } }}
            sx={{ minWidth: 160 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addCreature}
            disabled={!newName.trim() || !newMax}
            sx={{ whiteSpace: 'nowrap', minWidth: 140 }}
          >
            Add Creature
          </Button>
        </Stack>
      </Paper>

      {/* Creature List */}
      {creatures.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="h6">No creatures tracked yet.</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Add a creature above to start tracking legendary actions.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {creatures.map((creature) => (
            <Paper key={creature.id} sx={{ p: 2.5 }} elevation={2}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                {/* Name */}
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ flexGrow: 1, minWidth: 0, wordBreak: 'break-word' }}
                >
                  {creature.name}
                </Typography>

                {/* Action Pips */}
                <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                    {creature.usedActions}/{creature.maxActions}
                  </Typography>
                  {Array.from({ length: creature.maxActions }).map((_, i) => {
                    const used = i < creature.usedActions;
                    return (
                      <Tooltip
                        key={i}
                        title={used ? `Remove action ${i + 1}` : `Use action ${i + 1}`}
                      >
                        <Box
                          onClick={() => toggleAction(creature.id, i)}
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: used ? 'secondary.main' : 'text.disabled',
                            backgroundColor: used ? 'secondary.main' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s, border-color 0.15s',
                            '&:hover': {
                              borderColor: used ? 'secondary.light' : 'secondary.main',
                              backgroundColor: used ? 'secondary.dark' : 'secondary.dark',
                              opacity: 0.85,
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Stack>

                {/* Reset Button */}
                <Tooltip title="Reset actions">
                  <span>
                    <IconButton
                      onClick={() => resetCreature(creature.id)}
                      color="secondary"
                      size="small"
                      disabled={creature.usedActions === 0}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* Delete Button */}
                <Tooltip title="Delete creature">
                  <IconButton
                    onClick={() => deleteCreature(creature.id)}
                    color="error"
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
