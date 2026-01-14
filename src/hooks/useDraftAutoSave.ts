/**
 * Draft 자동 저장 훅
 * debounce를 사용하여 입력 변경 시 자동으로 로컬에 저장
 */

import { useEffect, useRef, useCallback } from 'react';
import { TodayWorkData } from '@/types';
import { saveDraft, getDraft, DraftData } from '@/lib/storage';

const DEBOUNCE_DELAY = 500; // 500ms

interface UseDraftAutoSaveOptions {
  date: string;
  data: TodayWorkData;
  onLoad?: (draft: DraftData | null) => void;
}

export function useDraftAutoSave({ date, data, onLoad }: UseDraftAutoSaveOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const initialLoadDoneRef = useRef<boolean>(false);
  
  // 날짜 변경 시 해당 날짜 Draft 로드
  useEffect(() => {
    const draft = getDraft(date);
    if (onLoad) {
      onLoad(draft);
    }
    initialLoadDoneRef.current = true;
    
    // 클린업: 이전 날짜의 저장 타이머 취소
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [date, onLoad]);
  
  // 데이터 변경 시 debounce 저장
  useEffect(() => {
    // 초기 로드 전에는 저장하지 않음
    if (!initialLoadDoneRef.current) return;
    
    const dataString = JSON.stringify(data);
    
    // 변경이 없으면 저장하지 않음
    if (dataString === lastSavedRef.current) return;
    
    // 기존 타이머 취소
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // 새 타이머 설정
    timerRef.current = setTimeout(() => {
      saveDraft(date, data);
      lastSavedRef.current = dataString;
    }, DEBOUNCE_DELAY);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [date, data]);
  
  // 즉시 저장 (페이지 이탈 시 등)
  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    saveDraft(date, data);
    lastSavedRef.current = JSON.stringify(data);
  }, [date, data]);
  
  // 페이지 이탈/앱 백그라운드 시 즉시 저장
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveNow();
      }
    };
    
    const handleBeforeUnload = () => {
      saveNow();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveNow]);
  
  return { saveNow };
}
