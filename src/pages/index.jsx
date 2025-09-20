import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Pets from "./Pets";

import VetVisits from "./VetVisits";

import Medications from "./Medications";

import Settings from "./Settings";

import PetDetail from "./PetDetail";

import Grooming from "./Grooming";

import Feeding from "./Feeding";

import Tasks from "./Tasks";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Pets: Pets,
    
    VetVisits: VetVisits,
    
    Medications: Medications,
    
    Settings: Settings,
    
    PetDetail: PetDetail,
    
    Grooming: Grooming,
    
    Feeding: Feeding,
    
    Tasks: Tasks,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Pets" element={<Pets />} />
                
                <Route path="/VetVisits" element={<VetVisits />} />
                
                <Route path="/Medications" element={<Medications />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/PetDetail" element={<PetDetail />} />
                
                <Route path="/Grooming" element={<Grooming />} />
                
                <Route path="/Feeding" element={<Feeding />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}