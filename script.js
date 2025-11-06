// ============================================
// ЕСТУ КӨМЕКШІСІ - ДАУЫСТЫ ТАНУ ҚОСЫМШАСЫ
// ============================================

// DOM элементтері
const micBtn = document.getElementById('micBtn');
const status = document.getElementById('status');
const statusIndicator = document.getElementById('statusIndicator');
const transcript = document.getElementById('transcript');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const errorMsg = document.getElementById('errorMsg');
const permissionBox = document.getElementById('permissionBox');
const langBtns = document.querySelectorAll('.lang-btn');
const wordCount = document.getElementById('wordCount');

// Айнымалылар
let recognition = null;
let isListening = false;
let currentLang = 'kk-KZ';
let permissionGranted = false;
let totalWords = 0;
let allMessages = [];

// ============================================
// ТӨТЕНШЕ СӨЗДЕР
// ============================================
const emergencyWords = {
    'kk-KZ': [
        'өрт',
        'қауіп',
        'қауіпті',
        'көмек',
        'жедел жәрдем',
        'апат',
        'қасірет',
        'дәрігер',
        'полиция',
        'тез',
        'жедел'
    ],
    'ru-RU': [
        'пожар',
        'огонь',
        'опасность',
        'опасный',
        'помощь',
        'помогите',
        'скорая',
        'скорая помощь',
        'авария',
        'беда',
        'врач',
        'полиция',
        'быстро',
        'срочно'
    ]
};

// ============================================
// МӘТІНДЕР (ЕКІТІЛДІ)
// ============================================
const texts = {
    'kk-KZ': {
        permissionTitle: '🎤 Микрофонға рұқсат керек',
        permissionText: 'Дауысты тану үшін микрофонға қол жеткізу қажет. Safari "Рұқсат ету" сұрағанда растаңыз.',
        permissionBtn: '✅ Рұқсат беру',
        ready: 'Дайын - сөйлеңіз',
        listening: '🔴 ТЫҢДАП ЖАТЫР',
        clickToStart: 'Микрофонды басыңыз',
        denied: '❌ Рұқсат берілмеді',
        deniedHelp: 'Safari параметрлерінен микрофонға рұқсат беріңіз:\nПараметрлер → Safari → Микрофон',
        noSupport: '❌ Браузер дауысты тануды қолдамайды',
        needHttps: '❌ HTTPS қосылым қажет',
        cleared: 'Мәтін тазаланды',
        copied: '✅ Көшірілді!',
        copyError: '❌ Көшіру қатесі',
        noText: 'Көшіретін мәтін жоқ',
        words: 'сөз',
        initialMsg: 'Микрофонды басып, сөйлеңіз...',
        networkError: '❌ Интернет қосылымы жоқ',
        browserError: '❌ Браузер қатесі'
    },
    'ru-RU': {
        permissionTitle: '🎤 Нужен доступ к микрофону',
        permissionText: 'Для распознавания речи нужен доступ к микрофону. Нажмите "Разрешить" когда Safari спросит.',
        permissionBtn: '✅ Разрешить доступ',
        ready: 'Готово - говорите',
        listening: '🔴 СЛУШАЮ',
        clickToStart: 'Нажмите микрофон',
        denied: '❌ Доступ запрещен',
        deniedHelp: 'Разрешите доступ к микрофону в настройках Safari:\nНастройки → Safari → Микрофон',
        noSupport: '❌ Браузер не поддерживает распознавание речи',
        needHttps: '❌ Требуется HTTPS соединение',
        cleared: 'Текст очищен',
        copied: '✅ Скопировано!',
        copyError: '❌ Ошибка копирования',
        noText: 'Нет текста для копирования',
        words: 'слов',
        initialMsg: 'Нажмите микрофон и говорите...',
        networkError: '❌ Нет интернет соединения',
        browserError: '❌ Ошибка браузера'
    }
};

// ============================================
// БРАУЗЕР ҚОЛДАУЫН ТЕКСЕРУ
// ============================================
function checkSupport() {
    console.log('Браузер қолдауын тексеру...');
    
    // HTTPS тексеру
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        showError(texts[currentLang].needHttps);
        disableMicrophone();
        return false;
    }
    
    // Speech Recognition қолдауын тексеру
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
        showError(texts[currentLang].noSupport);
        disableMicrophone();
        return false;
    }
    
    console.log('✅ Браузер қолдайды');
    return true;
}

// ============================================
// МИКРОФОНДЫ ӨШІРУ
// ============================================
function disableMicrophone() {
    micBtn.classList.add('disabled');
    micBtn.disabled = true;
    status.textContent = texts[currentLang].noSupport;
}

// ============================================
// РҰҚСАТ СҰРАУ
// ============================================
function showPermissionRequest() {
    permissionBox.innerHTML = `
        <div class="permission-box">
            <h3>${texts[currentLang].permissionTitle}</h3>
            <p>${texts[currentLang].permissionText}</p>
            <button class="permission-btn" id="requestBtn">
                ${texts[currentLang].permissionBtn}
            </button>
        </div>
    `;
    
    const requestBtn = document.getElementById('requestBtn');
    if (requestBtn) {
        requestBtn.addEventListener('click', initRecognition);
    }
}

// ============================================
// ДАУЫСТЫ ТАНУДЫ БАСТАУ
// ============================================
function initRecognition() {
    console.log('Дауысты тануды бастау...');
    
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        // Конфигурация
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLang;
        recognition.maxAlternatives = 1;
        
        // ============================================
        // ТЫҢДАУ БАСТАЛДЫ
        // ============================================
        recognition.onstart = () => {
            console.log('✅ Тыңдау басталды');
            permissionGranted = true;
            isListening = true;
            
            // UI жаңарту
            permissionBox.innerHTML = '';
            errorMsg.innerHTML = '';
            micBtn.classList.add('listening');
            statusIndicator.classList.add('active');
            status.textContent = texts[currentLang].listening;
            
            // Алғашқы хабарды жою
            removeWelcomeMessage();
        };
        
        // ============================================
        // НӘТИЖЕЛЕР КЕЛДІ
        // ============================================
        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Түпкілікті мәтінді қосу
            if (finalTranscript.trim()) {
                addMessage(finalTranscript.trim());
                updateWordCount();
            }
        };
        
        // ============================================
        // ҚАТЕ БОЛДЫ
        // ============================================
        recognition.onerror = (event) => {
            console.error('Қате:', event.error);
            
            switch (event.error) {
                case 'not-allowed':
                case 'service-not-allowed':
                    permissionGranted = false;
                    showError(texts[currentLang].denied + '\n\n' + texts[currentLang].deniedHelp);
                    disableMicrophone();
                    break;
                    
                case 'no-speech':
                    console.log('Дауыс естілмеді, жалғастыру...');
                    break;
                    
                case 'network':
                    showError(texts[currentLang].networkError);
                    break;
                    
                case 'aborted':
                    console.log('Тоқтатылды');
                    break;
                    
                default:
                    showError(texts[currentLang].browserError + ': ' + event.error);
            }
            
            if (event.error !== 'no-speech') {
                stopListening();
            }
        };
        
        // ============================================
        // ТЫҢДАУ АЯҚТАЛДЫ
        // ============================================
        recognition.onend = () => {
            console.log('Тыңдау аяқталды');
            
            // Егер әлі тыңдау керек болса, қайта бастау
            if (isListening && permissionGranted) {
                try {
                    setTimeout(() => {
                        recognition.start();
                    }, 100);
                } catch (e) {
                    console.error('Қайта бастау қатесі:', e);
                    stopListening();
                }
            }
        };
        
        // Тыңдауды бастау
        recognition.start();
        
    } catch (err) {
        console.error('Инициализация қатесі:', err);
        showError(texts[currentLang].browserError);
    }
}

// ============================================
// ХАБАРДЫ ҚОСУ
// ============================================
function addMessage(text) {
    const messageDiv = document.createElement('div');
    const isEmerg = isEmergency(text);
    
    messageDiv.className = isEmerg ? 'message emergency' : 'message normal';
    
    const icon = document.createElement('span');
    icon.className = 'message-icon';
    icon.textContent = isEmerg ? '⚠️' : '💬';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'message-text';
    textSpan.textContent = text;
    
    messageDiv.appendChild(icon);
    messageDiv.appendChild(textSpan);
    
    transcript.appendChild(messageDiv);
    transcript.scrollTop = transcript.scrollHeight;
    
    // Хабарларды сақтау
    allMessages.push(text);
    
    // Төтенше жағдайда вибрация
    if (isEmerg && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
    }
}

// ============================================
// ТӨТЕНШЕ ЖАҒДАЙДЫ ТЕКСЕРУ
// ============================================
function isEmergency(text) {
    const lowerText = text.toLowerCase();
    const words = emergencyWords[currentLang];
    
    return words.some(word => {
        const lowerWord = word.toLowerCase();
        return lowerText.includes(lowerWord);
    });
}

// ============================================
// ҚАРСЫ АЛҒЫШ ХАБАРДЫ ЖОЮ
// ============================================
function removeWelcomeMessage() {
    const welcomeMsg = transcript.querySelector('.message.welcome');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
}

// ============================================
// СӨЗ САНЫН ЖАҢАРТУ
// ============================================
function updateWordCount() {
    totalWords = allMessages.join(' ').trim().split(/\s+/).length;
    wordCount.textContent = `${totalWords} ${texts[currentLang].words}`;
}

// ============================================
// ТЫҢДАУДЫ ТОҚТАТУ
// ============================================
function stopListening() {
    isListening = false;
    
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {
            console.error('Тоқтату қатесі:', e);
        }
    }
    
    micBtn.classList.remove('listening');
    statusIndicator.classList.remove('active');
    status.textContent = permissionGranted ? texts[currentLang].ready : texts[currentLang].clickToStart;
}

// ============================================
// ҚАТЕ КӨРСЕТУ
// ============================================
function showError(message) {
    errorMsg.innerHTML = `<div class="error-message">${message}</div>`;
    
    setTimeout(() => {
        errorMsg.innerHTML = '';
    }, 6000);
}

// ============================================
// МӘТІНДІ КӨШІРУ
// ============================================
async function copyToClipboard() {
    if (allMessages.length === 0) {
        showError(texts[currentLang].noText);
        return;
    }
    
    const textToCopy = allMessages.join('\n');
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        showSuccess(texts[currentLang].copied);
    } catch (err) {
        console.error('Көшіру қатесі:', err);
        showError(texts[currentLang].copyError);
    }
}

// ============================================
// ЖЕТІСТІК ХАБАРЛАМАСЫ
// ============================================
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 15px;
        font-size: 18px;
        font-weight: 600;
        box-shadow: 0 10px 40px rgba(81, 207, 102, 0.4);
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => successDiv.remove(), 300);
    }, 2000);
}

// ============================================
// ОҚИҒАЛАРДЫ ТЫҢДАУ
// ============================================

// Микрофон батырмасы
micBtn.addEventListener('click', () => {
    if (micBtn.disabled) return;
    
    if (!permissionGranted) {
        initRecognition();
    } else if (isListening) {
        stopListening();
    } else {
        try {
            recognition.start();
            isListening = true;
        } catch (e) {
            console.error('Бастау қатесі:', e);
            showError(texts[currentLang].browserError);
        }
    }
});

// Тазалау батырмасы
clearBtn.addEventListener('click', () => {
    transcript.innerHTML = '';
    allMessages = [];
    totalWords = 0;
    updateWordCount();
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'message welcome';
    welcomeDiv.innerHTML = `
        <span class="message-icon">🗑️</span>
        <span class="message-text">${texts[currentLang].cleared}</span>
    `;
    transcript.appendChild(welcomeDiv);
});

// Көшіру батырмасы
copyBtn.addEventListener('click', copyToClipboard);

// Тілді ауыстыру
langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const wasListening = isListening;
        
        if (wasListening) {
            stopListening();
        }
        
        // UI жаңарту
        langBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLang = btn.dataset.lang;
        
        // Recognition тілін жаңарту
        if (recognition) {
            recognition.lang = currentLang;
        }
        
        // Статус мәтінін жаңарту
        status.textContent = permissionGranted ? texts[currentLang].ready : texts[currentLang].clickToStart;
        updateWordCount();
        
        // Егер тыңдап жатса, қайта бастау
        if (wasListening && permissionGranted) {
            setTimeout(() => {
                try {
                    recognition.start();
                    isListening = true;
                } catch (e) {
                    console.error('Қайта бастау қатесі:', e);
                }
            }, 500);
        }
    });
});

// Visibility change (бет жасырылғанда)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isListening) {
        stopListening();
    }
});

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
console.log('🎤 Есту Көмекшісі қосымшасы іске қосылды');

if (checkSupport()) {
    showPermissionRequest();
    console.log('✅ Дайын');
} else {
    console.error('❌ Браузер қолдамайды');
}

// Алғашқы word count
updateWordCount();
