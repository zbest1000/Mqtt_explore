import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36)
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Report error to monitoring service if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        extra: errorInfo,
        tags: {
          component: 'ErrorBoundary',
          errorId: this.state.errorId
        }
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: this.state.error?.name,
        message: this.state.error?.message,
        stack: this.state.error?.stack
      },
      errorInfo: this.state.errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Error details copied to clipboard')
      })
      .catch(() => {
        console.log('Error details:', errorDetails)
        alert('Error details logged to console')
      })
  }

  render() {
    if (this.state.hasError) {
      // Check if this is a development environment
      const isDevelopment = import.meta.env.MODE === 'development'

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error Title */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  An unexpected error occurred in the MQTT Explore application.
                </p>
                {this.state.errorId && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {this.state.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                  <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    Error Details:
                  </h3>
                  <p className="text-red-700 dark:text-red-300 text-sm font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Development Mode Error Stack */}
              {isDevelopment && this.state.error?.stack && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Stack Trace:
                  </h3>
                  <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              {/* Component Stack (Development) */}
              {isDevelopment && this.state.errorInfo?.componentStack && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Component Stack:
                  </h3>
                  <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>

              {/* Copy Error Details */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={this.copyErrorDetails}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  Copy Error Details for Support
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                  If this error persists, please contact support with the error ID above.
                </p>
                {isDevelopment && (
                  <p className="mt-1 text-yellow-600 dark:text-yellow-400">
                    Development mode: Additional error details are shown above.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary