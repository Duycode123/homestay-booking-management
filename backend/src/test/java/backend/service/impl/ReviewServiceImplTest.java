package backend.service.impl;

import backend.dto.request.UpsertReviewResponseRequest;
import backend.dto.response.ReviewResponse;
import backend.entity.Booking;
import backend.entity.Customer;
import backend.entity.Review;
import backend.entity.ReviewAdminResponse;
import backend.entity.Role;
import backend.entity.Room;
import backend.entity.Staff;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.repository.BookingRepository;
import backend.repository.CustomerRepository;
import backend.repository.ReviewAdminResponseRepository;
import backend.repository.ReviewRepository;
import backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ReviewAdminResponseRepository reviewAdminResponseRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    private ReviewServiceImpl reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewServiceImpl(
                reviewRepository,
                reviewAdminResponseRepository,
                bookingRepository,
                customerRepository,
                userRepository
        );
    }

    @Test
    void createsAdminResponseWhenReviewHasNoResponseYet() {
        Review review = sampleReview();
        User admin = User.builder()
                .id(9)
                .email("admin@example.com")
                .role(Role.ADMIN)
                .build();
        UpsertReviewResponseRequest request = new UpsertReviewResponseRequest();
        request.setContent("  Thanks for the detailed feedback.  ");

        when(reviewRepository.findById(55)).thenReturn(Optional.of(review));
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(reviewAdminResponseRepository.save(any(ReviewAdminResponse.class))).thenAnswer(invocation -> {
            ReviewAdminResponse response = invocation.getArgument(0);
            response.setId(71);
            return response;
        });

        ReviewResponse result = reviewService.upsertReviewResponse(55, request, admin.getEmail());

        ArgumentCaptor<ReviewAdminResponse> captor = ArgumentCaptor.forClass(ReviewAdminResponse.class);
        verify(reviewAdminResponseRepository).save(captor.capture());
        assertEquals(review, captor.getValue().getReview());
        assertEquals(admin, captor.getValue().getResponder());
        assertEquals("Thanks for the detailed feedback.", captor.getValue().getContent());

        assertNotNull(result.adminResponse());
        assertEquals(71, result.adminResponse().id());
        assertEquals("ADMIN", result.adminResponse().responderRole());
        assertEquals("Thanks for the detailed feedback.", result.adminResponse().content());
        assertNotNull(review.getAdminResponse());
    }

    @Test
    void updatesExistingAdminResponseInsteadOfCreatingAnotherOne() {
        Review review = sampleReview();
        User admin = User.builder()
                .id(9)
                .email("admin@example.com")
                .role(Role.ADMIN)
                .build();
        ReviewAdminResponse existingResponse = ReviewAdminResponse.builder()
                .id(71)
                .review(review)
                .responder(admin)
                .content("Old response")
                .build();
        review.setAdminResponse(existingResponse);

        UpsertReviewResponseRequest request = new UpsertReviewResponseRequest();
        request.setContent("Updated response from admin");

        when(reviewRepository.findById(55)).thenReturn(Optional.of(review));
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(reviewAdminResponseRepository.save(any(ReviewAdminResponse.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReviewResponse result = reviewService.upsertReviewResponse(55, request, admin.getEmail());

        verify(reviewAdminResponseRepository).save(existingResponse);
        assertEquals(71, result.adminResponse().id());
        assertEquals("Updated response from admin", result.adminResponse().content());
        assertEquals("Updated response from admin", existingResponse.getContent());
    }

    @Test
    void rejectsNonAdminResponder() {
        Review review = sampleReview();
        User staff = User.builder()
                .id(12)
                .email("staff@example.com")
                .role(Role.STAFF)
                .build();
        UpsertReviewResponseRequest request = new UpsertReviewResponseRequest();
        request.setContent("Staff should not be allowed here");

        when(reviewRepository.findById(55)).thenReturn(Optional.of(review));
        when(userRepository.findByEmail(staff.getEmail())).thenReturn(Optional.of(staff));

        assertThrows(
                ForbiddenException.class,
                () -> reviewService.upsertReviewResponse(55, request, staff.getEmail())
        );
        verify(reviewAdminResponseRepository, never()).save(any(ReviewAdminResponse.class));
    }

    @Test
    void deletesExistingAdminResponse() {
        Review review = sampleReview();
        User admin = User.builder()
                .id(9)
                .email("admin@example.com")
                .role(Role.ADMIN)
                .build();
        ReviewAdminResponse existingResponse = ReviewAdminResponse.builder()
                .id(71)
                .review(review)
                .responder(admin)
                .content("Old response")
                .build();
        review.setAdminResponse(existingResponse);

        when(reviewRepository.findById(55)).thenReturn(Optional.of(review));

        reviewService.deleteReviewResponse(55);

        verify(reviewAdminResponseRepository).delete(existingResponse);
        assertNull(review.getAdminResponse());
    }

    @Test
    void reviewResponseIncludesRelatedStaffWhenBookingHasCheckinStaff() {
        Review review = sampleReview();
        review.getBooking().setCheckinStaff(Staff.builder()
                .id(17)
                .fullName("Tran Thi B")
                .build());

        ReviewResponse response = ReviewResponse.from(review);

        assertEquals(17, response.staffId());
        assertEquals("Tran Thi B", response.staffName());
    }

    private Review sampleReview() {
        Customer customer = Customer.builder()
                .id(5)
                .fullName("Nguyen Van A")
                .build();
        Room room = Room.builder()
                .id(8)
                .roomName("Deluxe Balcony 201")
                .build();
        Booking booking = Booking.builder()
                .id(13)
                .customer(customer)
                .room(room)
                .build();

        return Review.builder()
                .id(55)
                .booking(booking)
                .rating(5)
                .content("Great room")
                .approved(true)
                .build();
    }
}
