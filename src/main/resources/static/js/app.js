document.addEventListener("DOMContentLoaded", () => {
    const waveSlider = document.getElementById("wavelength");
    const slitSlider = document.getElementById("slitSpacing");
    const waveValLabel = document.getElementById("waveVal");
    const slitValLabel = document.getElementById("slitVal");
    const mathExp = document.getElementById("mathExplanation");
    const plotContainer = document.getElementById("plotContainer");

    // Initialize an empty Plotly graph layout
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

        // Update textual numbers on labels
        waveValLabel.textContent = `${lambda} nm`;
        slitValLabel.textContent = `${d} nm`;

        try {
            // Fetch live data array calculation from your Spring Boot REST Endpoint
            const response = await fetch(`/api/optics/calculate?wavelengthNm=${lambda}&slitSpacingNm=${d}`);
            if (!response.ok) throw new Error("Backend math compute failed.");
            
            const data = await response.json();
            mathExp.textContent = data.explanation;

            // Prepare diffraction peak visualization points
            // Maxima positions are drawn as vertical lines of light intensity
            const xPoints = [];
            const yPoints = [];

            data.angles.forEach(angle => {
                // Main peak point
                xPoints.push(angle);
                yPoints.push(1.0);
                
                // Drop lines back down to baseline for nice clean plotting lines
                xPoints.push(angle - 0.5, angle, angle + 0.5, null);
                yPoints.push(0, 1, 0, null);
            });

            // Set line plot dynamic color to match real light wavelengths roughly
            let waveColor = '#4f46e5'; // default indigo
            if (lambda < 495) waveColor = '#06b6d4';      // Cyan/Blue range
            else if (lambda < 570) waveColor = '#22c55e'; // Green range
            else if (lambda < 590) waveColor = '#eab308'; // Yellow range
            else waveColor = '#ef4444';                  // Red range

            const trace = {
                x: xPoints,
                y: yPoints,
                mode: 'lines',
                name: 'Bright Fringes',
                line: { color: waveColor, width: 3 }
            };

            Plotly.react(plotContainer, [trace], layout);

        } catch (error) {
            console.error("Simulation Sync Error:", error);
        }
    }

    // Bind real-time change events to the dashboard inputs
    waveSlider.addEventListener("input", updateSimulation);
    slitSlider.addEventListener("input", updateSimulation);

    // Run the script instantly on window startup load
    updateSimulation();

    // AI Chatbox UI Handling Logic
    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");
    const chatHistory = document.getElementById("chatHistory");

    async function sendMessageToTutor() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Display user message in the chat box window
        chatHistory.innerHTML += `<div class="mt-2 text-slate-400 font-semibold">You:</div><div class="text-slate-200">${text}</div>`;
        chatInput.value = "";
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Show a loading text placeholder
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "text-indigo-400 italic animate-pulse mt-1";
        loadingDiv.textContent = "Tutor is thinking...";
        chatHistory.appendChild(loadingDiv);

        try {
            // POST request payload carrying message + active UI state variables
            const response = await fetch('/api/tutor/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    wavelength: waveSlider.value,
                    slitSpacing: slitSlider.value
                })
            });

            if (!response.ok) throw new Error("AI Endpoint offline.");
            const data = await response.json();

            // Clear loading display and write AI result
            loadingDiv.remove();
            chatHistory.innerHTML += `<div class="mt-2 text-indigo-400 font-semibold">Tutor:</div><div class="text-slate-300">${data.reply}</div>`;
            chatHistory.scrollTop = chatHistory.scrollHeight;

        } catch (error) {
            loadingDiv.remove();
            chatHistory.innerHTML += `<div class="mt-2 text-red-400 italic">Error connecting to AI Tutor. Check backend log.</div>`;
            console.error("AI Fetch Failure:", error);
        }
    }

    // Trigger action on button click or hitting Enter key
    sendBtn.addEventListener("click", sendMessageToTutor);
    chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessageToTutor(); });
});

