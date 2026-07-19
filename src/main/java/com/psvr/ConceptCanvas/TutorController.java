package com.psvr.ConceptCanvas;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.Data;

@RestController
@RequestMapping("/api/tutor")
public class TutorController {

    @Autowired
    private ChatModel chatModel;

    @PostMapping("/ask")
    public ChatResponse askTutor(@RequestBody ChatRequest request) {
        String systemContext = String.format(
            "You are a physics tutor. Wavelength = %s nm, Slit Spacing = %s nm. User asks: '%s'",
            request.getWavelength(), request.getSlitSpacing(), request.getMessage()
        );
        
        String aiResponse = chatModel.call(systemContext);
        
        ChatResponse res = new ChatResponse();
        res.setReply(aiResponse);
        return res;
    }
}

@Data
class ChatRequest {
    private String message;
    private String wavelength;
    private String slitSpacing;
}

@Data
class ChatResponse {
    private String reply;
}