let waveSlider, slitSlider, waveValLabel, slitValLabel, mathExp, plotContainer;

// Speech Synthesis & Mute State Controller
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

    // Clean markdown/math syntax for smooth speech playback
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

// Render KaTeX Math Equations
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

// Converts visible light wavelength (nm) into an RGB CSS color string
function nmToRGB(wavelength) {
    let r, g, b;
    const wl = parseFloat(wavelength);

    if (wl >= 380 && wl < 440) {
        r = -(wl - 440) / (440 - 380);
        g = 0.0;
        b = 1.0;
    } else if (wl >= 440 && wl < 490) {
        r = 0.0;
        g = (wl - 440) / (490 - 440);
        b = 1.0;
    } else if (wl >= 490 && wl < 510) {
        r = 0.0;
        g = 1.0;
        b = -(wl - 510) / (510 - 490);
    } else if (wl >= 510 && wl < 580) {
        r = (wl - 510) / (580 - 510);
        g = 1.0;
        b = 0.0;
    } else if (wl >= 580 && wl < 645) {
        r = 1.0;
        g = -(wl - 645) / (645 - 580);
        b = 0.0;
    } else if (wl >= 645 && wl <= 780) {
        r = 1.0;
        g = 0.0;
        b = 0.0;
    } else {
        return '#818cf8'; // Default indigo accent fallback
    }

    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

document.addEventListener("DOMContentLoaded", () => {
    waveSlider = document.getElementById("wavelength");
    slitSlider = document.getElementById("slitSpacing");
    waveValLabel = document.getElementById("waveVal");
    slitValLabel = document.getElementById("slitVal");
    mathExp = document.getElementById("mathExplanation");
    plotContainer = document.getElementById("plotContainer");

    const layout = {
        paper_bgcolor: 'rgba(15, 23, 42, 0.8)',
        plot_bgcolor: 'rgba(15, 23, 42, 1)',
        font: { color: '#94a3b8' },
        xaxis: { title: 'Diffraction Angle (degrees)', range: [-90, 90], gridcolor: '#334155' },
        yaxis: { title: 'Relative Intensity', range: [0, 1.2], gridcolor: '#334155', showticklabels: false },
        margin: { t: 20, r: 20, b: 40, l: 40 }
    };

    Plotly.newPlot(plotContainer, [], layout, { responsive: true, displayModeBar: false });

    async function updateSimulation() {
        const lambda = waveSlider.value;
        const d = slitSlider.value;

        waveValLabel.textContent = `${lambda} nm`;
        slitValLabel.textContent = `${d} nm`;

        try {
            const response = await fetch(`/api/optics/diffraction?wavelengthNm=${lambda}&slitSpacingNm=${d}`);
            if (!response.ok) throw new Error("Backend calculate error.");
            
            const data = await response.json();
            mathExp.textContent = `First Min Angle: ${data.firstMinAngleDeg}° | Max Order (m_max): ${data.maxOrder}`;

            // Generate intensity curve points: I = cos^2(pi * d * sin(theta) / lambda)
            const angles = [];
            const lineColor = nmToRGB(lambda);
            const intensities = [];
            const lambdaM = lambda * 1e-9;
            const dM = d * 1e-9;

            for (let deg = -90; deg <= 90; deg += 0.5) {
                const rad = (deg * Math.PI) / 180;
                const beta = (Math.PI * dM * Math.sin(rad)) / lambdaM;
                const intensity = Math.pow(Math.cos(beta), 2);
                angles.push(deg);
                intensities.push(intensity);
            }

            const trace = {
                x: angles,
                y: intensities,
                type: 'scatter',
                mode: 'lines',
                line: { 
                    color: lineColor, width: 3 
                }
            };

            Plotly.react(plotContainer, [trace], layout);

        } catch (error) {
            console.error("Simulation error:", error);
        }
    }

    waveSlider.addEventListener("input", updateSimulation);
    slitSlider.addEventListener("input", updateSimulation);
    updateSimulation();
});

// Modal Elements & Controls
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
                message: text,
                wavelength: waveSlider.value,
                slitSpacing: slitSlider.value
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