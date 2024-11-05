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

  // 載入畫面
  const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  // 工號輸入畫面
const InputScreen = () => (
  <div className="text-center p-6">
    <h1 className="text-3xl font-bold mb-8">請輸入工號</h1>
    <div className="mb-8">
      <input
        type="text"
        value={employeeId}
        readOnly
        className="w-full text-4xl font-bold text-center p-4 bg-gray-100 rounded-xl"
        style={{ letterSpacing: '0.5em' }}
      />
    </div>

    {showLetterPad ? (
      <div className="grid grid-cols-4 gap-4 mx-auto max-w-xs mb-4">
        {['A', 'B', 'C', 'D', 'E', 'F', 'H'].map(letter => (
          <button
            key={letter}
            onClick={() => {
              if (employeeId.length === 0) {
                setEmployeeId(letter);
                setShowLetterPad(false);
              }
            }}
            className="p-6 text-2xl font-bold rounded-xl bg-white shadow hover:bg-gray-50 disabled:opacity-50"
            disabled={employeeId.length > 0}
          >
            {letter}
          </button>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-4 mx-auto max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => setEmployeeId(prev => prev + num)}
            className="p-6 text-2xl font-bold rounded-xl bg-white shadow hover:bg-gray-50"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => {
            const newId = employeeId.slice(0, -1);
            setEmployeeId(newId);
            if (newId.length === 0) {
              setShowLetterPad(true);
            }
          }}
          className="p-6 text-xl font-bold rounded-xl bg-yellow-500 text-white shadow"
        >
          退格
        </button>
        <button
          onClick={() => setEmployeeId(prev => prev + '0')}
          className="p-6 text-2xl font-bold rounded-xl bg-white shadow hover:bg-gray-50"
        >
          0
        </button>
        <button
          onClick={() => {
            if (employeeId.length >= 2) {
              localStorage.setItem('employeeId', employeeId);
              setStep('confirm');
            }
          }}
          className={`p-6 text-xl font-bold rounded-xl shadow ${
            employeeId.length >= 2 
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          確認
        </button>
      </div>
    )}
  </div>
);

  // 訂餐選擇畫面
  const ConfirmScreen = () => (
    <div className="text-center p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">今日訂餐</h1>
        <p className="text-xl text-gray-600">工號：{employeeId}</p>
        <p className="text-lg text-gray-500 mb-2">
          {new Date().toLocaleDateString('zh-TW')}
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('employeeId');
            setEmployeeId('');
            setShowLetterPad(true);
            setStep('input');
          }}
          className="text-blue-500 underline mt-2"
        >
          更換工號
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
        <button
          onClick={() => submitOrder('yes')}
          disabled={isSubmitting}
          className="p-10 bg-green-500 text-white rounded-2xl flex flex-col items-center hover:bg-green-600 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-16 h-16 animate-spin mb-4" />
          ) : (
            <Check size={60} className="mb-4" />
          )}
          <span className="text-2xl font-bold">要訂餐</span>
        </button>

        <button
          onClick={() => submitOrder('no')}
          disabled={isSubmitting}
          className="p-10 bg-red-500 text-white rounded-2xl flex flex-col items-center hover:bg-red-600 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-16 h-16 animate-spin mb-4" />
          ) : (
            <X size={60} className="mb-4" />
          )}
          <span className="text-2xl font-bold">不訂餐</span>
        </button>
      </div>
    </div>
  );

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

  // 完成畫面
  const SuccessScreen = () => (
    <div className="p-6 text-center">
      <div className="bg-green-100 p-8 rounded-2xl mb-8">
        <h1 className="text-2xl font-bold mb-4">訂餐完成！</h1>
        <p className="text-xl mb-2">工號：{employeeId}</p>
      </div>

      <button
        onClick={() => setStep('confirm')}
        className="bg-blue-500 text-white p-4 rounded-xl text-xl font-bold w-full max-w-xs"
      >
        返回
      </button>
    </div>
  );

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