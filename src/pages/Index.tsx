import { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { BottomNavigation } from '@/components/Navigation/BottomNavigation';
import {
  IncomeCard,
  CollectionRateGauge,
  TodayStats,
} from '@/components/Dashboard/DashboardCards';
import { WorkInputForm } from '@/components/Input/WorkInputForm';
import { RecordsList } from '@/components/Records/RecordsList';
import { SettingsPage } from '@/components/Settings/SettingsPage';
import { WorkRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

  const handleRecordEdit = (record: WorkRecord) => {
    // For now, show a toast - full edit modal can be added later
    toast({
      title: '수정 기능',
      description: '기록 삭제 후 다시 입력해주세요.',
    });
  };

  const handleInputComplete = () => {
    toast({
      title: '저장 완료',
      description: '작업 기록이 저장되었습니다.',
    });
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            <IncomeCard />
            <CollectionRateGauge />
            <TodayStats />
          </div>
        )}

        {activeTab === 'input' && (
          <WorkInputForm onComplete={handleInputComplete} />
        )}

        {activeTab === 'records' && (
          <RecordsList onEdit={handleRecordEdit} />
        )}

        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
