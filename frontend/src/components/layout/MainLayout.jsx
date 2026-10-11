import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import './MainLayout.css';

export function MainLayout({ showRightPanel = true }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="main-layout">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`mobile-overlay ${mobileMenuOpen ? 'mobile-open' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Left Sidebar */}
      <Sidebar className={mobileMenuOpen ? 'mobile-open' : ''} />

      {/* Main Center Content */}
      <div className="center-content-area">
        <Outlet context={{ toggleMobileMenu }} />
      </div>

      {/* Right Sidebar Panel (Matching Image A) */}
      {showRightPanel && <RightSidebar />}
    </div>
  );
}

export default MainLayout;
