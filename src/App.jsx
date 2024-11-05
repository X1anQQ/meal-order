import React, { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

function App() {
  const [step, setStep] = useState('loading');
  const [employeeId, setEmployeeId] = useState('');
  const [showLetterPad, setShowLetterPad] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayChoice, setTodayChoice] = useState(null);

  useEffect(() => {
    const savedId = localStorage.getItem('employeeId');
    if (savedId) {
      setEmployeeId(savedId);
      checkTodaySubmission(savedId);
    } else {
      setStep('input');
    }
  }, []);

  // 檢查今天是否已經提交
  const checkTodaySubmission = async (id) => {
    const today = new Date().toLocaleDateString('zh-TW');
    const key = `orderChoice_${id}_${today}`;
    const savedChoice = localStorage.getItem(key);
    
    if (savedChoice) {
      setTodayChoice(savedChoice);
      setStep('alreadySubmitted');
    } else {
      setStep('confirm');
    }
  };

  // 提交訂餐選擇
  const submitOrder = async (choice) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          order: choice === 'yes',
          date: new Date().toLocaleDateString('zh-TW')
        })
      });
      
      // 儲存今天的選擇
      const today = new Date().toLocaleDateString('zh-TW');
      const key = `orderChoice_${employeeId}_${today}`;
      localStorage.setItem(key, choice);
      setTodayChoice(choice);
      
      setStep('success');
    } catch (error) {
      alert('提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 已提交過的畫面
  const AlreadySubmittedScreen = () => (
    <div className="p-6 text-center">
      <div className="bg-yellow-100 p-8 rounded-2xl mb-8">
        <h1 className="text-2xl font-bold mb-4">今日已經完成訂餐</h1>
        <p className="text-xl mb-2">工號：{employeeId}</p>
        <p className="text-xl">
          您今天已經選擇：{todayChoice === 'yes' ? '要訂餐' : '不訂餐'}
        </p>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('employeeId');
          setEmployeeId('');
          setShowLetterPad(true);
          setStep('input');
        }}
        className="bg-blue-500 text-white p-4 rounded-xl text-xl font-bold w-full max-w-xs"
      >
        使用其他工號
      </button>
    </div>
  );

  // ... 其他原有的組件代碼 ...

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full">
        {step === 'loading' && <LoadingScreen />}
        {step === 'input' && <InputScreen />}
        {step === 'confirm' && <ConfirmScreen />}
        {step === 'success' && <SuccessScreen />}
        {step === 'alreadySubmitted' && <AlreadySubmittedScreen />}
      </div>
    </div>
  );
}

export default App;