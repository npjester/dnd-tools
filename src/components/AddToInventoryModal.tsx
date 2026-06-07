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
import { useState, useMemo } from 'react';

import type { MagicItem, MagicRarity } from '../types/magicShop';

interface AddToInventoryModalProps {
  open: boolean;
  onClose: () => void;
  onAddItem: (item: MagicItem) => void;
  items: MagicItem[];
}

const RARITY_OPTIONS: MagicRarity[] = [
  'common',
  'uncommon',
  'rare',
  'very rare',
  'legendary',
  'artifact',
  'varies',
];

function AddToInventoryModal({ open, onClose, onAddItem, items }: AddToInventoryModalProps) {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<MagicRarity | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Filter and sort items by source (custom items first)
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term)
      );
    }
    
    // Apply rarity filter
    if (rarityFilter !== 'all') {
      result = result.filter(item => item.rarity === rarityFilter);
    }
    
    // Apply source filter
    if (sourceFilter !== 'all') {
      result = result.filter(item => item.source === sourceFilter);
    }
    
    // Sort by source: custom items first, then alphabetically by name
    result.sort((a, b) => {
      // Custom items come first
      if (a.source === 'CUSTOM' && b.source !== 'CUSTOM') return -1;
      if (b.source === 'CUSTOM' && a.source !== 'CUSTOM') return 1;
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
    
    return result;
  }, [items, searchTerm, rarityFilter, sourceFilter]);

  // Get unique sources for filter dropdown
  const sources = useMemo(() => {
    const sourceSet = new Set(items.map(item => item.source));
    return Array.from(sourceSet).sort();
  }, [items]);

  function handleAdd() {
    if (!selectedItem) return;
    
    const itemToAdd = items.find(item => item.id === selectedItem);
    if (itemToAdd) {
      onAddItem(itemToAdd);
      setSelectedItem('');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Item to Inventory
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
          <Typography variant="subtitle1">Select Item</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Search input */}
            <TextField
              label="Search Items"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
            
            {/* Rarity filter */}
            <FormControl fullWidth>
              <InputLabel id="rarity-filter-label">Rarity Filter</InputLabel>
              <Select
                labelId="rarity-filter-label"
                label="Rarity Filter"
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value as MagicRarity | 'all')}
              >
                <MenuItem value="all">All Rarities</MenuItem>
                {RARITY_OPTIONS.map((rarity) => (
                  <MenuItem key={rarity} value={rarity}>
                    {rarity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Source filter */}
            <FormControl fullWidth>
              <InputLabel id="source-filter-label">Source Filter</InputLabel>
              <Select
                labelId="source-filter-label"
                label="Source Filter"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <MenuItem value="all">All Sources</MenuItem>
                {sources.map((source) => (
                  <MenuItem key={source} value={source}>
                    {source}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Item dropdown */}
          <FormControl fullWidth>
            <InputLabel id="item-select-label">Item</InputLabel>
            <Select
              labelId="item-select-label"
              label="Item"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              <MenuItem value="">Select an item</MenuItem>
              {filteredItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.rarity}) - {item.source}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleAdd} disabled={!selectedItem}>
              Add to Inventory
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default AddToInventoryModal;