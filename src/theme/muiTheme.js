import { createTheme } from '@mui/material/styles'

export function getMuiTheme(mode = 'light') {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#90CAF9' : '#1976D2',
        light: isDark ? '#E3F2FD' : '#42A5F5',
        dark: isDark ? '#42A5F5' : '#1565C0',
        contrastText: isDark ? '#0A1929' : '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#CE93D8' : '#7B1FA2',
        light: '#E1BEE7',
        dark: '#4A148C',
      },
      background: {
        default: isDark ? '#0A1929' : '#F4F6F8',
        paper: isDark ? '#101F33' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F1F5F9' : '#1E293B',
        secondary: isDark ? '#CBD5E1' : '#64748B',
      },
      divider: isDark ? '#1E3A5F' : '#E0E3E7',
      success: {
        main: isDark ? '#66BB6A' : '#2E7D32',
      },
      warning: {
        main: isDark ? '#FFA726' : '#ED6C02',
      },
      error: {
        main: isDark ? '#EF5350' : '#D32F2F',
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
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            textTransform: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#1E293B' : '#0F172A',
            fontSize: 12,
            borderRadius: 6,
          },
        },
      },
    },
  })
}

