let waveSlider, workSlider, waveValLabel, workValLabel, mathExp, plotContainer;

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

            // Plot line representing Einstein's equation: Kmax = E_photon - Phi
            const xVals = [0, parseFloat(phi), 10];
            const yVals = [0, 0, 10 - parseFloat(phi)];

            // Active point marker
            const currentX = [data.photonEnergyEv];
            const currentY = [data.maxKineticEnergyEv];

            const lineTrace = {
                x: xVals,
                y: yVals,
                mode: 'lines',
                name: 'Einstein Equation',
                line: { color: '#6366f1', width: 2 }
            };

            const pointTrace = {
                x: currentX,
                y: currentY,
                mode: 'markers',
                name: 'Current State',
                marker: { color: data.emissionOccurred ? '#22c55e' : '#ef4444', size: 12 }
            };

            Plotly.react(plotContainer, [lineTrace, pointTrace], layout);

        } catch (error) {
            console.error("Simulation sync error:", error);
        }
    }

    waveSlider.addEventListener("input", updateSimulation);
    workSlider.addEventListener("input", updateSimulation);
    updateSimulation();

    // AI Chatbox Setup
    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");
    const chatHistory = document.getElementById("chatHistory");

    async function sendMessageToTutor() {
        const text = chatInput.value.trim();
        if (!text) return;

        chatHistory.innerHTML += `<div class="mt-2 text-slate-400 font-semibold">You:</div><div class="text-slate-200">${text}</div>`;
        chatInput.value = "";
        chatHistory.scrollTop = chatHistory.scrollHeight;

        const loadingDiv = document.createElement("div");
        loadingDiv.className = "text-indigo-400 italic animate-pulse mt-1";
        loadingDiv.textContent = "Tutor is thinking...";
        chatHistory.appendChild(loadingDiv);

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

            if (!response.ok) throw new Error("AI offline.");
            const data = await response.json();

            loadingDiv.remove();
            chatHistory.innerHTML += `<div class="mt-2 text-indigo-400 font-semibold">Tutor:</div><div class="text-slate-300">${data.reply}</div>`;
            chatHistory.scrollTop = chatHistory.scrollHeight;

        } catch (err) {
            loadingDiv.remove();
            chatHistory.innerHTML += `<div class="mt-2 text-red-400 italic">Error talking to AI Tutor.</div>`;
        }
    }

    sendBtn.addEventListener("click", sendMessageToTutor);
    chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessageToTutor(); });
});