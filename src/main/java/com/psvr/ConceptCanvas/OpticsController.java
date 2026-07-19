package com.psvr.ConceptCanvas;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/optics")
public class OpticsController {

    @GetMapping("/calculate")
    public DiffractionResponse calculateDiffraction(
            @RequestParam(defaultValue = "600") double wavelengthNm, // λ in nanometers
            @RequestParam(defaultValue = "2000") double slitSpacingNm // d in nanometers
    ) {
        DiffractionResponse response = new DiffractionResponse();
        List<Integer> orders = new ArrayList<>();
        List<Double> angles = new ArrayList<>();

        // Convert inputs for the formula: sin(theta) = m * lambda / d
        double lambda = wavelengthNm;
        double d = slitSpacingNm;

        // Calculate possible orders (m) up to the physical limit where sin(theta) > 1
        for (int m = 0; m <= 5; m++) {
            double sinTheta = (m * lambda) / d;
            
            // Physical boundary check
            if (sinTheta <= 1.0) {
                double thetaRadians = Math.asin(sinTheta);
                double thetaDegrees = Math.toDegrees(thetaRadians);
                
                orders.add(m);
                angles.add(thetaDegrees);
                
                // Also add negative orders for symmetry
                if (m > 0) {
                    orders.add(-m);
                    angles.add(-thetaDegrees);
                }
            }
        }

        response.setOrders(orders);
        response.setAngles(angles);
        response.setExplanation("Calculated " + orders.size() + " interference fringes for λ=" + wavelengthNm + "nm.");

        return response;
    }
}