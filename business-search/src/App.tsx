import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import SearchPage from './pages/SearchPage'
import LeadsPage from './pages/LeadsPage'
import LeadDetailPage from './pages/LeadDetailPage'
import CNPJLookupPage from './pages/CNPJLookupPage'
import DashboardPage from './pages/DashboardPage'
import SearchHistoryPage from './pages/SearchHistoryPage'
import ComponentShowcasePage from './pages/ComponentShowcasePage'
import WebsiteAnalysisPage from './pages/WebsiteAnalysisPage'

export default function App() {
    return (
        <BrowserRouter>
            <NavBar />
            <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/history" element={<SearchHistoryPage />} />
                <Route path="/components" element={<ComponentShowcasePage />} />
                <Route path="/" element={<SearchPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/leads/new" element={<CNPJLookupPage />} />
                <Route path="/leads/:id" element={<LeadDetailPage />} />
                <Route path="/analysis" element={<WebsiteAnalysisPage />} />
            </Routes>
        </BrowserRouter>
    )
}
