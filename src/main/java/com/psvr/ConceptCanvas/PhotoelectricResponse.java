package com.psvr.ConceptCanvas;

import lombok.Data;

@Data
public class PhotoelectricResponse {
    private double photonEnergyEv;
    private double maxKineticEnergyEv;
    private double stoppingPotentialV;
    private double thresholdFrequencyHz;
    private boolean emissionOccurred;
    private String explanation;
}