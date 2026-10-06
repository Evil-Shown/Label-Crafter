import { useEffect, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize, Check } from 'lucide-react'
import { Paper, Box, IconButton, Button, Tooltip, Divider, Typography } from '@mui/material'
import { useLabelStore } from '../store/labelStore'
import { pxToMm } from '../utils/units'

function lastSavedLabel(ts) {
  if (!ts) return 'Not saved yet'
  const secs = Math.round((Date.now() - ts) / 1000)
  if (secs < 45) return 'Last saved just now'
  const mins = Math.round(secs / 60)
  if (mins === 1) return 'Last saved 1 min ago'
  if (mins < 60) return `Last saved ${mins} min ago`
  const hours = Math.round(mins / 60)
  return hours === 1 ? 'Last saved 1 hour ago' : `Last saved ${hours} hours ago`
}

export default function BottomFooter() {
  const zoom = useLabelStore((s) => s.zoom)
  const setView = useLabelStore((s) => s.setView)
  const fitToScreen = useLabelStore((s) => s.fitToScreen)
  const cursorPos = useLabelStore((s) => s.cursorPos)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const margins = useLabelStore((s) => s.margins)
  const lastSavedAt = useLabelStore((s) => s.lastSavedAt)
  const [, force] = useState(0)

  // Keep the "last saved" copy honest without re-rendering constantly.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 20000)
    return () => clearInterval(id)
  }, [])

  const handleFit = () => {
    const canvasWrap = document.querySelector('.lc-canvas-wrap')
    if (canvasWrap) {
      const rect = canvasWrap.getBoundingClientRect()
      fitToScreen(rect.width, rect.height)
    }
  }

  const mm = (px) => {
    const v = pxToMm(px)
    return Number.isFinite(v) ? v.toFixed(1) : '0.0'
  }

  return (
    <Paper
      elevation={0}
      square
      sx={{
        display: 'flex',
        height: 42,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.secondary',
        fontSize: '0.8rem',
        userSelect: 'none',
      }}
    >
      {/* 12. Zoom %, Fit, cursor in mm, selection count */}
      <Box sx={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: 1.5 }}>
        {/* Zoom Controls Pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'action.hover',
            p: 0.25,
            borderRadius: 9999,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tooltip title="Zoom out" arrow>
            <IconButton
              size="small"
              onClick={() => setView({ zoom: Math.max(0.15, zoom / 1.15) })}
              sx={{ width: 26, height: 26 }}
            >
              <ZoomOut size={14} />
            </IconButton>
          </Tooltip>
          <Typography
            variant="caption"
            sx={{ width: 42, textAlign: 'center', fontWeight: 700, color: 'text.primary' }}
          >
            {Math.round(zoom * 100)}%
          </Typography>
          <Tooltip title="Zoom in" arrow>
            <IconButton
              size="small"
              onClick={() => setView({ zoom: Math.min(8, zoom * 1.15) })}
              sx={{ width: 26, height: 26 }}
            >
              <ZoomIn size={14} />
            </IconButton>
          </Tooltip>
        </Box>

        <Tooltip title="Fit the label to the window (Ctrl+0)" arrow>
          <Button
            size="small"
            variant="outlined"
            onClick={handleFit}
            startIcon={<Maximize size={13} />}
            sx={{
              height: 28,
              px: 1.4,
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 9999,
              borderColor: 'divider',
              color: 'text.primary',
              bgcolor: 'background.paper',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            Fit
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />

        <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontWeight: 500 }}>
          X {mm(cursorPos?.x ?? 0)} mm · Y {mm(cursorPos?.y ?? 0)} mm
        </Typography>

        {selectedKeys.length > 0 && (
          <Box
            sx={{
              px: 1.2,
              py: 0.2,
              bgcolor: 'primary.light',
              color: 'primary.main',
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: '0.72rem',
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          >
            {selectedKeys.length} selected
          </Box>
        )}
      </Box>

      {/* Right side: Margins & Last saved info */}
      <Box sx={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Margins {margins?.left ?? 0} · {margins?.right ?? 0} · {margins?.top ?? 0} · {margins?.bottom ?? 0} mm
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontWeight: 700,
            fontSize: '0.75rem',
            color: 'success.main',
            bgcolor: 'success.light',
            border: '1px solid',
            borderColor: 'success.main',
            px: 1.2,
            py: 0.3,
            borderRadius: 9999,
          }}
        >
          <Check size={13} strokeWidth={2.5} />
          <span>{lastSavedLabel(lastSavedAt)}</span>
        </Box>
      </Box>
    </Paper>
  )
}
