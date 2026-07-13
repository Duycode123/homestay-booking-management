package backend.service;

import backend.dto.request.AiChatRequest;
import backend.dto.response.AiChatResponse;

public interface AiConsultantService {

    AiChatResponse chat(AiChatRequest request);

    java.util.List<String> getSuggestedQuestions();
}
