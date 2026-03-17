/**
 * ErrorBoundary.tsx — React class error boundary for query + render errors.
 */
import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface State {
    hasError: boolean
    error: Error | null
}

interface Props {
    children: ReactNode
    fallback?: (error: Error, reset: () => void) => ReactNode
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info)
    }

    reset = () => this.setState({ hasError: false, error: null })

    render() {
        const { hasError, error } = this.state

        if (hasError && error) {
            if (this.props.fallback) {
                return this.props.fallback(error, this.reset)
            }

            return (
                <div className="min-h-[300px] flex items-center justify-center p-8">
                    <div className="text-center max-w-sm">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-400" size={24} />
                        </div>
                        <h2 className="text-base font-semibold text-white mb-1">Algo deu errado</h2>
                        <p className="text-sm text-slate-500 mb-1">{error.message}</p>
                        {import.meta.env.DEV && (
                            <pre className="text-[10px] text-left text-red-400/70 bg-red-950/30 rounded-lg px-3 py-2 mt-3 mb-4 overflow-x-auto max-h-32">
                                {error.stack}
                            </pre>
                        )}
                        <div className="flex items-center gap-2 justify-center mt-4">
                            <button
                                onClick={this.reset}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                            >
                                <RefreshCw size={13} /> Tentar novamente
                            </button>
                            <a
                                href="/"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                            >
                                <Home size={13} /> Início
                            </a>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
