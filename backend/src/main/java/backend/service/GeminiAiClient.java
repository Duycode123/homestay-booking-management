package backend.service;

import backend.config.GeminiAiProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiAiClient {

    private final GeminiAiProperties properties;
    private final RestClient.Builder restClientBuilder;

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    public String getModel() {
        return properties.getModel();
    }

    public String chat(String systemPrompt, String userPrompt) {
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of(
                        "parts", List.of(Map.of("text", systemPrompt))
                ),
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", userPrompt))
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", properties.getTemperature(),
                        "maxOutputTokens", properties.getMaxOutputTokens()
                )
        );

        Map<?, ?> response = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build()
                .post()
                .uri("/models/{model}:generateContent?key={apiKey}", properties.getModel(), properties.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        return extractAnswer(response);
    }

    private String extractAnswer(Map<?, ?> response) {
        if (response == null) {
            throw new IllegalStateException("Gemini returned an empty response");
        }

        Object candidatesObject = response.get("candidates");
        if (!(candidatesObject instanceof List<?> candidates) || candidates.isEmpty()) {
            Object promptFeedback = response.get("promptFeedback");
            throw new IllegalStateException("Gemini response has no candidates: " + promptFeedback);
        }

        Object firstCandidate = candidates.get(0);
        if (!(firstCandidate instanceof Map<?, ?> candidate)) {
            throw new IllegalStateException("Gemini candidate format is invalid");
        }

        if ("MAX_TOKENS".equals(candidate.get("finishReason"))) {
            throw new IllegalStateException("Gemini answer was truncated by maxOutputTokens");
        }

        Object contentObject = candidate.get("content");
        if (!(contentObject instanceof Map<?, ?> content)) {
            throw new IllegalStateException("Gemini content format is invalid");
        }

        Object partsObject = content.get("parts");
        if (!(partsObject instanceof List<?> parts) || parts.isEmpty()) {
            throw new IllegalStateException("Gemini content has no parts");
        }

        StringBuilder answer = new StringBuilder();
        for (Object partObject : parts) {
            if (partObject instanceof Map<?, ?> part && part.get("text") instanceof String text) {
                answer.append(text.trim()).append(System.lineSeparator());
            }
        }

        String result = answer.toString().trim();
        if (result.isBlank()) {
            throw new IllegalStateException("Gemini answer is blank");
        }
        return result;
    }
}
