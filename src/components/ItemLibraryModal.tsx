import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useState } from 'react';

import type { MagicItem, MagicRarity } from '../types/magicShop';
import type { ParsedItemLine } from '../services/magicShop/itemParser';
import { parseImportText } from '../services/magicShop/itemParser';
import { normalizeMagicItems } from '../services/magicShop/normalize';

const RARITY_OPTIONS: MagicRarity[] = [
  'common',
  'uncommon',
  'rare',
  'very rare',
  'legendary',
  'artifact',
  'varies',
];

interface SingleItemDraft {
  name: string;
  rarity: MagicRarity;
  priceGp: string;
  type: string;
  source: string;
  description: string;
  tagInput: string;
  tags: string[];
}

const EMPTY_DRAFT: SingleItemDraft = {
  name: '',
  rarity: 'uncommon',
  priceGp: '',
  type: 'wondrous item',
  source: 'CUSTOM',
  description: '',
  tagInput: '',
  tags: [],
};

/** A parsed line that is staged for import with editable tags. */
interface StagedItem {
  lineNumber: number;
  warnings: string[];
  errors: string[];
  item: MagicItem;
}

interface ItemLibraryModalProps {
  open: boolean;
  onClose: () => void;
  /** Current pool of user-created items. */
  customItems: MagicItem[];
  /** Called with the fully updated custom item list whenever items are added/deleted. */
  onChange: (items: MagicItem[]) => void;
}

function makeCustomItem(
  raw: Parameters<typeof normalizeMagicItems>[0][0],
): MagicItem {
  const [normalized] = normalizeMagicItems([raw]);
  return {
    ...normalized,
    metadata: { sourceName: normalized.source, importedFrom: 'manual' },
  };
}

/** Tag chip-input row used in both single-entry and bulk-import preview. */
function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addTag() {
    const tag = input.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
        <TextField
          label="Add tag"
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          sx={{ minWidth: 140 }}
        />
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addTag}>
          Tag
        </Button>
      </Stack>
      <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            onDelete={() => removeTag(tag)}
          />
        ))}
      </Stack>
    </Box>
  );
}

/** Single-item entry form tab. */
function SingleItemTab({
  onAdd,
}: {
  onAdd: (item: MagicItem) => void;
}) {
  const [draft, setDraft] = useState<SingleItemDraft>(EMPTY_DRAFT);
  const [error, setError] = useState('');

  function set<K extends keyof SingleItemDraft>(key: K, value: SingleItemDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleAdd() {
    if (!draft.name.trim()) {
      setError('Item name is required.');
      return;
    }
    setError('');
    const item = makeCustomItem({
      name: draft.name.trim(),
      rarity: draft.rarity,
      valueGp: draft.priceGp ? parseFloat(draft.priceGp) : undefined,
      type: draft.type.trim() || 'wondrous item',
      source: draft.source.trim() || 'CUSTOM',
      description: draft.description.trim(),
      tags: draft.tags,
    });
    onAdd(item);
    setDraft(EMPTY_DRAFT);
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Item Name *"
          size="small"
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          fullWidth
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="single-rarity">Rarity</InputLabel>
          <Select
            labelId="single-rarity"
            label="Rarity"
            value={draft.rarity}
            onChange={(e) => set('rarity', e.target.value as MagicRarity)}
          >
            {RARITY_OPTIONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Price (gp)"
          size="small"
          type="number"
          value={draft.priceGp}
          onChange={(e) => set('priceGp', e.target.value)}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Type"
          size="small"
          value={draft.type}
          onChange={(e) => set('type', e.target.value)}
          placeholder="wondrous item"
          fullWidth
        />
        <TextField
          label="Source"
          size="small"
          value={draft.source}
          onChange={(e) => set('source', e.target.value)}
          placeholder="CUSTOM"
          sx={{ minWidth: 120 }}
        />
      </Stack>

      <TextField
        label="Description"
        size="small"
        multiline
        minRows={2}
        value={draft.description}
        onChange={(e) => set('description', e.target.value)}
        fullWidth
      />

      <TagInput tags={draft.tags} onChange={(tags) => set('tags', tags)} />

      <Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Item to Library
        </Button>
      </Box>
    </Stack>
  );
}

/** Bulk import tab. */
function BulkImportTab({
  onAddAll,
}: {
  onAddAll: (items: MagicItem[]) => void;
}) {
  const [text, setText] = useState('');
  const [staged, setStaged] = useState<StagedItem[] | null>(null);
  const [parseError, setParseError] = useState('');

  function parseText() {
    if (!text.trim()) {
      setParseError('Paste at least one item line before parsing.');
      return;
    }
    setParseError('');
    const lines: ParsedItemLine[] = parseImportText(text);
    if (lines.length === 0) {
      setParseError('No parseable item lines found. Check your input.');
      return;
    }
    const items: StagedItem[] = lines.map((line) => ({
      lineNumber: line.lineNumber,
      warnings: line.warnings,
      errors: line.errors,
      item: makeCustomItem({
        ...line.parsed,
        tags: [],
      }),
    }));
    setStaged(items);
  }

  function updateStagedTags(idx: number, tags: string[]) {
    setStaged((prev) =>
      prev
        ? prev.map((s, i) =>
            i === idx ? { ...s, item: { ...s.item, tags } } : s,
          )
        : null,
    );
  }

  function removeStaged(idx: number) {
    setStaged((prev) => (prev ? prev.filter((_, i) => i !== idx) : null));
  }

  function confirmImport() {
    if (!staged) return;
    const valid = staged.filter((s) => s.errors.length === 0).map((s) => s.item);
    if (valid.length === 0) return;
    onAddAll(valid);
    setText('');
    setStaged(null);
  }

  const validCount = staged ? staged.filter((s) => s.errors.length === 0).length : 0;

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Alert severity="info">
        <Typography variant="body2">
          <strong>Format:</strong> one item per line — <code>Name, Rarity, Price, Description</code>
          <br />
          Use double-quotes around fields that contain commas. Lines starting with <code>#</code> are ignored.
          <br />
          <em>Example:</em>{' '}
          <code>Bob's Big Sword, Rare, 7000gp, Bob's Really Big Sword +1 Attack and +2 Damage</code>
        </Typography>
      </Alert>

      {parseError && (
        <Alert severity="error" onClose={() => setParseError('')}>
          {parseError}
        </Alert>
      )}

      <TextField
        label="Paste items here"
        multiline
        minRows={6}
        fullWidth
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (staged) setStaged(null);
        }}
        placeholder={"Bag of Tricks, Uncommon, 300gp, A bag that can summon random beasts\nFlame Tongue, Rare, 3500gp, A sword wreathed in flames"}
      />

      <Box>
        <Button variant="outlined" onClick={parseText}>
          Parse Items
        </Button>
      </Box>

      {staged && (
        <>
          <Typography variant="subtitle2">
            Preview — {validCount} valid / {staged.length} parsed
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Rarity</TableCell>
                  <TableCell align="right">Price (gp)</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {staged.map((s, idx) => (
                  <TableRow
                    key={s.lineNumber}
                    sx={s.errors.length > 0 ? { bgcolor: 'error.dark', opacity: 0.7 } : undefined}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {s.item.name || <em>(missing)</em>}
                      </Typography>
                    </TableCell>
                    <TableCell>{s.item.rarity}</TableCell>
                    <TableCell align="right">{s.item.basePriceGp.toFixed(2)}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="caption" noWrap title={s.item.description}>
                        {s.item.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <TagInput
                        tags={s.item.tags}
                        onChange={(tags) => updateStagedTags(idx, tags)}
                      />
                    </TableCell>
                    <TableCell>
                      {s.errors.map((e, i) => (
                        <Typography key={i} variant="caption" color="error" display="block">
                          ✗ {e}
                        </Typography>
                      ))}
                      {s.warnings.map((w, i) => (
                        <Typography key={i} variant="caption" color="warning.main" display="block">
                          ⚠ {w}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell padding="checkbox">
                      <Tooltip title="Remove from import">
                        <IconButton size="small" color="error" onClick={() => removeStaged(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={confirmImport}
              disabled={validCount === 0}
            >
              Add {validCount} Item{validCount !== 1 ? 's' : ''} to Library
            </Button>
          </Box>
        </>
      )}
    </Stack>
  );
}

/** The full modal. */
export default function ItemLibraryModal({
  open,
  onClose,
  customItems,
  onChange,
}: ItemLibraryModalProps) {
  const [tab, setTab] = useState(0);

  function handleAdd(item: MagicItem) {
    const exists = customItems.some((c) => c.id === item.id);
    if (exists) {
      onChange(customItems.map((c) => (c.id === item.id ? item : c)));
    } else {
      onChange([...customItems, item]);
    }
  }

  function handleAddAll(items: MagicItem[]) {
    const merged = [...customItems];
    for (const item of items) {
      const idx = merged.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        merged[idx] = item;
      } else {
        merged.push(item);
      }
    }
    onChange(merged);
  }

  function handleDelete(id: string) {
    onChange(customItems.filter((item) => item.id !== id));
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LibraryBooksIcon />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Item Library
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={tab} onChange={(_, v: number) => setTab(v)}>
            <Tab label={`Custom Items (${customItems.length})`} />
            <Tab label="Add Single Item" />
            <Tab label="Bulk Import" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          {tab === 0 && (
            <Box>
              {customItems.length === 0 ? (
                <Typography color="text.secondary">
                  No custom items yet. Use the "Add Single Item" or "Bulk Import" tabs to add items to
                  your pool.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Rarity</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Price (gp)</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Tags</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell padding="checkbox" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.rarity}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell align="right">{item.basePriceGp.toFixed(2)}</TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="caption" title={item.description}>
                              {item.description || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                              {item.tags.map((tag) => (
                                <Chip key={tag} label={tag} size="small" />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell>{item.source}</TableCell>
                          <TableCell padding="checkbox">
                            <Tooltip title="Remove item">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(item.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tab === 1 && <SingleItemTab onAdd={handleAdd} />}

          {tab === 2 && <BulkImportTab onAddAll={handleAddAll} />}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
