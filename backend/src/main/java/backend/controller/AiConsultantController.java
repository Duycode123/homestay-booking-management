package backend.controller;

import backend.common.ApiResponse;
import backend.dto.request.AiChatRequest;
import backend.dto.response.AiChatResponse;
import backend.service.AiConsultantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiConsultantController {

    private final AiConsultantService aiConsultantService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@Valid @RequestBody AiChatRequest request) {
        return ResponseEntity.ok(
                ApiResponse.<AiChatResponse>builder()
                        .success(true)
                        .message("AI tư vấn phòng thành công")
                        .data(aiConsultantService.chat(request))
                        .build()
        );
    }

    @GetMapping("/suggested-questions")
    public ResponseEntity<ApiResponse<List<String>>> getSuggestedQuestions() {
        return ResponseEntity.ok(
                ApiResponse.<List<String>>builder()
                        .success(true)
                        .message("Láº¥y cĂ¢u há»i gá»£i Ă½ thĂ nh cĂ´ng")
                        .data(aiConsultantService.getSuggestedQuestions())
                        .build()
        );
    }
}
