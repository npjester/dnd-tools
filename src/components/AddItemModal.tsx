import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';

import type { MagicItem, MagicRarity } from '../types/magicShop';
import { makeCustomItem } from './utils';

const RARITY_OPTIONS: MagicRarity[] = [
  'common',
  'uncommon',
  'rare',
  'very rare',
  'legendary',
  'artifact',
  'varies',
];

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAddItem: (item: MagicItem) => void;
}

function AddItemModal({ open, onClose, onAddItem }: AddItemModalProps) {
  // State for the new item form
  const [name, setName] = useState('');
  const [rarity, setRarity] = useState<MagicRarity>('uncommon');
  const [priceGp, setPriceGp] = useState('');
  const [type, setType] = useState('wondrous item');
  const [source, setSource] = useState('CUSTOM');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleAdd() {
    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }
    setError('');
    
    const item = makeCustomItem({
      name: name.trim(),
      rarity,
      valueGp: priceGp ? parseFloat(priceGp) : undefined,
      type: type.trim() || 'wondrous item',
      source: source.trim() || 'CUSTOM',
      description: description.trim(),
      tags,
    });
    
    onAddItem(item);
    resetForm();
  }

  function resetForm() {
    setName('');
    setRarity('uncommon');
    setPriceGp('');
    setType('wondrous item');
    setSource('CUSTOM');
    setDescription('');
    setTags([]);
    setTagInput('');
    setError('');
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add New Item
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Typography color="error">{error}</Typography>
          )}

          <TextField
            label="Item Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="rarity-label">Rarity</InputLabel>
              <Select
                labelId="rarity-label"
                label="Rarity"
                value={rarity}
                onChange={(e) => setRarity(e.target.value as MagicRarity)}
              >
                {RARITY_OPTIONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Price (gp)"
              type="number"
              value={priceGp}
              onChange={(e) => setPriceGp(e.target.value)}
              sx={{ minWidth: 120 }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="wondrous item"
              fullWidth
            />
            <TextField
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="CUSTOM"
              sx={{ minWidth: 120 }}
            />
          </Stack>

          <TextField
            label="Description"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                label="Add tag"
                size="small"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                sx={{ minWidth: 140 }}
              />
              <Button size="small" variant="outlined" onClick={addTag}>
                Add Tag
              </Button>
            </Stack>
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
              {tags.map((tag) => (
                <Button
                  key={tag}
                  size="small"
                  variant="outlined"
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box>
            <Button variant="contained" onClick={handleAdd}>
              Add Item to Library
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default AddItemModal;