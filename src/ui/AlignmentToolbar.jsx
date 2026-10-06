import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowLeftRight, ArrowUpDown,
} from 'lucide-react'
import { Paper, IconButton, Divider, Tooltip } from '@mui/material'
import { useLabelStore } from '../store/labelStore'

const BTNS = [
  { mode: 'left', icon: AlignLeft, title: 'Align left' },
  { mode: 'centerH', icon: AlignCenter, title: 'Align center' },
  { mode: 'right', icon: AlignRight, title: 'Align right' },
  { mode: 'top', icon: AlignStartVertical, title: 'Align top' },
  { mode: 'centerV', icon: AlignCenterVertical, title: 'Align middle' },
  { mode: 'bottom', icon: AlignEndVertical, title: 'Align bottom' },
]

export default function AlignmentToolbar() {
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const alignSelected = useLabelStore((s) => s.alignSelected)
  const distributeSelected = useLabelStore((s) => s.distributeSelected)

  if (selectedKeys.length < 1) return null

  return (
    <Paper
      elevation={4}
      sx={{
        pointerEvents: 'auto',
        position: 'absolute',
        left: '50%',
        top: 12,
        zIndex: 20,
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        borderRadius: 3,
        p: 0.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {BTNS.map(({ mode, icon: Icon, title }) => (
        <Tooltip key={mode} title={title} arrow>
          <IconButton
            size="small"
            onClick={() => alignSelected(mode)}
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'primary.light',
              },
            }}
          >
            <Icon size={15} />
          </IconButton>
        </Tooltip>
      ))}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 18, my: 'auto' }} />

      <Tooltip title="Distribute horizontally" arrow>
        <IconButton
          size="small"
          onClick={() => distributeSelected('h')}
          sx={{
            width: 30,
            height: 30,
            borderRadius: 2,
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
              bgcolor: 'primary.light',
            },
          }}
        >
          <ArrowLeftRight size={15} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Distribute vertically" arrow>
        <IconButton
          size="small"
          onClick={() => distributeSelected('v')}
          sx={{
            width: 30,
            height: 30,
            borderRadius: 2,
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
              bgcolor: 'primary.light',
            },
          }}
        >
          <ArrowUpDown size={15} />
        </IconButton>
      </Tooltip>
    </Paper>
  )
}
