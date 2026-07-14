package backend.review.application.service;

import backend.review.application.model.ReviewImageUploadResult;
import backend.review.application.port.in.command.UploadReviewImageCommand;
import backend.review.application.port.out.ReviewImageStoragePort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewImageUploadServiceTest {

    @Mock
    private ReviewImageStoragePort storagePort;

    @Test
    void uploadsValidCustomerReviewImage() {
        ReviewImageUploadService service = new ReviewImageUploadService(storagePort);
        ReviewImageUploadResult expected = new ReviewImageUploadResult("reviews/photo", "https://res.cloudinary.com/demo/photo.jpg");
        when(storagePort.upload(any())).thenReturn(expected);

        ReviewImageUploadResult result = service.upload(new UploadReviewImageCommand(
                "guest@example.com",
                "stay.webp",
                "image/webp",
                new byte[]{1, 2, 3}
        ));

        assertEquals(expected, result);
        verify(storagePort).upload(any());
    }

    @Test
    void rejectsUnsupportedImageType() {
        ReviewImageUploadService service = new ReviewImageUploadService(storagePort);

        assertThrows(IllegalArgumentException.class, () -> service.upload(new UploadReviewImageCommand(
                "guest@example.com",
                "vector.svg",
                "image/svg+xml",
                new byte[]{1}
        )));
        verify(storagePort, never()).upload(any());
    }
}
