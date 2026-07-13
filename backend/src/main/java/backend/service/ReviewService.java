package backend.service;

import backend.dto.request.CreateReviewRequest;
import backend.dto.request.UpsertReviewResponseRequest;
import backend.dto.request.UpdateReviewApprovalRequest;
import backend.dto.response.PagedResponse;
import backend.dto.response.ReviewEligibilityResponse;
import backend.dto.response.ReviewResponse;

public interface ReviewService {

    ReviewResponse createReview(CreateReviewRequest request, String customerEmail);

    PagedResponse<ReviewResponse> getMyReviews(String customerEmail, int page, int size);

    ReviewEligibilityResponse checkReviewEligibility(Integer bookingId, String customerEmail);

    PagedResponse<ReviewResponse> getPublicReviews(Integer roomId, Integer rating, int page, int size);

    PagedResponse<ReviewResponse> getReviewsForAdmin(
            Integer roomId,
            Integer staffId,
            Boolean approved,
            Integer rating,
            String keyword,
            int page,
            int size
    );

    ReviewResponse getReviewDetailForAdmin(Integer reviewId);

    ReviewResponse updateReviewApproval(Integer reviewId, UpdateReviewApprovalRequest request);

    ReviewResponse upsertReviewResponse(Integer reviewId, UpsertReviewResponseRequest request, String responderEmail);

    void deleteReviewResponse(Integer reviewId);

    void deleteReview(Integer reviewId);
}
