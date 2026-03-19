'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { handleClientError } from '@/lib/errors'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Log error to error tracking service
    this.setState({
      error,
      errorInfo
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private renderErrorContent() {
    const { error, errorInfo } = this.state
    
    if (this.props.fallback) {
      return this.props.fallback
    }

    const errorData = handleClientError(error, 'Beklenmeyen bir hata oluştu')

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {errorData.title}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {errorData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">
                  Hata Detayları (Geliştirme Modu)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded-md overflow-auto">
                  <p className="font-mono text-xs text-red-600 mb-2">
                    {error.name}: {error.message}
                  </p>
                  {errorInfo && (
                    <div className="mt-2">
                      <p className="font-semibold text-xs mb-1">Component Stack:</p>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  <div className="mt-2">
                    <p className="font-semibold text-xs mb-1">Full Stack:</p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
            
            <div className="flex flex-col gap-2">
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tekrar Dene
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sayfayı Yenile
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Ana Sayfaya Dön
                </Button>
              </Link>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Error: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`
                    )
                    alert('Hata bilgileri panoya kopyalandı!')
                  }}
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Hata Bilgisini Kopyala
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  public render() {
    if (this.state.hasError) {
      return this.renderErrorContent()
    }

    return this.props.children
  }
}

// Higher-order component for error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: unknown) => {
    const errorData = handleClientError(error)
    const appError = error instanceof Error ? error : new Error(errorData.description)
    setError(appError)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}