import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './app/pages/LandingPage'
import ChatSpace from './app/pages/ChatSpace'
import ChatHistory from './app/pages/ChatHistory'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat/:docId" element={<ChatSpace />} />
        <Route path="/history" element={<ChatHistory />} />
      </Routes>
    </BrowserRouter>
  )
}