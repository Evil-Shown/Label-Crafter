import { Box, Typography } from '@mui/material'
import BrandMark from './BrandMark'
import ReportMark from './ReportMark'

const TILES = [
  {
    id: 'labels',
    title: 'Label Designer',
    text: 'Design Opti and ERP label templates for the printers.',
    Mark: BrandMark,
  },
  {
    id: 'reports',
    title: 'Report Designer',
    text: 'Design Opti report templates — pages, tables and summaries.',
    Mark: ReportMark,
  },
]

export default function AppLauncher({ onChoose }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse 100% 90% at 50% 35%, #0F2240 0%, #0A172C 55%, #050B15 100%)',
        overflow: 'hidden',
        p: 3,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: -80,
          opacity: 0.16,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'%3E%3Cpath d='M28 66L0 50L0 17L28 1L56 17L56 50L28 66L28 97' fill='none' stroke='%2338BDF8' stroke-width='1.2' stroke-opacity='0.6'/%3E%3Cpath d='M28 0L28 33L0 49L0 82L28 98L56 82L56 49L28 33' fill='none' stroke='%232563EB' stroke-width='1.2' stroke-opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '56px 97px',
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: 5 }}>
        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.7rem', letterSpacing: '-0.02em' }}>
          SPIL Designer
        </Typography>
        <Typography sx={{ color: 'rgba(198,214,232,0.9)', mt: 0.75, fontSize: '0.95rem' }}>
          Choose what you want to design
        </Typography>
      </Box>
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {TILES.map(({ id, title, text, Mark }) => (
          <Box
            key={id}
            component="button"
            type="button"
            onClick={() => onChoose(id)}
            sx={{
              width: 280,
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '18px',
              bgcolor: 'rgba(255,255,255,0.06)',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              p: 3,
              transition: 'transform 0.15s ease, background 0.15s ease, border-color 0.15s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(56,189,248,0.55)',
              },
            }}
          >
            <Box
              sx={{
                width: 84,
                height: 84,
                borderRadius: '22px',
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2.5,
                boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              }}
            >
              <Mark size={52} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.15rem' }}>{title}</Typography>
            <Typography sx={{ mt: 0.75, color: 'rgba(198,214,232,0.92)', fontSize: '0.88rem', lineHeight: 1.45 }}>
              {text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
