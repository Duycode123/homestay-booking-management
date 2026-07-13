package backend.controller;

import backend.common.ApiResponse;
import backend.dto.request.UpsertReviewResponseRequest;
import backend.dto.request.UpdateReviewApprovalRequest;
import backend.dto.response.PagedResponse;
import backend.dto.response.ReviewResponse;
import backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> getReviews(
            @RequestParam(required = false) Integer roomId,
            @RequestParam(required = false) Integer staffId,
            @RequestParam(required = false) Boolean approved,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PagedResponse<ReviewResponse> data = reviewService.getReviewsForAdmin(
                roomId,
                staffId,
                approved,
                rating,
                keyword,
                page,
                size
        );

        return ResponseEntity.ok(success("Lay danh sach danh gia cho admin thanh cong", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReviewDetail(@PathVariable Integer id) {
        ReviewResponse data = reviewService.getReviewDetailForAdmin(id);

        return ResponseEntity.ok(success("Lay chi tiet danh gia thanh cong", data));
    }

    @PatchMapping("/{id}/approval")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateApproval(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateReviewApprovalRequest request
    ) {
        ReviewResponse data = reviewService.updateReviewApproval(id, request);

        return ResponseEntity.ok(success("Cap nhat trang thai duyet danh gia thanh cong", data));
    }

    @PutMapping("/{id}/response")
    public ResponseEntity<ApiResponse<ReviewResponse>> upsertResponse(
            @PathVariable Integer id,
            @Valid @RequestBody UpsertReviewResponseRequest request,
            Authentication authentication
    ) {
        ReviewResponse data = reviewService.upsertReviewResponse(id, request, authentication.getName());

        return ResponseEntity.ok(success("Luu phan hoi danh gia thanh cong", data));
    }

    @DeleteMapping("/{id}/response")
    public ResponseEntity<ApiResponse<Void>> deleteResponse(@PathVariable Integer id) {
        reviewService.deleteReviewResponse(id);

        return ResponseEntity.ok(success("Xoa phan hoi danh gia thanh cong", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Integer id) {
        reviewService.deleteReview(id);

        return ResponseEntity.ok(success("Xoa danh gia thanh cong", null));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
