let waveSlider, workSlider, waveValLabel, workValLabel, mathExp, plotContainer;

// Speech Synthesis & Mute Controller
let isMuted = false;
const muteBtn = document.getElementById("muteBtn");
const muteIcon = document.getElementById("muteIcon");
const muteText = document.getElementById("muteText");

if (muteBtn) {
    muteBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        if (isMuted) {
            window.speechSynthesis.cancel();
            muteIcon.textContent = "🔇";
            muteText.textContent = "Audio Off";
            muteBtn.classList.replace("bg-slate-700", "bg-red-900/40");
        } else {
            muteIcon.textContent = "🔊";
            muteText.textContent = "Audio On";
            muteBtn.classList.replace("bg-red-900/40", "bg-slate-700");
        }
    });
}

function speakText(text) {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text
        .replace(/\*+/g, '')
        .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
        .replace(/#/g, '')
        .replace(/\$\$/g, '')
        .replace(/\$/g, '')
        .replace(/\\text\{([^}]+)\}/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) || 
                           voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
}

function renderMathInContainer(element) {
    if (window.renderMathInElement && element) {
        window.renderMathInElement(element, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    waveSlider = document.getElementById("wavelength");
    workSlider = document.getElementById("workFunction");
    waveValLabel = document.getElementById("waveVal");
    workValLabel = document.getElementById("workVal");
    mathExp = document.getElementById("mathExplanation");
    plotContainer = document.getElementById("plotContainer");

    const layout = {
        paper_bgcolor: 'rgba(15, 23, 42, 0.8)',
        plot_bgcolor: 'rgba(15, 23, 42, 1)',
        font: { color: '#94a3b8' },
        xaxis: { title: 'Photon Energy (eV)', range: [0, 10], gridcolor: '#334155' },
        yaxis: { title: 'Max Kinetic Energy K_max (eV)', range: [0, 8], gridcolor: '#334155' },
        margin: { t: 20, r: 20, b: 40, l: 40 }
    };

    Plotly.newPlot(plotContainer, [], layout, { responsive: true, displayModeBar: false });

    async function updateSimulation() {
        const lambda = waveSlider.value;
        const phi = workSlider.value;

        waveValLabel.textContent = `${lambda} nm`;
        workValLabel.textContent = `${phi} eV`;

        try {
            const response = await fetch(`/api/optics/photoelectric?wavelengthNm=${lambda}&workFunctionEv=${phi}`);
            if (!response.ok) throw new Error("Backend compute error.");
            
            const data = await response.json();
            mathExp.textContent = data.explanation;

            // Plot threshold line: K_max = E_photon - Phi
            const xVals = [0, parseFloat(phi), 10];
            const yVals = [0, 0, 10 - parseFloat(phi)];

            const currentX = [data.photonEnergyEv];
            const currentY = [data.maxKineticEnergyEv];

            const lineTrace = {
                x: xVals,
                y: yVals,
                mode: 'lines',
                name: 'Einstein Equation',
                line: { color: '#6366f1', width: 2.5 }
            };

            const pointTrace = {
                x: currentX,
                y: currentY,
                mode: 'markers',
                name: 'Current State',
                marker: { color: data.emissionOccurred ? '#22c55e' : '#ef4444', size: 14 }
            };

            Plotly.react(plotContainer, [lineTrace, pointTrace], layout);

        } catch (error) {
            console.error("Simulation sync error:", error);
        }
    }

    waveSlider.addEventListener("input", updateSimulation);
    workSlider.addEventListener("input", updateSimulation);
    updateSimulation();
});

// Modal Controls & AI Integration
const expandBtn = document.getElementById("expandBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const chatModal = document.getElementById("chatModal");
const chatHistory = document.getElementById("chatHistory");
const modalChatHistory = document.getElementById("modalChatHistory");

const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const modalChatInput = document.getElementById("modalChatInput");
const modalSendBtn = document.getElementById("modalSendBtn");

if (expandBtn) {
    expandBtn.addEventListener("click", () => {
        chatModal.classList.remove("hidden");
        modalChatHistory.innerHTML = chatHistory.innerHTML;
        renderMathInContainer(modalChatHistory);
        modalChatHistory.scrollTop = modalChatHistory.scrollHeight;
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        chatModal.classList.add("hidden");
        chatHistory.scrollTop = chatHistory.scrollHeight;
    });
}

async function sendMessage(inputText) {
    const text = inputText.trim();
    if (!text) return;

    const userHTML = `<div class="mt-3 text-slate-400 font-semibold">You:</div><div class="text-slate-200 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">${text}</div>`;
    
    chatHistory.innerHTML += userHTML;
    modalChatHistory.innerHTML += userHTML;

    chatInput.value = "";
    modalChatInput.value = "";

    chatHistory.scrollTop = chatHistory.scrollHeight;
    modalChatHistory.scrollTop = modalChatHistory.scrollHeight;

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "text-indigo-400 italic animate-pulse mt-2";
    loadingDiv.textContent = "Tutor is thinking...";
    
    const loadingDivModal = loadingDiv.cloneNode(true);
    chatHistory.appendChild(loadingDiv);
    modalChatHistory.appendChild(loadingDivModal);

    try {
        const response = await fetch('/api/tutor/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `[Photoelectric Context: Wavelength = ${waveSlider.value}nm, Work Function = ${workSlider.value}eV] ${text}`,
                wavelength: waveSlider.value,
                slitSpacing: workSlider.value
            })
        });

        if (!response.ok) throw new Error("AI Endpoint error");
        const data = await response.json();

        loadingDiv.remove();
        loadingDivModal.remove();

        const formattedReply = data.reply.replace(/\n/g, '<br>');
        const aiHTML = `<div class="mt-3 text-indigo-400 font-semibold">Tutor:</div><div class="text-slate-200 bg-slate-800/40 p-3 rounded-lg border border-indigo-500/20">${formattedReply}</div>`;

        chatHistory.innerHTML += aiHTML;
        modalChatHistory.innerHTML += aiHTML;

        renderMathInContainer(chatHistory);
        renderMathInContainer(modalChatHistory);

        chatHistory.scrollTop = chatHistory.scrollHeight;
        modalChatHistory.scrollTop = modalChatHistory.scrollHeight;

        speakText(data.reply);

    } catch (err) {
        loadingDiv.remove();
        loadingDivModal.remove();
        const errHTML = `<div class="mt-2 text-red-400 italic">Error connecting to AI Tutor.</div>`;
        chatHistory.innerHTML += errHTML;
        modalChatHistory.innerHTML += errHTML;
    }
}

if (sendBtn) sendBtn.addEventListener("click", () => sendMessage(chatInput.value));
if (chatInput) chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(chatInput.value); });
if (modalSendBtn) modalSendBtn.addEventListener("click", () => sendMessage(modalChatInput.value));
if (modalChatInput) modalChatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(modalChatInput.value); });