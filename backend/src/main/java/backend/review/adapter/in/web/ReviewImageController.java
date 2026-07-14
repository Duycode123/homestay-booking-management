package backend.review.adapter.in.web;

import backend.common.ApiResponse;
import backend.review.adapter.in.web.dto.ReviewImageUploadResponse;
import backend.review.application.model.ReviewImageUploadResult;
import backend.review.application.port.in.UploadReviewImageUseCase;
import backend.review.application.port.in.command.UploadReviewImageCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/reviews/images")
@RequiredArgsConstructor
public class ReviewImageController {

    private final UploadReviewImageUseCase uploadReviewImageUseCase;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReviewImageUploadResponse>> upload(
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        ReviewImageUploadResult result = uploadReviewImageUseCase.upload(new UploadReviewImageCommand(
                authentication == null ? null : authentication.getName(),
                file.getOriginalFilename(),
                file.getContentType(),
                readFile(file)
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<ReviewImageUploadResponse>builder()
                .success(true)
                .message("Tai anh danh gia thanh cong")
                .data(ReviewImageUploadResponse.from(result))
                .build());
    }

    private byte[] readFile(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new IllegalArgumentException("Khong the doc anh danh gia tai len");
        }
    }
}
