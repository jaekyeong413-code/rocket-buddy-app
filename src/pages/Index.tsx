import { useState, useEffect } from 'react';
import { Header } from '@/components/Layout/Header';
import { BottomNavigation } from '@/components/Navigation/BottomNavigation';
import {
  IncomeCard,
  TodayIncomeCard,
  TodayFBStatus,
  TodayProgress,
  TodayStats,
} from '@/components/Dashboard/DashboardCards';
import { WorkInputForm } from '@/components/Input/WorkInputForm';
import { DataCalculationTab } from '@/components/DataCalculation/DataCalculationTab';
import { RecordsList } from '@/components/Records/RecordsList';
import { SettingsPage } from '@/components/Settings/SettingsPage';
import { AuthGate } from '@/components/Security/AuthGate';
import { WorkRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store/useStore';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();
  const { initialize, initialized } = useStore();
  
  // 앱 시작 시 로컬 스토리지에서 데이터 로드 및 마이그레이션
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  const handleRecordEdit = (record: WorkRecord) => {
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
    // 저장 후에도 입력탭에 머물기 (사용자 요청: 즉시 수정 가능하도록)
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-lg mx-auto px-4 py-5 pb-24">
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              <IncomeCard />
              <TodayIncomeCard />
              <TodayProgress />
              <TodayFBStatus />
              <TodayStats />
            </div>
          )}

          {activeTab === 'input' && (
            <WorkInputForm onComplete={handleInputComplete} />
          )}

          {activeTab === 'calculation' && (
            <DataCalculationTab />
          )}

          {activeTab === 'records' && (
            <RecordsList onEdit={handleRecordEdit} />
          )}

          {activeTab === 'settings' && <SettingsPage />}
        </main>

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AuthGate>
  );
};

export default Index;
