import React, { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ModerationPage from './pages/ModerationPage';
import PayoutsPage from './pages/PayoutsPage';
import TasksBuilderPage from './pages/TasksBuilderPage';
import UsersPage from './pages/UsersPage';
import ContestsManagePage from './pages/ContestsManagePage';
import AdsManagePage from './pages/AdsManagePage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import SpinManagePage from './pages/SpinManagePage';
import ShopManagePage from './pages/ShopManagePage';

function AdminContent() {
  const { admin, loading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-3">
        <span className="w-10 h-10 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
        <span className="font-mono text-xs text-on-surface-variant">Admin tizimi yuklanmoqda...</span>
      </div>
    );
  }

  if (!admin) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Fixed Left Sidebar */}
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar activeTab={activeTab} />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
          {activeTab === 'moderation' && <ModerationPage />}
          {activeTab === 'payouts' && <PayoutsPage />}
          {activeTab === 'shop' && <ShopManagePage />}
          {activeTab === 'tasks' && <TasksBuilderPage />}
          {activeTab === 'spin' && <SpinManagePage />}
          {activeTab === 'contests' && <ContestsManagePage />}
          {activeTab === 'ads' && <AdsManagePage />}
          {activeTab === 'users' && <UsersPage />}
          {activeTab === 'settings' && <SystemSettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AdminContent />
    </AdminAuthProvider>
  );
}
