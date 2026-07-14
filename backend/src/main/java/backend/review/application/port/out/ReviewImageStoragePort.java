package backend.review.application.port.out;

import backend.review.application.model.ReviewImageFile;
import backend.review.application.model.ReviewImageUploadResult;

public interface ReviewImageStoragePort {
    ReviewImageUploadResult upload(ReviewImageFile imageFile);
}
