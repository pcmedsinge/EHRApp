/**
 * Application Entry Point
 * 
 * Sets up React Query, Ant Design theme, Auth Provider, and Router.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import { AuthProvider } from '@/contexts';
import { antTheme } from '@/theme';
import { ErrorBoundary } from '@/components/common';
import App from './App';
import './index.css';

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus in development
      refetchOnWindowFocus: false,
      // Only retry once on failure
      retry: 1,
      // Consider data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      // Show error in console by default
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Render the application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider theme={antTheme}>
            <AntApp>
              <AuthProvider>
                <App />
              </AuthProvider>
            </AntApp>
          </ConfigProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
