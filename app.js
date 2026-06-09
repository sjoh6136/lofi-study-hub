// --- App State & Audio Management ---
const state = {
    // Timer
    timer: null,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    timerMode: 'work',
    timerRunning: false,

    // Audio Files (Local Assets)
    sounds: {
        rain: { url: 'assets/sounds/rain.mp3', audio: null },
        fireplace: { url: 'assets/sounds/fireplace.mp3', audio: null },
        cafe: { url: 'assets/sounds/cafe.mp3', audio: null },
        forest: { url: 'assets/sounds/forest.mp3', audio: null }
    },

    // Music Player (Local Assets)
    stations: {
        lofigirl: 'assets/music/lofigirl.mp3',
        chillhop: 'assets/music/chillhop.mp3',
        synthwave: 'assets/music/synthwave.mp3',
        jazz: 'assets/music/jazz.mp3'
    },
    activeStation: 'lofigirl',
    musicAudio: null,
    isPlaying: false,
    
    // Stretch Reminder
    cumulativeWorkTime: 0,
    stretchThreshold: 50 * 60 // 50 minutes in seconds
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initTimer();
    initMixer();
    initMusicPlayer();
    initMemo();
    initSettings();
    initFocusMode();
    initBreathingGuide();
});

// --- Digital Clock ---
function initClock() {
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    const formatNumber = num => String(num).padStart(2, '0');
    
    const updateTime = () => {
        const now = new Date();
        timeEl.textContent = `${formatNumber(now.getHours())}:${formatNumber(now.getMinutes())}:${formatNumber(now.getSeconds())}`;
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        dateEl.textContent = `${now.getFullYear()}년 ${formatNumber(now.getMonth() + 1)}월 ${formatNumber(now.getDate())}일 ${days[now.getDay()]}`;
    };
    updateTime();
    setInterval(updateTime, 1000);
}

// --- Focus Timer ---
function initTimer() {
    const timeEl = document.getElementById('timer-time');
    const startBtn = document.getElementById('btn-timer-start');
    const pauseBtn = document.getElementById('btn-timer-pause');
    const resetBtn = document.getElementById('btn-timer-reset');
    const modeBtns = document.querySelectorAll('.timer-mode-btn');
    const circle = document.getElementById('timer-progress');
    const durationDisplay = document.getElementById('custom-duration-display');
    const durationMinusBtn = document.getElementById('btn-duration-minus');
    const durationPlusBtn = document.getElementById('btn-duration-plus');
    
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;

    const updateDisplay = () => {
        const minutes = Math.floor(state.timeLeft / 60);
        const seconds = state.timeLeft % 60;
        timeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        circle.style.strokeDashoffset = circumference - ((state.timeLeft / state.totalTime) * circumference);
    };

    const setMode = mode => {
        state.timerMode = mode;
        state.timerRunning = false;
        clearInterval(state.timer);
        modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
        const times = { work: 1500, short: 300, long: 900 };
        state.timeLeft = state.totalTime = times[mode];
        if(durationDisplay) durationDisplay.textContent = Math.round(state.totalTime / 60);
        updateDisplay();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    };

    const adjustDuration = (amountMinutes) => {
        let newTotal = state.totalTime + (amountMinutes * 60);
        if (newTotal < 60) newTotal = 60;
        if (newTotal > 10800) newTotal = 10800;
        state.timeLeft += (newTotal - state.totalTime);
        state.totalTime = newTotal;
        if(durationDisplay) durationDisplay.textContent = Math.round(state.totalTime / 60);
        updateDisplay();
    };

    startBtn.addEventListener('click', () => {
        state.timerRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        state.timer = setInterval(() => {
            state.timeLeft--;
            updateDisplay();
            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                state.timerRunning = false;
                playChimeSound();
                alert(state.timerMode === 'work' ? '공부 끝! 휴식하세요.' : '휴식 끝! 시작합시다.');
                setMode(state.timerMode === 'work' ? 'short' : 'work');
            }
        }, 1000);
    });

    pauseBtn.addEventListener('click', () => {
        state.timerRunning = false;
        clearInterval(state.timer);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    });

    resetBtn.addEventListener('click', () => setMode(state.timerMode));
    modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
    if(durationMinusBtn) durationMinusBtn.onclick = () => adjustDuration(-1);
    if(durationPlusBtn) durationPlusBtn.onclick = () => adjustDuration(1);
    
    setMode('work');
}

// --- Music Player (Standard Audio API) ---
function initMusicPlayer() {
    const playBtn = document.getElementById('btn-music-play');
    const playIcon = playBtn.querySelector('span');
    const volumeSlider = document.getElementById('slider-music-volume');
    const stationBtns = document.querySelectorAll('.station-btn');
    const playerCard = document.getElementById('widget-player');
    const titleEl = document.getElementById('track-title');
    const artistEl = document.getElementById('track-artist');

    const updateTrackInfo = (key) => {
        const info = {
            lofigirl: ["Lofi Girl Beats", "Local Station"],
            chillhop: ["Chillhop Essentials", "Local Station"],
            synthwave: ["Synthwave Night", "Local Station"],
            jazz: ["Jazz Lofi Cafe", "Local Station"]
        };
        if(titleEl && artistEl) [titleEl.textContent, artistEl.textContent] = info[key];
    };

    const playStation = (key) => {
        if (state.musicAudio) {
            state.musicAudio.pause();
            state.musicAudio = null;
        }
        
        state.musicAudio = new Audio(state.stations[key]);
        state.musicAudio.loop = true;
        state.musicAudio.volume = volumeSlider.value / 100;
        
        state.musicAudio.play().then(() => {
            state.isPlaying = true;
            playIcon.textContent = 'pause_circle';
            playerCard.classList.add('playing');
        }).catch(err => console.log("Music play blocked:", err));
        
        updateTrackInfo(key);
    };

    playBtn.addEventListener('click', () => {
        if (!state.musicAudio) {
            playStation(state.activeStation);
            return;
        }

        if (state.isPlaying) {
            state.musicAudio.pause();
            playIcon.textContent = 'play_circle';
            playerCard.classList.remove('playing');
        } else {
            state.musicAudio.play();
            playIcon.textContent = 'pause_circle';
            playerCard.classList.add('playing');
        }
        state.isPlaying = !state.isPlaying;
    });

    volumeSlider.addEventListener('input', () => {
        if (state.musicAudio) state.musicAudio.volume = volumeSlider.value / 100;
    });

    stationBtns.forEach(btn => btn.addEventListener('click', () => {
        const key = btn.dataset.station;
        stationBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeStation = key;
        playStation(key);
    }));

    updateTrackInfo(state.activeStation);
}

// --- Ambient Mixer ---
function initMixer() {
    const channels = document.querySelectorAll('.mixer-channel');
    const rainOverlay = document.getElementById('rain-overlay');

    channels.forEach(channel => {
        const soundKey = channel.dataset.sound;
        const toggleBtn = channel.querySelector('.sound-toggle-btn');
        const slider = channel.querySelector('.sound-volume-slider');

        const updateVolume = () => {
            if (!state.sounds[soundKey].audio) {
                state.sounds[soundKey].audio = new Audio(state.sounds[soundKey].url);
                state.sounds[soundKey].audio.loop = true;
            }
            const audio = state.sounds[soundKey].audio;
            const vol = parseFloat(slider.value) / 100;
            audio.volume = vol;
            if (vol > 0) {
                audio.play().catch(() => {});
                channel.classList.add('active');
                if (soundKey === 'rain') rainOverlay.classList.add('active');
            } else {
                audio.pause();
                channel.classList.remove('active');
                if (soundKey === 'rain') rainOverlay.classList.remove('active');
            }
        };

        toggleBtn.addEventListener('click', () => {
            slider.value = slider.value == 0 ? 50 : 0;
            updateVolume();
        });
        slider.addEventListener('input', updateVolume);
    });
}

// --- Todo List ---
function initMemo() {
    const input = document.getElementById('input-todo');
    const addBtn = document.getElementById('btn-todo-add');
    const listEl = document.getElementById('todo-list');
    let todos = JSON.parse(localStorage.getItem('study-space-todos') || '[]');

    const render = () => {
        listEl.innerHTML = '';
        todos.forEach((t, i) => {
            const li = document.createElement('li');
            li.className = `todo-item ${t.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="todo-text-wrapper">
                    <span class="material-symbols-rounded todo-checkbox">${t.completed ? 'check_box' : 'check_box_outline_blank'}</span>
                    <span class="todo-text">${t.text}</span>
                </div>
                <button class="todo-delete-btn"><span class="material-symbols-rounded">delete</span></button>
            `;
            li.querySelector('.todo-text-wrapper').onclick = () => { t.completed = !t.completed; save(); };
            li.querySelector('.todo-delete-btn').onclick = () => { todos.splice(i, 1); save(); };
            listEl.appendChild(li);
        });
    };

    const save = () => { localStorage.setItem('study-space-todos', JSON.stringify(todos)); render(); };
    addBtn.onclick = () => { if (input.value.trim()) { todos.push({ text: input.value.trim(), completed: false }); input.value = ''; save(); } };
    input.onkeypress = (e) => e.key === 'Enter' && addBtn.click();
    render();
}

function initSettings() {
    const panel = document.getElementById('settings-panel');
    document.getElementById('btn-settings').onclick = () => panel.classList.add('active');
    document.getElementById('btn-close-settings').onclick = () => panel.classList.remove('active');
    document.getElementById('slider-bg-opacity').oninput = (e) => document.querySelector('.bg-overlay').style.backgroundColor = `rgba(5, 6, 12, ${e.target.value / 100})`;
    
    document.querySelectorAll('.theme-select-btn').forEach(btn => btn.onclick = () => {
        document.querySelectorAll('.theme-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.body.className = btn.dataset.theme === 'default' ? '' : `theme-${btn.dataset.theme}`;
    });
}

function initFocusMode() {
    const hint = document.getElementById('focus-exit-hint');
    document.getElementById('btn-focus-mode').onclick = () => { 
        document.body.classList.add('focus-mode-active'); 
        hint.classList.add('visible'); 
        setTimeout(() => hint.classList.remove('visible'), 3000); 
    };
    document.ondblclick = () => document.body.classList.remove('focus-mode-active');
}

function initBreathingGuide() {
    const el = document.getElementById('breathing-text');
    setInterval(() => el.textContent = el.textContent.includes('(들숨)') ? "천천히 숨을 내쉬세요 (날숨)" : "잠시 심호흡해 보세요 (들숨)", 4000);
}

function playChimeSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const chime = (f, t) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 1);
        o.start(t); o.stop(t + 1);
    };
    [523.25, 659.25, 783.99].forEach((f, i) => chime(f, ctx.currentTime + i * 0.15));
}
05); g.gain.exponentialRampToValueAtTime(0.001, t + 1);
        o.start(t); o.stop(t + 1);
    };
    [523.25, 659.25, 783.99].forEach((f, i) => chime(f, ctx.currentTime + i * 0.15));
}
t); g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 1);
        o.start(t); o.stop(t + 1);
    };
    [523.25, 659.25, 783.99].forEach((f, i) => chime(f, ctx.currentTime + i * 0.15));
}
