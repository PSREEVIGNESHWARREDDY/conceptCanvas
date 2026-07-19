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
});