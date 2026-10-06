import { createTheme } from '@mui/material/styles'

export function getMuiTheme(mode = 'light') {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#818CF8' : '#4F46E5',
        light: isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(79, 70, 229, 0.12)',
        dark: isDark ? '#4F46E5' : '#3730A3',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#C084FC' : '#9333EA',
        light: isDark ? 'rgba(192, 132, 252, 0.2)' : 'rgba(147, 51, 234, 0.12)',
        dark: '#6B21A8',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#0B0F19' : '#EEF2F6',
        paper: isDark ? '#131B2E' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F8FAFC' : '#0F172A',
        secondary: isDark ? '#CBD5E1' : '#64748B',
      },
      divider: isDark ? '#263352' : '#E2E8F0',
      success: {
        main: isDark ? '#34D399' : '#059669',
        light: isDark ? 'rgba(52, 211, 153, 0.16)' : '#ECFDF5',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: isDark ? '#FBBF24' : '#D97706',
        light: isDark ? 'rgba(251, 191, 36, 0.16)' : '#FFFBEB',
        contrastText: '#FFFFFF',
      },
      error: {
        main: isDark ? '#F87171' : '#DC2626',
        light: isDark ? 'rgba(248, 113, 113, 0.16)' : '#FEF2F2',
        contrastText: '#FFFFFF',
      },
    },
    typography: {
      fontFamily: [
        'Inter Variable',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif',
      ].join(','),
      button: {
        textTransform: 'none',
        fontWeight: 700,
      },
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 24,
            fontWeight: 700,
            textTransform: 'none',
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          square: true,
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 0,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 18,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#1E1B4B' : '#0F172A',
            fontSize: 12,
            borderRadius: 8,
          },
        },
      },
    },
  })
}

