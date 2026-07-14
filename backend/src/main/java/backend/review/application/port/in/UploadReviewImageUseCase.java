package backend.review.application.port.in;

import backend.review.application.model.ReviewImageUploadResult;
import backend.review.application.port.in.command.UploadReviewImageCommand;

public interface UploadReviewImageUseCase {
    ReviewImageUploadResult upload(UploadReviewImageCommand command);
}
