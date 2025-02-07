import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

// 新增 API 相關函數
const callApi = async (data) => {
  try {
    console.log('Sending request:', data); // 添加日誌

    const response = await fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    // 因為 no-cors 模式下無法讀取響應內容，我們根據 response.ok 判斷
    if (!response.ok && response.status !== 0) { // status 為 0 是 no-cors 的正常情況
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 在 no-cors 模式下，我們只能假設請求成功
    return { success: true };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
};


// 首先建立語言包
const translations = {
  zh: {
    today:"今天日期:",
    enterPin: "請輸入密碼:",
    companyName: "公司名稱",
    backspace: "退格",
    confirm: "確認",
    employeeNotFound: '找不到此工號，請重新輸入',
    invalidIdFormat: '工號格式不正確（應為1個英文字母加1-2個數字）',
    systemError: '系統錯誤，請稍後再試',
    enterEmployeeId: "請輸入工號",
    id_en_tw: "Enter Employee ID",
    changeEmployeeId: "更換工號",
    todayOrder: "今日訂餐",
    tomorrowOrder: "明日訂餐",
    nextMondayOrder: "下星期一訂餐",
    employeeId: "工號",
    vegMeal: "素食餐點",
    setAsDefault: "將此次選擇設為預設習慣",
    wantOrder: "要訂餐",
    noOrder: "不訂餐",
    outOfOrderTime: "非訂餐時間",
    orderTimeRange: "訂餐時間為：",
    orderTimeDetail: "平日前一天中午 12:00 至 當天早上 09:30",
    questionmanagement:"有問題請洽管理部",
    alreadySubmitted: "今日已經完成訂餐",
    alreadytomorrowSubmit:"已經完成明日訂餐",
    alreadynextMondaySubmit:"已經完成下星期一訂餐",
    yourChoice: "您今天已經選擇：",
    useOtherEmployeeId: "使用其他工號",
    selectAgain: "重新選擇",
    orderComplete: "訂餐完成！",
    back: "返回",
    wantOrderChoice: "要訂餐",
    noOrderChoice: "不訂餐"
  },
  en: {
    today:"Today:",
    enterPin: "Enter PIN:",
    companyName: "Company Name",
    backspace: "Back",
    confirm: "Confirm",
    employeeNotFound: 'Employee ID not found, please try again',
    invalidIdFormat: 'Invalid ID format (should be 1 letter + 1-2 digits)',
    systemError: 'System error, please try again later',
    enterEmployeeId: "Enter Employee ID",
    id_en_tw: "請輸入工號",
    changeEmployeeId: "Change ID",
    todayOrder: "Today's Order",
    tomorrowOrder: "Tomorrow's Order",
    nextMondayOrder: "Next Monday's Order",
    employeeId: "Employee ID",
    vegMeal: "Vegetarian Meal",
    setAsDefault: "Set this choice as my default",
    wantOrder: "Order",
    noOrder: "No Order",
    outOfOrderTime: "Outside Order Hours",
    orderTimeRange: "Order Time:",
    orderTimeDetail: "Weekdays Previous Day 12:00pm - Current Day 09:30am",
    questionmanagement:"For assistance, please contact the management department",
    alreadySubmitted: "Already Submitted Today",
    alreadytomorrowSubmit:"Already Tomorrow Submitted",
    alreadynextMondaySubmit:"Already Next Monday Submitted",
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
  const [errorMessage, setErrorMessage] = useState('');
  //設定PIN碼安全性
  // 在 App.js 添加驗證相關常數和函數
  const VALID_DEPARTMENTS = {
    'A': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16],
    'B': [1, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14],
    'C': [1,2,3,5,6,7,8,9,10,11,13,14,15,16,18,19,20,21,22,23,24,25,26,27,28,29,30,31,33,34,35,37,38,39,40,42,44,45],
    'D': [1,2,3,4,5,6,7,8,9,10,11,13,14,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33],
    'E': [3,7,11,15],
    'F': [1,3],
    'G': [1],
    'H': [1,2,3,4,5,6,8,9,10,11,13,14,15,20,23,27]
  }; // 有效的部門代號
  const ID_MIN_LENGTH = 2; // 最短工號長度 (1字母 + 1數字)
  const ID_MAX_LENGTH = 3; // 最長工號長度 (1字母 + 2數字)
  const ALLOWED_LETTERS = ['A', 'E', 'C', 'H', 'J', 'L', 'M', 'O'];
  const DEFAULT_PIN = 'ECHO';

  // 修改語言設定函數
  const setAndSaveLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };
  // 工號規範化函數
  const normalizeEmployeeId = (id) => {
    if (!id) return id;
    
    const deptCode = id.charAt(0);
    const numbers = id.slice(1);
    const numValue = parseInt(numbers, 10);
    
    if (isNaN(numValue)) return id;
    
    // 返回規範化的工號（無前導零）
    return deptCode + numValue;
  };
  // 工號格式驗證函數
  // 工號格式驗證函數優化
  const isValidEmployeeIdFormat = (id) => {
    if (!id || id.length < 2 || id.length > 3) return false;
  
    const normalizedId = normalizeEmployeeId(id);
    const deptCode = normalizedId.charAt(0);
    const numbers = normalizedId.slice(1);
    const numValue = parseInt(numbers, 10);
    
    // 檢查部門代碼是否有效
    if (!VALID_DEPARTMENTS[deptCode]) return false;
    
    // 檢查數字部分
    if (isNaN(numValue)) return false;
    
    // 檢查是否在允許的工號列表中
    return VALID_DEPARTMENTS[deptCode].includes(numValue);
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
      const day = now.getDay(); // 0是周日6周六
      
      // 檢查是否為補班日
      const isMakeupWorkday = checkMakeupWorkday(now);

      if (isMakeupWorkday) {
        setIsOrderTime(true);
        return;
      }

      // 如果是週五中午12點後
      if (day === 5 && currentTime >= 12) {
          // 檢查下週一是否為工作日
        const nextMonday = new Date();
        nextMonday.setDate(now.getDate() + 3); // 加3天到下週一
        const nextMondayDay = nextMonday.getDay();
        setIsOrderTime(nextMondayDay === 1); // 確保是週一且是工作日
      }
      // 如果現在是中午12點以後（非週五）
      else if (currentTime >= 12) {
        // 檢查明天是否為工作日
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.getDay();
        setIsOrderTime(tomorrowDay > 0 && tomorrowDay < 6);
      } 
      // 如果現在是早上9:30以前
      else if (currentTime <= 9.5) {
        setIsOrderTime(day > 0 && day < 6);
      } 
      // 其他時間都不是訂餐時間
      else {
        setIsOrderTime(false);
      }
    };
    const checkMakeupWorkday = (date) => {
      const makeupDays = ["2025/02/08"]; // 根據實際補班日更新
      const formattedDate = date.toISOString().split("T")[0]; // 格式化為 YYYY/MM/DD
      return makeupDays.includes(formattedDate);
    };

    const getOrderTitle = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours + minutes / 60;
      const currentDay = now.getDay(); // 0是週日，6是週六
    
       // **補班日處理**
      if (checkMakeupWorkday(now)) {
        return t('todayOrder');
      }
      
      // 如果是週五且在中午12點後
      if (currentDay === 5 && currentTime >= 12) {
        return t('nextMondayOrder');
      }
      // 如果是凌晨0點到早上9:30
      else if (currentTime >= 0 && currentTime <= 9.5) {
        return t('todayOrder');
      } else {
        return t('tomorrowOrder');
      }
    };
    const getOrderSubmitTitle = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours + minutes / 60;
      const currentDay = now.getDay(); // 0是週日，6是週六
      
      // **補班日的特殊處理**
      if (checkMakeupWorkday(now)) {
        return t('alreadySubmitted'); // 依照平日邏輯顯示
      }

      // 如果是週五且在中午12點後
      if (currentDay === 5 && currentTime >= 12) {
        return t('alreadynextMondaySubmit');
      }
      // 如果是凌晨0點到早上9:30
      else if (currentTime >= 0 && currentTime <= 9.5) {
        return t('alreadySubmitted'); 
      } else {
        return t('alreadytomorrowSubmit'); // 明日訂餐 
      }
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

  // 優化後的提交訂單函數
  const submitOrder = async (choice, isVeg, updateHabit) => {
    setIsSubmitting(true);
    console.log('Starting order submission...'); // 添加日誌
  
    try {
      const requestData = {
        employeeId,
        order: choice === 'yes',
        isVeg: isVeg && choice === 'yes',
        updateHabit,
        date: new Date().toLocaleDateString('zh-TW')
      };
      
      console.log('Submitting order with data:', requestData); // 添加日誌
      
      const result = await callApi(requestData);
      console.log('Submission result:', result); // 添加日誌
  
      if (result.success) {
        const today = new Date().toLocaleDateString('zh-TW');
        const key = `orderChoice_${employeeId}_${today}`;
        localStorage.setItem(key, choice);
        setTodayChoice(choice);
        setStep('success');
      } else {
        console.error('Submission failed:', result.error);
        alert(language === 'zh' ? '提交失敗，請重新嘗試' : 'Submission failed, please try again');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert(language === 'zh' ? '提交失敗，請稍後再試' : 'Submission failed, please try again');
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
  // 修改 InputScreen 組件
  const InputScreen = () => {
    const isEnglish = language === 'en';
    const [localError, setLocalError] = useState('');

    // 本地驗證函數
    const validateLocally = (id) => {
      setLocalError('');
      
      if (id.length < ID_MIN_LENGTH) return false;
      
      const normalizedId = normalizeEmployeeId(id);
      const deptCode = normalizedId.charAt(0);
      const numValue = parseInt(normalizedId.slice(1), 10);
      
      // 檢查是否為有效數字
      if (isNaN(numValue)) {
        setLocalError(t('invalidIdFormat'));
        return false;
      }
      
      // 檢查是否在有效範圍內
      if (!VALID_DEPARTMENTS[deptCode]?.includes(numValue)) {
        setLocalError(t('employeeNotFound'));
        return false;
      }
      
      return true;
    };

  // 移除 debounce，改用直接驗證因為工號很短
  // API 調用時也使用規範化的工號
    const handleValidation = async (id) => {
      const normalizedId = normalizeEmployeeId(id);
      if (!validateLocally(normalizedId)) return;
      
      setIsSubmitting(true);
      try {
        const result = await callApi({
          action: 'checkEmployee',
          employeeId: normalizedId // 使用規範化後的工號
        });
        
        if (result.success) {
          setErrorMessage('');
          localStorage.setItem('employeeId', normalizedId); // 儲存規範化後的工號
          checkTodaySubmission(normalizedId);
        } else {
          setLocalError(t('employeeNotFound'));
          setTimeout(() => {
            setEmployeeId('');
            setShowLetterPad(true);
            setLocalError('');
          }, 2000);
        }
      } catch (error) {
        setLocalError(t('systemError'));
      } finally {
        setIsSubmitting(false);
      }
    };
    // 處理數字輸入
    const handleNumberInput = (num) => {
      if (employeeId.length < ID_MAX_LENGTH) {
        const newId = employeeId + num;
        // 立即規範化並更新顯示
        const normalizedId = normalizeEmployeeId(newId);
        setEmployeeId(normalizedId);
        
        if (normalizedId.length >= ID_MIN_LENGTH) {
          validateLocally(normalizedId);
        }
      }
    };
    return (
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
        {/* 錯誤提示 */}
        {(localError || errorMessage) && (
          <div className="mt-4 text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-lg font-medium">{localError || errorMessage}</p>
          </div>
        )}
      </div>

      {showLetterPad ? (
        // 字母鍵盤
        <div className="grid grid-cols-4 gap-4 mx-auto max-w-xs mb-4">
          {Object.keys(VALID_DEPARTMENTS).map(letter => (
            <button
              key={letter}
              onClick={() => {
                if (employeeId.length === 0) {
                  setEmployeeId(letter);
                  setShowLetterPad(false);
                  setAndSaveLanguage(determineLanguage(letter));
                }
              }}
              className="p-6 text-2xl font-bold rounded-xl bg-white shadow hover:bg-gray-50 disabled:opacity-50 transition-colors"
              disabled={employeeId.length > 0}
            >
              {letter}
            </button>
          ))}
        </div>
      ) : (
        // 數字鍵盤
        <div className="grid grid-cols-3 gap-4 mx-auto max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              disabled={employeeId.length >= ID_MAX_LENGTH}
              className="p-6 text-2xl font-bold rounded-xl bg-white shadow hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {num}
            </button>
          ))}
          {/* 退格鍵 */}
          <button
            onClick={() => {
              const newId = employeeId.slice(0, -1);
              setEmployeeId(newId);
              if (newId.length === 0) {
                setShowLetterPad(true);
                setLocalError('');
              }
            }}
            className="w-full p-4 text-base sm:text-xl font-bold rounded-xl bg-yellow-500 text-white shadow hover:bg-yellow-600 flex items-center justify-center min-h-[72px] transition-colors"
          >
            <span className="truncate">{t('backspace')}</span>
          </button>
          {/* 0 鍵 */}
          <button
            onClick={() => handleNumberInput(0)}
            disabled={employeeId.length >= ID_MAX_LENGTH}
            className="p-6 text-2xl font-bold rounded-xl bg-white shadow hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            0
          </button>
          {/* 確認鍵 */}
          <button
            onClick={() => {
              if (employeeId.length >= ID_MIN_LENGTH && validateLocally(employeeId)) {
                handleValidation(employeeId);
              }
            }}
            disabled={isSubmitting || employeeId.length < ID_MIN_LENGTH || !isValidEmployeeIdFormat(employeeId)}
            className={`w-full ${
              isEnglish ? 'p-5' : 'p-6'
            } text-base sm:text-xl font-bold rounded-xl shadow transition-all flex items-center justify-center min-h-[72px] ${
              employeeId.length >= ID_MIN_LENGTH && isValidEmployeeIdFormat(employeeId) && !isSubmitting
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <span>{t('confirm')}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

  // 訂餐選擇畫面
  const ConfirmScreen = () => {
    // 檢查是否在訂餐時間內
    if (!isOrderTime) {
      return <OutOfOrderTimeScreen />;
    }
  
    const [isVeg, setIsVeg] = useState(false);
    const [updateHabit, setUpdateHabit] = useState(false);
    
    return (
      <div className="text-center p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{getOrderTitle()}</h1>
          <p className="text-xl text-gray-600">{t('employeeId')}: {employeeId}</p>
          <p className="text-lg text-gray-500 mb-4">
            {t('today')}{new Date().toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US')}
          </p>
          
          {/* 素食選項 */}
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
  
          {/* 設定預設選項 */}
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
  
          {/* 更換工號按鈕 */}
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
  
        {/* 訂餐選擇按鈕 */}
        <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
          {/* 要訂餐按鈕 */}
          <button
            onClick={() => {
              if (!isSubmitting) {
                submitOrder('yes', isVeg, updateHabit);
              }
            }}
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
  
          {/* 不訂餐按鈕 */}
          <button
            onClick={() => {
              if (!isSubmitting) {
                submitOrder('no', false, updateHabit);
              }
            }}
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
          className="text-xl font-bold text-center w-full p-4 bg-gray-100 rounded-xl tracking-widest"
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
          className="p-6 text-xl font-bold rounded-xl bg-yellow-500 text-white shadow col-span-2 text-center whitespace-pre-wrap"
        >
          退格<br/>
          Back
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
          className={`p-6 text-xl font-bold rounded-xl shadow col-span-2 text-center whitespace-pre-wrap ${
            pin.length === 4 
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500'
          }`}
          >
            確認
            Confirm
        </button>
      </div>
    </div>
  );
  // 已提交過的畫面
  const AlreadySubmittedScreen = () => (
    <div className="p-6 text-center">
      <div className="bg-yellow-100 p-8 rounded-2xl mb-8">
        <h1 className="text-2xl font-bold mb-4">{getOrderSubmitTitle()}</h1>
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
  const LanguageToggleButton = () => (
    <button
      onClick={() => setAndSaveLanguage(language === 'zh' ? 'en' : 'zh')}
      className="fixed top-4 right-4 bg-white shadow-md rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors z-50"
    >
      <span className="text-lg font-bold">
        {language === 'zh' ? 'EN' : '中'}
      </span>
    </button>
  );
  // 返回主要渲染
  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
      <LanguageToggleButton />
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