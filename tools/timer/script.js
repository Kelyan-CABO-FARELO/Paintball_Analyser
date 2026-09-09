const THRESHOLDS = [
    { seconds: 120, text: 'Two minutes' },
    { seconds: 60, text: 'One minute' },
    { seconds: 30, text: 'Thirty seconds' },
    { seconds: 20, text: 'Twenty seconds' },
    { seconds: 10, text: 'Ten seconds' },
];

const clockDisplay = document.getElementById('clockDisplay');
const phaseLabel = document.getElementById('phaseLabel');
const durationBtns = document.querySelectorAll('.duration-btn');
const stopBtn = document.getElementById('stopBtn');
const gameFinishedBtn = document.getElementById('gameFinishedBtn');

let intervalId = null;
let remaining = 0;
let activeBtn = null;

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
}

function beep(duration, freq, type = 'square') {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.9;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
    setTimeout(() => ctx.close(), duration + 100);
}

function tripleBeep() {
    beep(150, 800);
    setTimeout(() => beep(150, 800), 220);
    setTimeout(() => beep(150, 800), 440);
}

function formatClock(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function announceIfThreshold(seconds) {
    const match = THRESHOLDS.find(t => t.seconds === seconds);
    if (match) {
        speak(match.text);
        phaseLabel.textContent = match.text;
    }
}

function stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
    if (activeBtn) activeBtn.classList.remove('running');
    activeBtn = null;
}

function startTimer(seconds, text, btn) {
    stopTimer();
    remaining = seconds;
    activeBtn = btn;
    activeBtn.classList.add('running');

    clockDisplay.classList.toggle('warning', remaining <= 10);
    clockDisplay.textContent = formatClock(remaining);
    speak(text);
    phaseLabel.textContent = text;

    intervalId = setInterval(() => {
        remaining--;
        clockDisplay.textContent = formatClock(remaining);
        clockDisplay.classList.toggle('warning', remaining <= 10);

        announceIfThreshold(remaining);

        if (remaining > 0 && remaining <= 10) beep(150, 700);

        if (remaining <= 0) {
            stopTimer();
            beep(1800, 600);
            phaseLabel.textContent = 'Temps écoulé';
        }
    }, 1000);
}

durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        startTimer(Number(btn.dataset.seconds), btn.dataset.text, btn);
    });
});

stopBtn.addEventListener('click', () => {
    stopTimer();
    clockDisplay.textContent = '--:--';
    clockDisplay.classList.remove('warning');
    phaseLabel.textContent = 'Choisis une durée pour démarrer';
});

gameFinishedBtn.addEventListener('click', () => {
    stopTimer();
    clockDisplay.textContent = '--:--';
    clockDisplay.classList.remove('warning');
    tripleBeep();
    setTimeout(() => speak('Game finished'), 900);
    phaseLabel.textContent = 'Game finished';
});
