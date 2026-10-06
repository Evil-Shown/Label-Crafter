import {
  Grid3x3,
  Magnet,
  Scan,
  Braces,
  Code,
  FileSpreadsheet,
  Printer,
  Ruler,
  Flame,
  Undo2,
  Redo2,
} from 'lucide-react'
import {
  Paper,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material'
import { useLabelStore } from '../store/labelStore'
import { PRINTER_BRANDS, brandLanguage, LANGUAGE_LABELS } from '../services/printService'

export default function CanvasSubBar() {
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const setLabelSize = useLabelStore((s) => s.setLabelSize)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const showGrid = useLabelStore((s) => s.showGrid)
  const snapToGrid = useLabelStore((s) => s.snapToGrid)
  const snapToEdges = useLabelStore((s) => s.snapToEdges)
  const showKeysOnCanvas = useLabelStore((s) => s.showKeysOnCanvas)
  const showZplPanel = useLabelStore((s) => s.showZplPanel)
  const thermalPreview = useLabelStore((s) => s.thermalPreview)
  const undo = useLabelStore((s) => s.undo)
  const redo = useLabelStore((s) => s.redo)
  const canUndo = useLabelStore((s) => s._history?.length > 0)
  const canRedo = useLabelStore((s) => s._future?.length > 0)

  const sizes = [
    { w: 100, h: 150, label: '100 × 150 mm' },
    { w: 100, h: 111, label: '100 × 111 mm' },
    { w: 99, h: 149, label: '99 × 149 mm' },
    { w: 100, h: 60, label: '100 × 60 mm' },
    { w: 90, h: 43, label: '90 × 43 mm' },
    { w: 100, h: 50, label: '100 × 50 mm' },
    { w: 75, h: 50, label: '75 × 50 mm' },
    { w: 102, h: 152, label: '4 × 6 in (102 × 152 mm)' },
  ]
  const sizeKey = `${Math.round(width)}x${Math.round(height)}`
  const currentSize = sizes.find((s) => `${s.w}x${s.h}` === sizeKey)

  return (
    <Paper
      elevation={1}
      square
      sx={{
        display: 'flex',
        minHeight: 48,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        overflowX: 'auto',
        px: 2,
        py: 0.5,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {/* Left side: Size, DPI, Brand selects & Canvas option chips */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {/* Label Size Select */}
        <FormControl size="small" sx={{ minWidth: 130, flexShrink: 0 }}>
          <Select
            value={sizeKey}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number)
              if (w && h) setLabelSize(w, h)
            }}
            sx={{
              height: 34,
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 9999,
              bgcolor: 'background.paper',
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                py: 0.5,
                pl: 1.2,
              },
            }}
            startAdornment={<Ruler size={14} style={{ opacity: 0.6, marginRight: -2 }} />}
          >
            {!currentSize && (
              <MenuItem value={sizeKey}>
                {Math.round(width)} × {Math.round(height)} mm
              </MenuItem>
            )}
            {sizes.map((s) => (
              <MenuItem key={s.label} value={`${s.w}x${s.h}`}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* DPI Select */}
        <FormControl size="small" sx={{ minWidth: 95, flexShrink: 0 }}>
          <Select
            value={printerDpi || 300}
            onChange={(e) => setPrintConfig({ printerDpi: Number(e.target.value) })}
            sx={{
              height: 34,
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 9999,
              bgcolor: 'background.paper',
              '& .MuiSelect-select': { py: 0.5, px: 1.2 },
            }}
          >
            <MenuItem value={203}>203 DPI</MenuItem>
            <MenuItem value={300}>300 DPI</MenuItem>
            <MenuItem value={600}>600 DPI</MenuItem>
          </Select>
        </FormControl>

        {/* Printer Brand / Language Select */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, flexShrink: 0 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={printerBrand || 'zebra'}
              onChange={(e) => setPrintConfig({ printerBrand: e.target.value })}
              sx={{
                height: 32,
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 2,
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  py: 0.5,
                  pl: 1,
                },
              }}
              startAdornment={<Printer size={14} style={{ opacity: 0.6, marginRight: -2 }} />}
              title={`Printer code language: ${(LANGUAGE_LABELS[brandLanguage(printerBrand)] || 'ZPL').toUpperCase()}`}
            >
              {PRINTER_BRANDS.map((p) => (
                <MenuItem key={p.brand} value={p.brand} title={p.hint}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

        {/* Material ToggleButtonGroup for Canvas controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <Tooltip title="Show 1 mm grid" arrow>
            <Button
              size="small"
              variant={showGrid ? 'contained' : 'outlined'}
              color={showGrid ? 'primary' : 'inherit'}
              onClick={() => setPrintConfig({ showGrid: !showGrid })}
              startIcon={<Grid3x3 size={14} />}
              sx={{
                height: 32,
                px: 1.5,
                minWidth: 'auto',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 9999,
                borderColor: showGrid ? 'transparent' : 'divider',
                bgcolor: showGrid ? undefined : 'background.paper',
              }}
            >
              <span className="hidden xl:inline">Grid</span>
            </Button>
          </Tooltip>

          <Tooltip title="Snap to grid" arrow>
            <Button
              size="small"
              variant={snapToGrid ? 'contained' : 'outlined'}
              color={snapToGrid ? 'primary' : 'inherit'}
              onClick={() => setPrintConfig({ snapToGrid: !snapToGrid })}
              startIcon={<Magnet size={14} />}
              sx={{
                height: 32,
                px: 1.5,
                minWidth: 'auto',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 9999,
                borderColor: snapToGrid ? 'transparent' : 'divider',
                bgcolor: snapToGrid ? undefined : 'background.paper',
              }}
            >
              <span className="hidden xl:inline">Snap</span>
            </Button>
          </Tooltip>

          <Tooltip title="Snap to edges" arrow>
            <Button
              size="small"
              variant={snapToEdges ? 'contained' : 'outlined'}
              color={snapToEdges ? 'primary' : 'inherit'}
              onClick={() => setPrintConfig({ snapToEdges: !snapToEdges })}
              startIcon={<Scan size={14} />}
              sx={{
                height: 32,
                px: 1.5,
                minWidth: 'auto',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 9999,
                borderColor: snapToEdges ? 'transparent' : 'divider',
                bgcolor: snapToEdges ? undefined : 'background.paper',
              }}
            >
              <span className="hidden xl:inline">Edges</span>
            </Button>
          </Tooltip>

          <Tooltip title="Show field keys on canvas" arrow>
            <Button
              size="small"
              variant={showKeysOnCanvas ? 'contained' : 'outlined'}
              color={showKeysOnCanvas ? 'primary' : 'inherit'}
              onClick={() => setPrintConfig({ showKeysOnCanvas: !showKeysOnCanvas })}
              startIcon={<Braces size={14} />}
              sx={{
                height: 32,
                px: 1.5,
                minWidth: 'auto',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 9999,
                borderColor: showKeysOnCanvas ? 'transparent' : 'divider',
                bgcolor: showKeysOnCanvas ? undefined : 'background.paper',
              }}
            >
              <span className="hidden 2xl:inline">Keys</span>
            </Button>
          </Tooltip>

          <Tooltip title="Preview thermal printer dot burn" arrow>
            <Button
              size="small"
              variant={thermalPreview ? 'contained' : 'outlined'}
              color={thermalPreview ? 'primary' : 'inherit'}
              onClick={() => setPrintConfig({ thermalPreview: !thermalPreview })}
              startIcon={<Flame size={14} />}
              sx={{
                height: 32,
                px: 1.5,
                minWidth: 'auto',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 9999,
                borderColor: thermalPreview ? 'transparent' : 'divider',
                bgcolor: thermalPreview ? undefined : 'background.paper',
              }}
            >
              <span className="hidden 2xl:inline">Thermal</span>
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Right side: Undo/Redo button group, Real data, and Code */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {/* Undo / Redo Group */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            p: 0.25,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Tooltip title="Undo (Ctrl+Z)" arrow>
            <span>
              <IconButton
                size="small"
                disabled={!canUndo}
                onClick={undo}
                sx={{ width: 28, height: 28, borderRadius: 1.5 }}
              >
                <Undo2 size={15} />
              </IconButton>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 16, my: 'auto' }} />
          <Tooltip title="Redo (Ctrl+Y)" arrow>
            <span>
              <IconButton
                size="small"
                disabled={!canRedo}
                onClick={redo}
                sx={{ width: 28, height: 28, borderRadius: 1.5 }}
              >
                <Redo2 size={15} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Real data Button */}
        <Tooltip title="Load a real Opti project file or ERP order" arrow>
          <Button
            size="small"
            variant="outlined"
            onClick={() => useLabelStore.setState({ showLoadDataModal: true })}
            startIcon={<FileSpreadsheet size={15} />}
            sx={{
              height: 32,
              px: 1.8,
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 9999,
              borderColor: 'divider',
              color: 'text.primary',
              bgcolor: 'background.paper',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: 'primary.light',
              },
            }}
          >
            <span className="hidden md:inline">Real data</span>
          </Button>
        </Tooltip>

        {/* Code toggle Button */}
        <Tooltip title="Toggle printer code panel" arrow>
          <Button
            size="small"
            variant={showZplPanel ? 'contained' : 'outlined'}
            color={showZplPanel ? 'primary' : 'inherit'}
            onClick={() => setPrintConfig({ showZplPanel: !showZplPanel })}
            startIcon={<Code size={15} />}
            sx={{
              height: 32,
              px: 1.8,
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 9999,
              borderColor: showZplPanel ? 'transparent' : 'divider',
              bgcolor: showZplPanel ? undefined : 'background.paper',
            }}
          >
            <span className="hidden sm:inline">Code</span>
          </Button>
        </Tooltip>
      </Box>
    </Paper>
  )
}
