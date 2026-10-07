import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Fade,
} from '@mui/material'
import {
  Database,
  Printer,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  X,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import BrandMark from './BrandMark'

/**
 * StartupSplashScreen
 * Fullscreen plain window experience:
 * - No confining card box; sleek, unboxed, expansive desktop layout
 * - Animated subtle glowing hexagon field and circuit particles in the background
 * - Centered brand mark with breathing ambient illumination
 * - Compact diagnostic pill bar and smooth linear progress
 */
export default function StartupSplashScreen({ onComplete }) {
  const [stage, setStage] = useState(0) // 0: booting, 1: DB, 2: Print, 3: ready
  const [closing, setClosing] = useState(false)
  const dbServer = useLabelStore((s) => s.dbServer)
  const dbStatus = useLabelStore((s) => s.dbStatus)
  const printServiceStatus = useLabelStore((s) => s.printServiceStatus)
  const isDbConfigured = Boolean(dbServer?.trim())
  const isDbConnected = dbStatus === 'connected'
  const isPrintConnected = printServiceStatus === 'connected'

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 350)
    const t2 = setTimeout(() => setStage(2), 950)
    const t3 = setTimeout(() => setStage(3), 1700)
    const t4 = setTimeout(() => {
      setClosing(true)
      setTimeout(() => {
        if (onComplete) onComplete()
      }, 400)
    }, 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [onComplete])

  const handleSkip = () => {
    setClosing(true)
    setTimeout(() => {
      if (onComplete) onComplete()
    }, 200)
  }

  const progressValue = stage === 0 ? 15 : stage === 1 ? 50 : stage === 2 ? 80 : 100

  return (
    <Fade in={!closing} timeout={400}>
      <Box
        onClick={handleSkip}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          cursor: 'pointer',
          background: 'radial-gradient(ellipse 100% 90% at 50% 35%, #0F2240 0%, #0A172C 55%, #050B15 100%)',
          overflow: 'hidden',
          p: 3,
        }}
      >
        {/* Animated Moving Hexagon Grid Field */}
        <Box
          sx={{
            position: 'absolute',
            inset: -80,
            opacity: 0.16,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'%3E%3Cpath d='M28 66L0 50L0 17L28 1L56 17L56 50L28 66L28 97' fill='none' stroke='%2338BDF8' stroke-width='1.2' stroke-opacity='0.6'/%3E%3Cpath d='M28 0L28 33L0 49L0 82L28 98L56 82L56 49L28 33' fill='none' stroke='%232563EB' stroke-width='1.2' stroke-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '56px 97px',
            animation: 'hexPan 25s linear infinite',
            pointerEvents: 'none',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 80%)',
            '@keyframes hexPan': {
              '0%': { transform: 'translate(0, 0)' },
              '100%': { transform: 'translate(56px, 97px)' },
            },
          }}
        />

        {/* Ambient center radial glow */}
        <Box
          sx={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 580,
            height: 440,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(14, 165, 233, 0.10) 45%, transparent 75%)',
            filter: 'blur(75px)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating Skip Chip */}
        <Box
          sx={{
            position: 'absolute',
            top: 24,
            right: 28,
            zIndex: 10,
          }}
          onClick={(e) => {
            e.stopPropagation()
            handleSkip()
          }}
        >
          <Chip
            size="small"
            label="Skip (Esc)"
            onDelete={handleSkip}
            deleteIcon={<X size={14} />}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.75)',
              fontWeight: 600,
              fontSize: '0.75rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.14)',
                color: '#fff',
              },
            }}
          />
        </Box>

        {/* Main Content Area — No Wrapping Box Card */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 480,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Brand Mark with Glowing Aura */}
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '26px',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45), 0 0 40px rgba(37, 99, 235, 0.35)',
              mb: 3.5,
              p: 2.2,
              position: 'relative',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.03)',
              },
            }}
          >
            <BrandMark size={58} className="h-full w-full" />
          </Box>

          {/* Typography */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: '1.85rem',
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              mb: 0.5,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            SPIL Label Designer
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: '#93A3BB',
              fontWeight: 600,
              fontSize: '0.82rem',
              letterSpacing: '0.02em',
              mb: 4,
            }}
          >
            Standalone Windows Edition · Rust Tauri v2
          </Typography>

          {/* Sleek Frameless Status Module */}
          <Box
            sx={{
              width: '100%',
              borderRadius: 4,
              bgcolor: 'rgba(10, 20, 38, 0.55)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              p: 2.5,
              mb: 3,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.75,
            }}
          >
            {/* Database status row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Database
                  size={16}
                  style={{
                    color: stage >= 1 ? (isDbConnected ? '#34D399' : '#FBBF24') : '#64748B',
                  }}
                />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#E2E8F0' }}>
                  Shared Database (SQL)
                </Typography>
              </Box>

              {stage >= 1 ? (
                isDbConnected ? (
                  <Chip
                    size="small"
                    icon={<CheckCircle2 size={12} color="#10B981" />}
                    label={dbServer ? `${dbServer} OK` : 'Connected'}
                    sx={{
                      height: 22,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(16, 185, 129, 0.16)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                    }}
                  />
                ) : (
                  <Chip
                    size="small"
                    icon={<AlertTriangle size={12} color="#F59E0B" />}
                    label={!isDbConfigured ? 'Not configured' : dbServer ? `${dbServer} (offline)` : 'Offline'}
                    sx={{
                      height: 22,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(245, 158, 11, 0.16)',
                      color: '#FBBF24',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  />
                )
              ) : (
                <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>Connecting…</Typography>
              )}
            </Box>

            {/* Print service status row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Printer
                  size={16}
                  style={{
                    color: stage >= 2 ? (isPrintConnected ? '#34D399' : '#FBBF24') : '#64748B',
                  }}
                />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#E2E8F0' }}>
                  SPIL Print Service
                </Typography>
              </Box>

              {stage >= 2 ? (
                isPrintConnected ? (
                  <Chip
                    size="small"
                    icon={<CheckCircle2 size={12} color="#10B981" />}
                    label="Online"
                    sx={{
                      height: 22,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(16, 185, 129, 0.16)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                    }}
                  />
                ) : (
                  <Chip
                    size="small"
                    icon={<AlertTriangle size={12} color="#F59E0B" />}
                    label="Unreachable"
                    sx={{
                      height: 22,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(245, 158, 11, 0.16)',
                      color: '#FBBF24',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  />
                )
              ) : stage >= 1 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#60A5FA' }}>Checking…</Typography>
              ) : (
                <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>Waiting</Typography>
              )}
            </Box>

            {/* Linear Progress Bar */}
            <Box sx={{ mt: 0.5, width: '100%' }}>
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 5,
                  borderRadius: 9999,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 9999,
                    background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 60%, #60A5FA 100%)',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Windows Credential Manager Security Footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#93A3BB',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            <KeyRound size={14} style={{ color: '#60A5FA' }} />
            <span>Windows Credential Manager · Click anywhere to skip</span>
          </Box>
        </Box>
      </Box>
    </Fade>
  )
}


