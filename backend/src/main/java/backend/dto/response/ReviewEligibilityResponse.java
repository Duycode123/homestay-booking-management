package backend.dto.response;

public record ReviewEligibilityResponse(
        Integer bookingId,
        boolean eligible,
        boolean alreadyReviewed,
        String reason
) {
}
