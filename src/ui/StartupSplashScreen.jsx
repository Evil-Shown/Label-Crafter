import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Fade,
} from '@mui/material'
import {
  Database,
  Printer,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  X,
  Sparkles,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import BrandMark from './BrandMark'

/**
 * StartupSplashScreen
 * Re-imagined with Material Design 3 Expressive aesthetics:
 * - Refined layered surface with subtle glassmorphic backdrop
 * - Rounded pill badges and crisp typography hierarchy
 * - Modern smooth animated linear progress
 * - Native desktop feel with quick skip button and clear system status
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
          background: 'radial-gradient(ellipse 90% 80% at 50% 25%, #18223B 0%, #0D1424 55%, #070B14 100%)',
          p: 3,
        }}
      >
        {/* Soft atmospheric ambient light rings */}
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 540,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 75%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating Close / Skip button in top right */}
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
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
              fontSize: '0.75rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.16)',
                color: '#fff',
              },
            }}
          />
        </Box>

        {/* Central Material You Elevated Card */}
        <Paper
          elevation={16}
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 440,
            p: 4.5,
            borderRadius: 5,
            textAlign: 'center',
            bgcolor: 'rgba(19, 27, 46, 0.88)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Brand Mark Container */}
          <Box
            sx={{
              width: 84,
              height: 84,
              borderRadius: 4.5,
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
              mb: 3,
              p: 2,
              position: 'relative',
            }}
          >
            <BrandMark size={52} className="h-full w-full" />
            <Box
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.6)',
              }}
            >
              <Sparkles size={12} color="#FFFFFF" />
            </Box>
          </Box>

          {/* Typography */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#F8FAFC',
              mb: 0.5,
            }}
          >
            SPIL Label Designer
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: '#94A3B8',
              fontWeight: 600,
              fontSize: '0.8rem',
              letterSpacing: '0.01em',
              mb: 3.5,
            }}
          >
            Standalone Windows Edition · Rust Tauri v2
          </Typography>

          {/* Status Diagnostic Card */}
          <Box
            sx={{
              width: '100%',
              borderRadius: 3.5,
              bgcolor: 'rgba(11, 15, 25, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              p: 2.2,
              mb: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
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
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#E2E8F0' }}>
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
                      border: '1px solid rgba(16, 185, 129, 0.3)',
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
                      border: '1px solid rgba(245, 158, 11, 0.3)',
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
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#E2E8F0' }}>
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
                      border: '1px solid rgba(16, 185, 129, 0.3)',
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
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  />
                )
              ) : stage >= 1 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#818CF8' }}>Checking…</Typography>
              ) : (
                <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>Waiting</Typography>
              )}
            </Box>

            {/* Linear Progress Bar */}
            <Box sx={{ mt: 1, width: '100%' }}>
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 6,
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
              color: '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            <KeyRound size={14} style={{ color: '#818CF8' }} />
            <span>Windows Credential Manager · Click anywhere to skip</span>
          </Box>
        </Paper>
      </Box>
    </Fade>
  )
}

