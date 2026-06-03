import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  MagicRarity,
  PriceOverrideRule,
  PriceRuleAction,
  PricingPolicy,
  ShopNode,
} from '../types/magicShop';
import { getAllItems } from '../services/magicShop/normalize';
import { generateShopInventory, SHOP_PROFILES } from '../services/magicShop/generator';
import {
  createDefaultShopState,
  exportMagicShopState,
  importMagicShopState,
  loadMagicShopState,
  saveMagicShopState,
} from '../services/magicShop/storage';
import ItemLibraryModal from '../components/ItemLibraryModal';

const RARITY_OPTIONS: MagicRarity[] = [
  'common',
  'uncommon',
  'rare',
  'very rare',
  'legendary',
  'artifact',
  'varies',
];

interface RuleDraft {
  label: string;
  action: PriceRuleAction;
  value: string;
  rarity: string;
  itemType: string;
  tag: string;
  itemId: string;
}

const EMPTY_RULE_DRAFT: RuleDraft = {
  label: '',
  action: 'multiplier',
  value: '1',
  rarity: '',
  itemType: '',
  tag: '',
  itemId: '',
};

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function RuleEditor({
  title,
  policy,
  onAddRule,
  onDeleteRule,
  availableTypes,
  availableTags,
}: {
  title: string;
  policy: PricingPolicy;
  onAddRule: (rule: PriceOverrideRule) => void;
  onDeleteRule: (ruleId: string) => void;
  availableTypes: string[];
  availableTags: string[];
}) {
  const [draft, setDraft] = useState<RuleDraft>(EMPTY_RULE_DRAFT);

  function addRule() {
    const label = draft.label.trim();
    if (!label) return;

    const value = Number(draft.value);
    const nextRule: PriceOverrideRule = {
      id: createId('rule'),
      label,
      action: draft.action,
      value: draft.action === 'none' ? undefined : Number.isFinite(value) ? value : undefined,
      rarity: draft.rarity ? (draft.rarity as MagicRarity) : undefined,
      itemType: draft.itemType || undefined,
      tag: draft.tag || undefined,
      itemId: draft.itemId || undefined,
    };

    onAddRule(nextRule);
    setDraft(EMPTY_RULE_DRAFT);
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <TextField
          label="Rule Label"
          size="small"
          value={draft.label}
          onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
          sx={{ minWidth: 190 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id={`${title}-action`}>Action</InputLabel>
          <Select
            labelId={`${title}-action`}
            label="Action"
            value={draft.action}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, action: e.target.value as PriceRuleAction }))
            }
          >
            <MenuItem value="multiplier">Multiplier</MenuItem>
            <MenuItem value="set">Set price</MenuItem>
            <MenuItem value="none">No override</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={draft.action === 'multiplier' ? 'Multiplier' : 'Set GP'}
          size="small"
          value={draft.value}
          type="number"
          disabled={draft.action === 'none'}
          onChange={(e) => setDraft((prev) => ({ ...prev, value: e.target.value }))}
          sx={{ width: 120 }}
        />
        <Button startIcon={<AddIcon />} variant="contained" onClick={addRule}>
          Add Rule
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id={`${title}-rarity`}>Rarity</InputLabel>
          <Select
            labelId={`${title}-rarity`}
            label="Rarity"
            value={draft.rarity}
            onChange={(e) => setDraft((prev) => ({ ...prev, rarity: e.target.value }))}
          >
            <MenuItem value="">Any rarity</MenuItem>
            {RARITY_OPTIONS.map((rarity) => (
              <MenuItem key={rarity} value={rarity}>
                {rarity}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id={`${title}-type`}>Type</InputLabel>
          <Select
            labelId={`${title}-type`}
            label="Type"
            value={draft.itemType}
            onChange={(e) => setDraft((prev) => ({ ...prev, itemType: e.target.value }))}
          >
            <MenuItem value="">Any type</MenuItem>
            {availableTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id={`${title}-tag`}>Tag</InputLabel>
          <Select
            labelId={`${title}-tag`}
            label="Tag"
            value={draft.tag}
            onChange={(e) => setDraft((prev) => ({ ...prev, tag: e.target.value }))}
          >
            <MenuItem value="">Any tag</MenuItem>
            {availableTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                {tag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Item ID (optional)"
          size="small"
          value={draft.itemId}
          onChange={(e) => setDraft((prev) => ({ ...prev, itemId: e.target.value }))}
          helperText="Use normalized item id, e.g. potion-of-healing"
        />
      </Stack>

      {policy.rules.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No rules configured.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {policy.rules.map((rule) => (
            <Paper key={rule.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {rule.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rule.action}
                    {typeof rule.value === 'number' ? `: ${rule.value}` : ''}
                    {rule.rarity ? ` • rarity=${rule.rarity}` : ''}
                    {rule.itemType ? ` • type=${rule.itemType}` : ''}
                    {rule.tag ? ` • tag=${rule.tag}` : ''}
                    {rule.itemId ? ` • item=${rule.itemId}` : ''}
                  </Typography>
                </Box>
                <Tooltip title="Delete rule">
                  <IconButton size="small" color="error" onClick={() => onDeleteRule(rule.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function MagicItemShop() {
  const navigate = useNavigate();

  const [state, setState] = useState(() => loadMagicShopState());
  const items = useMemo(() => getAllItems(state.customItems), [state.customItems]);
  const [campaignName, setCampaignName] = useState('');
  const [townName, setTownName] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopProfileId, setShopProfileId] = useState<ShopNode['profileId']>('trade_town');
  const [importError, setImportError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedCampaign = state.campaigns.find((campaign) => campaign.id === state.selectedCampaignId) ?? null;
  const selectedTown = state.towns.find((town) => town.id === state.selectedTownId) ?? null;
  const selectedShop = state.shops.find((shop) => shop.id === state.selectedShopId) ?? null;

  const campaignTowns = useMemo(
    () => state.towns.filter((town) => town.campaignId === state.selectedCampaignId),
    [state.towns, state.selectedCampaignId],
  );

  const townShops = useMemo(
    () => state.shops.filter((shop) => shop.townId === state.selectedTownId),
    [state.shops, state.selectedTownId],
  );

  const availableTypes = useMemo(
    () => Array.from(new Set(items.map((item) => item.type))).sort(),
    [items],
  );
  const availableTags = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.tags))).sort(),
    [items],
  );
  const availableSources = useMemo(
    () => Array.from(new Set(items.map((item) => item.source))).sort(),
    [items],
  );

  useEffect(() => {
    saveMagicShopState(state);
  }, [state]);

  function updateShop(updater: (shop: ShopNode) => ShopNode) {
    if (!selectedShop) return;
    setState((prev) => ({
      ...prev,
      shops: prev.shops.map((shop) => (shop.id === selectedShop.id ? updater(shop) : shop)),
    }));
  }

  function addCampaign() {
    const name = campaignName.trim();
    if (!name) return;
    const id = createId('campaign');
    setState((prev) => ({
      ...prev,
      campaigns: [...prev.campaigns, { id, userId: prev.user.id, name }],
      selectedCampaignId: id,
      selectedTownId: null,
      selectedShopId: null,
    }));
    setCampaignName('');
  }

  function addTown() {
    const name = townName.trim();
    const campaignId = state.selectedCampaignId;
    if (!name || !campaignId) return;
    const id = createId('town');
    setState((prev) => ({
      ...prev,
      towns: [...prev.towns, { id, campaignId, name, pricing: { rules: [] } }],
      selectedTownId: id,
      selectedShopId: null,
    }));
    setTownName('');
  }

  function addShop() {
    const name = shopName.trim();
    const townId = state.selectedTownId;
    if (!name || !townId) return;
    const id = createId('shop');
    setState((prev) => ({
      ...prev,
      shops: [
        ...prev.shops,
        {
          id,
          townId,
          name,
          profileId: shopProfileId,
          pricing: { rules: [] },
          generationRules: {
            stockCount: 10,
            allowedRarities: ['common', 'uncommon', 'rare'],
            itemTypes: [],
            tags: [],
            sources: [],
            seededMode: true,
            seed: `${name.toLowerCase().replace(/\s+/g, '-')}-seed`,
          },
          inventory: [],
        },
      ],
      selectedShopId: id,
    }));
    setShopName('');
  }

  function generateInventory() {
    if (!selectedTown || !selectedShop) return;

    const inventory = generateShopInventory({
      items,
      globalPricing: state.user.globalPricing,
      townPricing: selectedTown.pricing,
      shopPricing: selectedShop.pricing,
      shopProfileId: selectedShop.profileId,
      rules: selectedShop.generationRules,
    });

    updateShop((shop) => ({ ...shop, inventory }));
  }

  function resetAll() {
    setState(createDefaultShopState());
  }

  function downloadExport() {
    const payload = exportMagicShopState(state);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'magic-shop-state.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function updateRarityFilter(rarity: MagicRarity, checked: boolean) {
    updateShop((shop) => {
      const set = new Set(shop.generationRules.allowedRarities);
      if (checked) set.add(rarity);
      else set.delete(rarity);
      return {
        ...shop,
        generationRules: {
          ...shop.generationRules,
          allowedRarities: Array.from(set),
        },
      };
    });
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const imported = importMagicShopState(text);
      setState(imported);
      setImportError(null);
    } catch (error) {
      const message =
        error instanceof SyntaxError
          ? 'Import failed: invalid JSON format. Please provide a valid JSON export from this tool.'
          : 'Import failed: file structure is not compatible. Export a fresh file from this tool and try again.';
      setImportError(message);
    }
  }

  return (
    <Box sx={{ py: 4, px: 3, maxWidth: 1300, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} variant="outlined" size="small" onClick={() => navigate('/')}>
          Home
        </Button>
        <Typography variant="h4" fontWeight={700} sx={{ flexGrow: 1 }}>
          🏪 Magic Item Shop Generator
        </Typography>
        <Button
          startIcon={<LibraryBooksIcon />}
          variant="outlined"
          color="secondary"
          onClick={() => setLibraryOpen(true)}
        >
          Item Library ({state.customItems.length})
        </Button>
        <Button startIcon={<DownloadIcon />} variant="outlined" onClick={downloadExport}>
          Export JSON
        </Button>
        <Button
          startIcon={<FileUploadIcon />}
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </Button>
        <Button startIcon={<RefreshIcon />} color="warning" variant="outlined" onClick={resetAll}>
          Reset
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setImportError(null);
              void handleImportFile(file).catch((error: unknown) => {
                const message = error instanceof Error ? error.message : 'Unexpected import failure.';
                setImportError(message);
              });
            }
            e.currentTarget.value = '';
          }}
        />
      </Stack>

      <ItemLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        customItems={state.customItems}
        onChange={(customItems) => setState((prev) => ({ ...prev, customItems }))}
      />

      {importError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImportError(null)}>
          {importError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Taxonomy
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Hierarchy: User → Campaign → Town → Shop
              </Alert>

              <Typography variant="subtitle2" paddingBottom={1}>Campaign</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel id="campaign-select-label">Campaign</InputLabel>
                <Select
                  labelId="campaign-select-label"
                  label="Campaign"
                  value={state.selectedCampaignId ?? ''}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      selectedCampaignId: e.target.value,
                      selectedTownId: null,
                      selectedShopId: null,
                    }))
                  }
                >
                  {state.campaigns.map((campaign) => (
                    <MenuItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  label="New campaign"
                  size="small"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  fullWidth
                />
                <Button onClick={addCampaign} startIcon={<AddIcon />} variant="contained">
                  Add
                </Button>
              </Stack>

              <Typography variant="subtitle2" paddingBottom={1}>Town</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel id="town-select-label">Town</InputLabel>
                <Select
                  labelId="town-select-label"
                  label="Town"
                  value={state.selectedTownId ?? ''}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, selectedTownId: e.target.value, selectedShopId: null }))
                  }
                >
                  {campaignTowns.map((town) => (
                    <MenuItem key={town.id} value={town.id}>
                      {town.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  label="New town"
                  size="small"
                  value={townName}
                  onChange={(e) => setTownName(e.target.value)}
                  fullWidth
                />
                <Button onClick={addTown} startIcon={<AddIcon />} variant="contained" disabled={!selectedCampaign}>
                  Add
                </Button>
              </Stack>

              <Typography variant="subtitle2" paddingBottom={1}>Shop</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel id="shop-select-label">Shop</InputLabel>
                <Select
                  labelId="shop-select-label"
                  label="Shop"
                  value={state.selectedShopId ?? ''}
                  onChange={(e) => setState((prev) => ({ ...prev, selectedShopId: e.target.value }))}
                >
                  {townShops.map((shop) => (
                    <MenuItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="New shop"
                  size="small"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  fullWidth
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="new-shop-profile">Profile</InputLabel>
                  <Select
                    labelId="new-shop-profile"
                    label="Profile"
                    value={shopProfileId}
                    onChange={(e) => setShopProfileId(e.target.value as ShopNode['profileId'])}
                  >
                    {SHOP_PROFILES.map((profile) => (
                      <MenuItem key={profile.id} value={profile.id}>
                        {profile.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button onClick={addShop} startIcon={<AddIcon />} variant="contained" disabled={!selectedTown}>
                  Add
                </Button>
              </Stack>
            </Paper>

            {selectedShop && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Generation Rules
                </Typography>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="profile-select-label">Shop Profile</InputLabel>
                  <Select
                    labelId="profile-select-label"
                    label="Shop Profile"
                    value={selectedShop.profileId}
                    onChange={(e) =>
                      updateShop((shop) => ({ ...shop, profileId: e.target.value as ShopNode['profileId'] }))
                    }
                  >
                    {SHOP_PROFILES.map((profile) => (
                      <MenuItem key={profile.id} value={profile.id}>
                        {profile.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Stock Count"
                  fullWidth
                  size="small"
                  type="number"
                  value={selectedShop.generationRules.stockCount}
                  onChange={(e) =>
                    updateShop((shop) => ({
                      ...shop,
                      generationRules: {
                        ...shop.generationRules,
                        stockCount: Math.max(1, Number(e.target.value) || 1),
                      },
                    }))
                  }
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Seed"
                  fullWidth
                  size="small"
                  value={selectedShop.generationRules.seed}
                  onChange={(e) =>
                    updateShop((shop) => ({
                      ...shop,
                      generationRules: {
                        ...shop.generationRules,
                        seed: e.target.value,
                      },
                    }))
                  }
                  sx={{ mb: 1 }}
                />

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    variant={selectedShop.generationRules.seededMode ? 'contained' : 'outlined'}
                    onClick={() =>
                      updateShop((shop) => ({
                        ...shop,
                        generationRules: { ...shop.generationRules, seededMode: true },
                      }))
                    }
                  >
                    Seeded
                  </Button>
                  <Button
                    variant={!selectedShop.generationRules.seededMode ? 'contained' : 'outlined'}
                    onClick={() =>
                      updateShop((shop) => ({
                        ...shop,
                        generationRules: { ...shop.generationRules, seededMode: false },
                      }))
                    }
                  >
                    Random
                  </Button>
                </Stack>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Allowed Rarity Bands
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                  {RARITY_OPTIONS.map((rarity) => {
                    const selected = selectedShop.generationRules.allowedRarities.includes(rarity);
                    return (
                      <Chip
                        key={rarity}
                        clickable
                        color={selected ? 'secondary' : 'default'}
                        label={rarity}
                        onClick={() => updateRarityFilter(rarity, !selected)}
                      />
                    );
                  })}
                </Stack>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="type-filter">Item Type Filter</InputLabel>
                  <Select
                    labelId="type-filter"
                    label="Item Type Filter"
                    multiple
                    value={selectedShop.generationRules.itemTypes}
                    onChange={(e) =>
                      updateShop((shop) => ({
                        ...shop,
                        generationRules: {
                          ...shop.generationRules,
                          itemTypes: e.target.value as string[],
                        },
                      }))
                    }
                  >
                    {availableTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="tag-filter">Tag Filter</InputLabel>
                  <Select
                    labelId="tag-filter"
                    label="Tag Filter"
                    multiple
                    value={selectedShop.generationRules.tags}
                    onChange={(e) =>
                      updateShop((shop) => ({
                        ...shop,
                        generationRules: {
                          ...shop.generationRules,
                          tags: e.target.value as string[],
                        },
                      }))
                    }
                  >
                    {availableTags.map((tag) => (
                      <MenuItem key={tag} value={tag}>
                        {tag}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="source-filter">Source Filter</InputLabel>
                  <Select
                    labelId="source-filter"
                    label="Source Filter"
                    multiple
                    value={selectedShop.generationRules.sources}
                    onChange={(e) =>
                      updateShop((shop) => ({
                        ...shop,
                        generationRules: {
                          ...shop.generationRules,
                          sources: e.target.value as string[],
                        },
                      }))
                    }
                  >
                    {availableSources.map((source) => (
                      <MenuItem key={source} value={source}>
                        {source}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<StorefrontIcon />}
                  onClick={generateInventory}
                >
                  Generate Inventory
                </Button>
              </Paper>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <RuleEditor
              title="Global Price Overrides"
              policy={state.user.globalPricing}
              availableTypes={availableTypes}
              availableTags={availableTags}
              onAddRule={(rule) =>
                setState((prev) => ({
                  ...prev,
                  user: {
                    ...prev.user,
                    globalPricing: {
                      rules: [...prev.user.globalPricing.rules, rule],
                    },
                  },
                }))
              }
              onDeleteRule={(ruleId) =>
                setState((prev) => ({
                  ...prev,
                  user: {
                    ...prev.user,
                    globalPricing: {
                      rules: prev.user.globalPricing.rules.filter((rule) => rule.id !== ruleId),
                    },
                  },
                }))
              }
            />

            {selectedTown && (
              <RuleEditor
                title="Town Price Overrides"
                policy={selectedTown.pricing}
                availableTypes={availableTypes}
                availableTags={availableTags}
                onAddRule={(rule) =>
                  setState((prev) => ({
                    ...prev,
                    towns: prev.towns.map((town) =>
                      town.id === selectedTown.id
                        ? { ...town, pricing: { rules: [...town.pricing.rules, rule] } }
                        : town,
                    ),
                  }))
                }
                onDeleteRule={(ruleId) =>
                  setState((prev) => ({
                    ...prev,
                    towns: prev.towns.map((town) =>
                      town.id === selectedTown.id
                        ? {
                            ...town,
                            pricing: {
                              rules: town.pricing.rules.filter((rule) => rule.id !== ruleId),
                            },
                          }
                        : town,
                    ),
                  }))
                }
              />
            )}

            {selectedShop && (
              <RuleEditor
                title="Shop Price Overrides"
                policy={selectedShop.pricing}
                availableTypes={availableTypes}
                availableTags={availableTags}
                onAddRule={(rule) =>
                  updateShop((shop) => ({
                    ...shop,
                    pricing: { rules: [...shop.pricing.rules, rule] },
                  }))
                }
                onDeleteRule={(ruleId) =>
                  updateShop((shop) => ({
                    ...shop,
                    pricing: {
                      rules: shop.pricing.rules.filter((rule) => rule.id !== ruleId),
                    },
                  }))
                }
              />
            )}

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Generated Inventory
              </Typography>

              {!selectedShop ? (
                <Typography color="text.secondary">Select a shop to generate inventory.</Typography>
              ) : selectedShop.inventory.length === 0 ? (
                <Typography color="text.secondary">No generated inventory yet.</Typography>
              ) : (
                <>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                    <Chip label={`Items: ${selectedShop.inventory.length}`} color="primary" />
                    <Chip
                      label={`Total Value: ${selectedShop.inventory.reduce((sum, entry) => sum + entry.totalPriceGp, 0).toFixed(2)} gp`}
                      color="secondary"
                    />
                  </Stack>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Rarity</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Base (gp)</TableCell>
                          <TableCell align="right">Effective (gp)</TableCell>
                          <TableCell align="right">Total (gp)</TableCell>
                          <TableCell>Source</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedShop.inventory.map((entry) => (
                          <TableRow key={entry.itemId}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {entry.itemName}
                              </Typography>
                              {entry.appliedOverrides.length > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  {entry.appliedOverrides.map((rule) => `${rule.scope}:${rule.label}`).join(', ')}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{entry.rarity}</TableCell>
                            <TableCell>{entry.type}</TableCell>
                            <TableCell align="right">{entry.quantity}</TableCell>
                            <TableCell align="right">{entry.baseUnitPriceGp.toFixed(2)}</TableCell>
                            <TableCell align="right">{entry.effectiveUnitPriceGp.toFixed(2)}</TableCell>
                            <TableCell align="right">{entry.totalPriceGp.toFixed(2)}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={entry.priceSource}
                                color={
                                  entry.priceSource === 'shop'
                                    ? 'secondary'
                                    : entry.priceSource === 'town'
                                      ? 'warning'
                                      : entry.priceSource === 'global'
                                        ? 'info'
                                        : 'default'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
