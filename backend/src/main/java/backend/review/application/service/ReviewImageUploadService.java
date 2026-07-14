package backend.review.application.service;

import backend.review.application.model.ReviewImageFile;
import backend.review.application.model.ReviewImageUploadResult;
import backend.review.application.port.in.UploadReviewImageUseCase;
import backend.review.application.port.in.command.UploadReviewImageCommand;
import backend.review.application.port.out.ReviewImageStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReviewImageUploadService implements UploadReviewImageUseCase {

    private static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final ReviewImageStoragePort storagePort;

    @Override
    public ReviewImageUploadResult upload(UploadReviewImageCommand command) {
        requireText(command.customerEmail(), "Phien dang nhap khong hop le");
        byte[] content = command.content();
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Vui long chon anh danh gia");
        }
        if (content.length > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Moi anh danh gia khong duoc vuot qua 5MB");
        }

        String contentType = requireText(command.contentType(), "File tai len phai la anh").toLowerCase();
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Chi ho tro anh JPG, PNG hoac WebP");
        }

        return storagePort.upload(new ReviewImageFile(command.fileName(), contentType, content));
    }

    private String requireText(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }
}
