
import React from 'react';
import Dashboard from './Dashboard';
import BusinessDashboard from './business/Dashboard';
import MainLayout from '@/components/MainLayout';
import { useAppMode } from '@/contexts/AppModeContext';

const Index = () => {
  const { mode } = useAppMode();
  
  return (
    <MainLayout>
      {mode === 'personal' ? <Dashboard /> : <BusinessDashboard />}
    </MainLayout>
  );
};

export default Index;
