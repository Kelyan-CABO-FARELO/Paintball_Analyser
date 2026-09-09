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

// ========================================
// TUTORIAL LOGIC
// ========================================
const tutorialSteps = [
    {
        title: "Bienvenue sur le Timer de Match !",
        text: "Ce minuteur est pensé pour l'arbitrage en paintball sportif : il annonce les temps forts à voix haute et bipe sur les dernières secondes, pour rester audible même sur un terrain bruyant."
    },
    {
        title: "⏱️ Lancer un décompte",
        text: "Clique sur une des durées (2:00, 1:00, 0:30, 0:20 ou 0:10) pour démarrer le chrono. La durée choisie est annoncée à voix haute dès le clic.<br><br>Le bouton <b>Arrêter</b> coupe le décompte en cours à tout moment."
    },
    {
        title: "🔊 Annonces & bips automatiques",
        text: "Pendant le décompte, chaque seuil clé franchi (2 min, 1 min, 30s, 20s, 10s) est annoncé à voix haute — même si le décompte a démarré sur une durée plus longue.<br><br>Dans les 10 dernières secondes, un bip retentit chaque seconde, puis un bip long marque la fin du temps."
    },
    {
        title: "🏁 Game Finished",
        text: "Ce bouton est indépendant du décompte : utilise-le pour signaler la fin de partie à n'importe quel moment. Il coupe le chrono en cours, joue un triple bip distinct, puis annonce « Game finished »."
    }
];

let currentTutStep = 0;

function updateTutorial() {
    document.getElementById('tut-title').innerHTML = tutorialSteps[currentTutStep].title;
    document.getElementById('tut-body').innerHTML = `<p>${tutorialSteps[currentTutStep].text}</p>`;

    const progressContainer = document.querySelector('.tut-progress');
    progressContainer.innerHTML = '';
    for (let i = 0; i < tutorialSteps.length; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i === currentTutStep ? ' active' : '');
        progressContainer.appendChild(dot);
    }

    document.getElementById('tut-prev').style.display = currentTutStep === 0 ? 'none' : 'block';

    const nextBtn = document.getElementById('tut-next');
    if (currentTutStep === tutorialSteps.length - 1) {
        nextBtn.textContent = "Compris !";
        nextBtn.classList.remove('btn-primary');
        nextBtn.classList.add('btn-success');
    } else {
        nextBtn.textContent = "Suivant";
        nextBtn.classList.add('btn-primary');
        nextBtn.classList.remove('btn-success');
    }
}

function openTutorial() {
    currentTutStep = 0;
    updateTutorial();
    document.getElementById('tut-dismiss').checked = !!localStorage.getItem('tutorialDismissed_Timer');
    document.getElementById('tutorialModal').style.display = 'flex';
}

function closeTutorial() {
    if (document.getElementById('tut-dismiss').checked) {
        localStorage.setItem('tutorialDismissed_Timer', 'true');
    } else {
        localStorage.removeItem('tutorialDismissed_Timer');
    }
    document.getElementById('tutorialModal').style.display = 'none';
}

document.getElementById('tutorialBtn').addEventListener('click', openTutorial);

document.getElementById('tut-next').addEventListener('click', () => {
    if (currentTutStep < tutorialSteps.length - 1) {
        currentTutStep++;
        updateTutorial();
    } else {
        closeTutorial();
    }
});

document.getElementById('tut-prev').addEventListener('click', () => {
    if (currentTutStep > 0) {
        currentTutStep--;
        updateTutorial();
    }
});

document.getElementById('tut-close').addEventListener('click', closeTutorial);

// Show tutorial automatically à chaque visite, sauf si l'utilisateur a choisi de ne plus le voir
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('tutorialDismissed_Timer')) {
        openTutorial();
    }
});
