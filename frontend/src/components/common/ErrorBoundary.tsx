/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child components and displays fallback UI.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { colors, spacing } from '@/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: colors.neutral.background,
            padding: spacing.lg,
          }}
        >
          <Result
            status="error"
            title="Something went wrong"
            subTitle="An unexpected error occurred. Please try again."
            extra={[
              <Button 
                type="primary" 
                key="reload" 
                onClick={this.handleReload}
              >
                Reload Page
              </Button>,
              <Button 
                key="home" 
                onClick={this.handleGoHome}
              >
                Go to Home
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
