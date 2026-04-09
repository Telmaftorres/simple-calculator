'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm">
          Une erreur est survenue dans cette section. Rechargez la page pour réessayer.
        </div>
      )
    }
    return this.props.children
  }
}
