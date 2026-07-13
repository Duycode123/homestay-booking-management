package backend.controller;

import backend.common.ApiResponse;
import backend.dto.request.CreateReviewRequest;
import backend.dto.response.PagedResponse;
import backend.dto.response.ReviewEligibilityResponse;
import backend.dto.response.ReviewResponse;
import backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication
    ) {
        ReviewResponse data = reviewService.createReview(request, authentication.getName());

        return ResponseEntity.ok(success("Tạo đánh giá thành công, vui lòng chờ admin duyệt", data));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> getMyReviews(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PagedResponse<ReviewResponse> data = reviewService.getMyReviews(authentication.getName(), page, size);

        return ResponseEntity.ok(success("Lấy danh sách đánh giá của tôi thành công", data));
    }

    @GetMapping("/eligibility")
    public ResponseEntity<ApiResponse<ReviewEligibilityResponse>> checkEligibility(
            @RequestParam Integer bookingId,
            Authentication authentication
    ) {
        ReviewEligibilityResponse data = reviewService.checkReviewEligibility(bookingId, authentication.getName());

        return ResponseEntity.ok(success("Kiểm tra điều kiện đánh giá thành công", data));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> getPublicReviews(
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PagedResponse<ReviewResponse> data = reviewService.getPublicReviews(null, rating, page, size);

        return ResponseEntity.ok(success("Lấy danh sách đánh giá công khai thành công", data));
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> getPublicReviewsByRoom(
            @PathVariable Integer roomId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PagedResponse<ReviewResponse> data = reviewService.getPublicReviews(roomId, rating, page, size);

        return ResponseEntity.ok(success("Lấy danh sách đánh giá của phòng thành công", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
