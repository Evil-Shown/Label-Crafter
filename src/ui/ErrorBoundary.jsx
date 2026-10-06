import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Label Crafter ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[var(--bg)] p-6 text-[var(--tx)]">
          <div className="lc-card max-w-lg p-6 shadow-xl text-center flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-bold">Something went wrong</h2>
            <p className="text-sm text-[var(--tx-2)]">
              An unexpected error occurred in this view. You can reload the designer to continue.
            </p>
            {this.state.error?.message && (
              <pre className="max-h-32 w-full overflow-auto rounded bg-[var(--bg-2)] p-2.5 text-left text-xs font-mono text-[var(--tx-3)]">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="lc-btn lc-btn-primary mt-2"
            >
              <RotateCcw size={14} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
