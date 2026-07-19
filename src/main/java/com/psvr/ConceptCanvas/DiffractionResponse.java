package com.psvr.ConceptCanvas;

import lombok.Data;
import java.util.List;

@Data
public class DiffractionResponse {
    private List<Integer> orders;      // m values (0, 1, 2...)
    private List<Double> angles;       // calculated theta values in degrees
    private String explanation;        // A quick string breakdown of the math state
}