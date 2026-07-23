package com.psvr.ConceptCanvas;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/optics")
public class PhotoelectricController {

    // Planck's constant in eV*s
    private static final double PLANCK_EV_S = 4.135667696e-15;
    // Speed of light in m/s
    private static final double SPEED_OF_LIGHT = 3.0e8;

    @GetMapping("/photoelectric")
    public PhotoelectricResponse calculateEffect(
            @RequestParam double wavelengthNm,
            @RequestParam double workFunctionEv) {

        PhotoelectricResponse response = new PhotoelectricResponse();

        // Convert wavelength to meters
        double wavelengthMeters = wavelengthNm * 1e-9;
        
        // Calculate photon energy: E = hc / lambda
        double frequency = SPEED_OF_LIGHT / wavelengthMeters;
        double photonEnergy = PLANCK_EV_S * frequency;

        // Threshold frequency: f0 = WorkFunction / h
        double thresholdFreq = (workFunctionEv / PLANCK_EV_S);

        response.setPhotonEnergyEv(Math.round(photonEnergy * 100.0) / 100.0);
        response.setThresholdFrequencyHz(thresholdFreq);

        // Einstein's Photoelectric Equation: K_max = E_photon - WorkFunction
        if (photonEnergy >= workFunctionEv) {
            double kMax = photonEnergy - workFunctionEv;
            response.setEmissionOccurred(true);
            response.setMaxKineticEnergyEv(Math.round(kMax * 100.0) / 100.0);
            response.setStoppingPotentialV(Math.round(kMax * 100.0) / 100.0);
            response.setExplanation(String.format(
                "Emission Active! Photon energy (%.2f eV) exceeds work function (%.2f eV). Max Kinetic Energy = %.2f eV.",
                photonEnergy, workFunctionEv, kMax
            ));
        } else {
            response.setEmissionOccurred(false);
            response.setMaxKineticEnergyEv(0.0);
            response.setStoppingPotentialV(0.0);
            response.setExplanation(String.format(
                "No Emission! Photon energy (%.2f eV) is lower than work function (%.2f eV). Increase frequency/decrease wavelength.",
                photonEnergy, workFunctionEv
            ));
        }

        return response;
    }
}