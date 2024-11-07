import React, { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';


// 首先建立語言包
const translations = {
  zh: {
    enterPin: "請輸入密碼:",
    companyName: "公司名稱",
    backspace: "退格",
    confirm: "確認",
    enterEmployeeId: "請輸入工號",
    id_en_tw: "Enter Employee ID",
    changeEmployeeId: "更換工號",
    todayOrder: "今日訂餐",
    employeeId: "工號",
    vegMeal: "素食餐點",
    setAsDefault: "將此次選擇設為預設習慣",
    wantOrder: "要訂餐",
    noOrder: "不訂餐",
    outOfOrderTime: "非訂餐時間",
    orderTimeRange: "訂餐時間為：",
    orderTimeDetail: "每日早上 05:00 - 10:30",
    questionmanagement:"有問題請洽管理部",
    alreadySubmitted: "今日已經完成訂餐",
    yourChoice: "您今天已經選擇：",
    useOtherEmployeeId: "使用其他工號",
    selectAgain: "重新選擇",
    orderComplete: "訂餐完成！",
    back: "返回",
    wantOrderChoice: "要訂餐",
    noOrderChoice: "不訂餐"
  },
  en: {
    enterPin: "Enter PIN:",
    companyName: "Company Name",
    backspace: "Back",
    confirm: "Confirm",
    enterEmployeeId: "Enter Employee ID",
    id_en_tw: "請輸入工號",
    changeEmployeeId: "Change ID",
    todayOrder: "Today's Order",
    employeeId: "Employee ID",
    vegMeal: "Vegetarian Meal",
    setAsDefault: "Set as Default Choice",
    wantOrder: "Order",
    noOrder: "No Order",
    outOfOrderTime: "Outside Order Hours",
    orderTimeRange: "Order Time:",
    orderTimeDetail: "Daily 05:00 - 10:30",
    questionmanagement:"For assistance, please contact the management department",
    alreadySubmitted: "Already Submitted Today",
    yourChoice: "Your choice today: ",
    useOtherEmployeeId: "Use Different ID",
    selectAgain: "Select Again",
    orderComplete: "Order Complete!",
    back: "Back",
    wantOrderChoice: "Order",
    noOrderChoice: "No Order"
  }
};

function App() {
  const [step, setStep] = useState('loading');
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'zh';
  });
  const [employeeId, setEmployeeId] = useState('');
  const [showLetterPad, setShowLetterPad] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayChoice, setTodayChoice] = useState(null);
  const [isOrderTime, setIsOrderTime] = useState(false);
  const [pin, setPin] = useState('');
  //設定PIN碼安全性
  const ALLOWED_LETTERS = ['A', 'E', 'C', 'H', 'J', 'L', 'M', 'O'];
  const DEFAULT_PIN = 'ECHO';

  // 修改語言設定函數
  const setAndSaveLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // 根據工號判斷語言
  const determineLanguage = (id) => {
    return id.startsWith('D') ? 'en' : 'zh';
  };

  // 獲取翻譯文字的輔助函數
  const t = (key) => translations[language][key];

  useEffect(() => {
    checkOrderTime(); // 新增這行
    const hasVerified = localStorage.getItem('hasVerified'); // 只檢查是否驗證過
    
   
    if (!hasVerified) {
      // 如果從未驗證過，先進入 PIN 驗證
      setStep('pin');
    } else {
      // 已經驗證過 PIN，檢查是否有儲存的工號
      const savedId = localStorage.getItem('employeeId');
      if (savedId) {
        setEmployeeId(savedId);
        // 根據已儲存的工號設定語言
        setAndSaveLanguage(determineLanguage(savedId));
        checkTodaySubmission(savedId);
      } else {
        // 已驗證但沒有工號，進入工號輸入
        setStep('input');
      }
    }

    // 新增定時檢查
    const timer = setInterval(checkOrderTime, 60000);
    return () => clearInterval(timer);
  }, []);

    // 新增這個函數
  const checkOrderTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours + minutes / 60;
    setIsOrderTime(currentTime >= 0 && currentTime <= 24);
  };

  // 檢查今天是否已經提交
  const checkTodaySubmission = async (id) => {
    const today = new Date().toLocaleDateString('zh-TW');
    const key = `orderChoice_${id}_${today}`;
    const savedChoice = localStorage.getItem(key);
    
    if (savedChoice) {
      setTodayChoice(savedChoice);
      setStep('alreadySubmitted');
    } else {
      setStep('confirm');//繼續
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
          isVeg: isVeg && choice === 'yes', // 新增這行
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
  // 修改 InputScreen 組件
const InputScreen = () => (
  <div className="text-center p-6">
    <h1 className="text-3xl font-bold mb-8">{t('id_en_tw')}</h1>
    <h1 className="text-3xl font-bold mb-8">{t('enterEmployeeId')}</h1>
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
                // 設定語言
                setAndSaveLanguage(determineLanguage(letter));
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
          {t('backspace')}
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
              checkTodaySubmission(employeeId);
            }
          }}
          // 修改這裡的樣式條件
          className={`p-6 text-xl font-bold rounded-xl shadow transition-colors duration-200 ${
            employeeId.length >= 2 
              ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
        {t('confirm')}
        </button>
      </div>
    )}
  </div>
);
// 修改工號變更相關的函數
const handleChangeEmployeeId = () => {
  localStorage.removeItem('employeeId');
  setEmployeeId('');
  setShowLetterPad(true);
  // 重設語言為中文
  setAndSaveLanguage('zh');
  setStep('input');
};
  // 訂餐選擇畫面
const ConfirmScreen = () => {
  // 在最上方加入時間檢查
  if (!isOrderTime) {
    return <OutOfOrderTimeScreen />;
  }
  const [isVeg, setIsVeg] = useState(false);
  const [updateHabit, setUpdateHabit] = useState(false);

  // 修改提交函數
  const handleSubmit = async (choice) => {
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
          isVeg: isVeg && choice === 'yes', // 只有在要訂餐時才傳送素食選項
          updateHabit: updateHabit,  // 添加更新習慣的標記
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

  return (
    <div className="text-center p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('todayOrder')}</h1>
          <p className="text-xl text-gray-600">{t('employeeId')}: {employeeId}</p>
          <p className="text-lg text-gray-500 mb-4">
            {new Date().toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US')}
          </p>
          
          <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
            <button
              onClick={() => setIsVeg(!isVeg)}
              className="flex items-center justify-center w-full p-4 text-xl rounded-lg hover:bg-gray-50"
            >
              <div className={`w-8 h-8 mr-4 rounded-lg border-2 flex items-center justify-center
                ${isVeg ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
              >
                {isVeg && <Check className="w-6 h-6 text-white" />}
              </div>
              <span className="text-xl font-bold">{t('vegMeal')}</span>
            </button>
          </div>

          <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
            <button
              onClick={() => setUpdateHabit(!updateHabit)}
              className="flex items-center justify-center w-full p-4 text-xl rounded-lg hover:bg-gray-50"
            >
              <div className={`w-8 h-8 mr-4 rounded-lg border-2 flex items-center justify-center
                ${updateHabit ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
              >
                {updateHabit && <Check className="w-6 h-6 text-white" />}
              </div>
              <span className="text-xl font-bold">{t('setAsDefault')}</span>
            </button>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('employeeId');
              setEmployeeId('');
              setShowLetterPad(true);
              setStep('input');
            }}
            className="text-blue-500 underline mt-2 text-lg"
          >
            {t('changeEmployeeId')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
          <button
            onClick={() => handleSubmit('yes')}
            disabled={isSubmitting}
            className="p-12 bg-green-500 text-white rounded-2xl flex flex-col items-center hover:bg-green-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-20 h-20 animate-spin mb-4" />
            ) : (
              <Check size={80} className="mb-4" />
            )}
            <span className="text-3xl font-bold">{t('wantOrder')}</span>
          </button>

          <button
            onClick={() => handleSubmit('no')}
            disabled={isSubmitting}
            className="p-12 bg-red-500 text-white rounded-2xl flex flex-col items-center hover:bg-red-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-20 h-20 animate-spin mb-4" />
            ) : (
              <X size={80} className="mb-4" />
            )}
            <span className="text-3xl font-bold">{t('noOrder')}</span>
          </button>
        </div>
      </div>
  );
};
  const OutOfOrderTimeScreen = () => (//非訂餐時間段
    <div className="text-center p-6">
      <div className="bg-yellow-100 p-8 rounded-2xl mb-8">
        <h1 className="text-2xl font-bold mb-4">{t('outOfOrderTime')}</h1>
        <p className="text-xl mb-2">{t('orderTimeRange')}</p>
        <p className="text-xl">{t('orderTimeDetail')}</p>
        <p className="text-2xl mt-4">{t('questionmanagement')}</p>
      </div>
    </div>
  );

  const PinInputScreen = () => (
    <div className="text-center p-6">
      <h1 className="text-3xl font-bold mb-4">Enter PIN/請輸入密碼</h1> 
      <div className="mb-8">
        <input
          type="text"
          value={pin}
          readOnly
          className="text-4xl font-bold text-center w-full p-4 bg-gray-100 rounded-xl tracking-widest"
          placeholder="公司名稱/Company Name"
        />
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-xs mx-auto">
        {ALLOWED_LETTERS.map(letter => (
          <button
            key={letter}
            onClick={() => setPin(prev => prev.length < 4 ? prev + letter : prev)}
            className="p-6 text-2xl font-bold rounded-xl bg-white shadow hover:bg-gray-50"
          >
            {letter}
          </button>
        ))}
        
        <button
          onClick={() => setPin(prev => prev.slice(0, -1))}
          className="p-6 text-xl font-bold rounded-xl bg-yellow-500 text-white shadow col-span-2"
        >
          退格/Back
        </button>

        <button
          onClick={() => {
            if (pin === DEFAULT_PIN) {
              localStorage.setItem('hasVerified', 'true');
              setStep('input');
              setPin('');
            } else {
              alert(language === 'zh' ? '密碼錯誤' : 'Invalid PIN');
              setPin('');
            }
          }}
          className={`p-6 text-xl font-bold rounded-xl shadow col-span-2 ${
            pin.length === 4 
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          確認/Confirm
        </button>
      </div>
    </div>
  );
  // 已提交過的畫面
  const AlreadySubmittedScreen = () => (
    <div className="p-6 text-center">
      <div className="bg-yellow-100 p-8 rounded-2xl mb-8">
        <h1 className="text-2xl font-bold mb-4">{t('alreadySubmitted')}</h1>
        <p className="text-xl mb-2">{t('employeeId')}: {employeeId}</p>
        <p className="text-xl">
          {t('yourChoice')} {todayChoice === 'yes' ? t('wantOrderChoice') : t('noOrderChoice')}
        </p>
      </div>
      {isOrderTime && (
        <>
          <button
            onClick={() => {
              localStorage.removeItem('employeeId');
              setEmployeeId('');
              setShowLetterPad(true);
              setStep('input');
            }}
            className="bg-blue-500 text-white p-4 rounded-xl text-xl font-bold w-full max-w-xs mb-4"
          >
            {t('useOtherEmployeeId')}
          </button>

          <button
            onClick={() => setStep('confirm')}
            className="bg-blue-500 text-white p-4 rounded-xl text-xl font-bold w-full max-w-xs"
          >
            {t('selectAgain')}
          </button>
        </>
      )}
    </div>
  );

  // 完成畫面
  const SuccessScreen = () => (
    <div className="p-6 text-center">
      <div className="bg-green-100 p-8 rounded-2xl mb-8">
        <h1 className="text-2xl font-bold mb-4">{t('orderComplete')}</h1>
        <p className="text-xl mb-2">{t('employeeId')}: {employeeId}</p>
        <p className="text-xl">
          {t('yourChoice')} {todayChoice === 'yes' ? t('wantOrderChoice') : t('noOrderChoice')}
        </p>
      </div>

      <button
        onClick={() => setStep('confirm')}
        className="bg-blue-500 text-white p-4 rounded-xl text-xl font-bold w-full max-w-xs"
      >
        {t('selectAgain')}
      </button>
    </div>
  );

  // 返回主要渲染
  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full">
        {step === 'loading' && <LoadingScreen />}
        {step === 'pin' && <PinInputScreen />}
        {step === 'input' && <InputScreen />}
        {step === 'confirm' && <ConfirmScreen />}
        {step === 'success' && <SuccessScreen />}
        {step === 'alreadySubmitted' && <AlreadySubmittedScreen />}
        {!isOrderTime && step !== 'loading' && step !== 'pin' && <OutOfOrderTimeScreen />}
      </div>
    </div>
  );
}

export default App;