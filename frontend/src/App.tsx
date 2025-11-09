import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Layout } from './components/layout/Layout'
import { NetworkMap } from './pages/NetworkMap'
import { Dashboard } from './pages/Dashboard'
import InsightsPage from './pages/InsightsPage'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60, // 1 hour (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<NetworkMap />} />
            <Route path="network-map" element={<NetworkMap />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="insights" element={<InsightsPage />} />
          </Route>
        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
