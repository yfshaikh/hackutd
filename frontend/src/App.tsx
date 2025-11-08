import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { NetworkMap } from './pages/NetworkMap'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<NetworkMap />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
