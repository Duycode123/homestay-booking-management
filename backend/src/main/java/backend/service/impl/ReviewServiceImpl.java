package backend.service.impl;

import backend.dto.request.CreateReviewRequest;
import backend.dto.request.UpsertReviewResponseRequest;
import backend.dto.request.UpdateReviewApprovalRequest;
import backend.dto.response.PagedResponse;
import backend.dto.response.ReviewEligibilityResponse;
import backend.dto.response.ReviewResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.Review;
import backend.entity.ReviewAdminResponse;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.repository.BookingRepository;
import backend.repository.CustomerRepository;
import backend.repository.ReviewAdminResponseRepository;
import backend.repository.ReviewRepository;
import backend.repository.UserRepository;
import backend.service.ReviewService;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewAdminResponseRepository reviewAdminResponseRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request, String customerEmail) {
        Customer customer = findCustomer(customerEmail);
        Booking booking = findBooking(request.getBookingId());

        validateBookingBelongsToCustomer(booking, customer);
        validateBookingCanBeReviewed(booking);

        if (reviewRepository.existsByBooking_Id(booking.getId())) {
            throw new IllegalStateException("Don dat phong nay da duoc danh gia");
        }

        Review review = Review.builder()
                .booking(booking)
                .rating(request.getRating())
                .content(request.getContent().trim())
                .approved(true)
                .build();

        try {
            return ReviewResponse.from(reviewRepository.saveAndFlush(review));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Don dat phong nay da duoc danh gia");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getMyReviews(String customerEmail, int page, int size) {
        Customer customer = findCustomer(customerEmail);

        Specification<Review> specification = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("booking").get("customer").get("id"), customer.getId());

        Page<ReviewResponse> reviewPage = reviewRepository.findAll(
                        specification,
                        PageRequest.of(validatePage(page), validateSize(size), Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(ReviewResponse::from);

        return PagedResponse.from(reviewPage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse checkReviewEligibility(Integer bookingId, String customerEmail) {
        Customer customer = findCustomer(customerEmail);
        Booking booking = findBooking(bookingId);

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            return new ReviewEligibilityResponse(bookingId, false, false, "Ban chi duoc danh gia don dat phong cua minh");
        }

        boolean alreadyReviewed = reviewRepository.existsByBooking_Id(bookingId);
        if (alreadyReviewed) {
            return new ReviewEligibilityResponse(bookingId, false, true, "Don dat phong nay da duoc danh gia");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            return new ReviewEligibilityResponse(bookingId, false, false, "Chi co the danh gia sau khi don dat phong da hoan tat");
        }

        return new ReviewEligibilityResponse(bookingId, true, false, "Co the danh gia don dat phong nay");
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getPublicReviews(Integer roomId, Integer rating, int page, int size) {
        Specification<Review> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isTrue(root.get("approved")));

            if (roomId != null) {
                predicates.add(criteriaBuilder.equal(root.get("booking").get("room").get("id"), roomId));
            }
            if (rating != null) {
                validateRating(rating);
                predicates.add(criteriaBuilder.equal(root.get("rating"), rating));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<ReviewResponse> reviewPage = reviewRepository.findAll(
                        specification,
                        PageRequest.of(validatePage(page), validateSize(size), Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(ReviewResponse::from);

        return PagedResponse.from(reviewPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getReviewsForAdmin(
            Integer roomId,
            Integer staffId,
            Boolean approved,
            Integer rating,
            String keyword,
            int page,
            int size
    ) {
        Specification<Review> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            var bookingJoin = root.join("booking");
            var staffJoin = bookingJoin.join("checkinStaff", JoinType.LEFT);

            if (roomId != null) {
                predicates.add(criteriaBuilder.equal(bookingJoin.get("room").get("id"), roomId));
            }
            if (staffId != null) {
                predicates.add(criteriaBuilder.equal(staffJoin.get("id"), staffId));
            }
            if (approved != null) {
                predicates.add(criteriaBuilder.equal(root.get("approved"), approved));
            }
            if (rating != null) {
                validateRating(rating);
                predicates.add(criteriaBuilder.equal(root.get("rating"), rating));
            }
            if (keyword != null && !keyword.isBlank()) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("content")), normalizedKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(bookingJoin.get("customer").get("fullName")), normalizedKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(bookingJoin.get("room").get("roomName")), normalizedKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(staffJoin.get("fullName")), normalizedKeyword)
                ));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<ReviewResponse> reviewPage = reviewRepository.findAll(
                        specification,
                        PageRequest.of(validatePage(page), validateSize(size), Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(ReviewResponse::from);

        return PagedResponse.from(reviewPage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewDetailForAdmin(Integer reviewId) {
        return ReviewResponse.from(findReview(reviewId));
    }

    @Override
    @Transactional
    public ReviewResponse updateReviewApproval(Integer reviewId, UpdateReviewApprovalRequest request) {
        Review review = findReview(reviewId);
        review.setApproved(request.getApproved());

        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public ReviewResponse upsertReviewResponse(Integer reviewId, UpsertReviewResponseRequest request, String responderEmail) {
        Review review = findReview(reviewId);
        User responder = findResponder(responderEmail);
        validateResponderCanRespond(responder);

        ReviewAdminResponse adminResponse = review.getAdminResponse();
        if (adminResponse == null) {
            adminResponse = ReviewAdminResponse.builder()
                    .review(review)
                    .responder(responder)
                    .content(request.getContent().trim())
                    .build();
        } else {
            adminResponse.setResponder(responder);
            adminResponse.setContent(request.getContent().trim());
        }

        ReviewAdminResponse savedResponse = reviewAdminResponseRepository.save(adminResponse);
        review.setAdminResponse(savedResponse);

        return ReviewResponse.from(review);
    }

    @Override
    @Transactional
    public void deleteReviewResponse(Integer reviewId) {
        Review review = findReview(reviewId);
        ReviewAdminResponse adminResponse = review.getAdminResponse();
        if (adminResponse == null) {
            throw new ResourceNotFoundException("Khong tim thay phan hoi cho danh gia nay");
        }

        review.setAdminResponse(null);
        reviewAdminResponseRepository.delete(adminResponse);
    }

    @Override
    @Transactional
    public void deleteReview(Integer reviewId) {
        Review review = findReview(reviewId);
        reviewRepository.delete(review);
    }

    private Customer findCustomer(String email) {
        return customerRepository.findByAccount_Email(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));
    }

    private Booking findBooking(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));
    }

    private Review findReview(Integer reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay danh gia"));
    }

    private User findResponder(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tai khoan phan hoi"));
    }

    private void validateBookingBelongsToCustomer(Booking booking, Customer customer) {
        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new ForbiddenException("Ban chi duoc danh gia don dat phong cua minh");
        }
    }

    private void validateResponderCanRespond(User responder) {
        if (responder.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Chi admin moi duoc phan hoi danh gia");
        }
    }

    private void validateBookingCanBeReviewed(Booking booking) {
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalStateException("Chi co the danh gia sau khi don dat phong da hoan tat");
        }
    }

    private int validatePage(int page) {
        if (page < 0) {
            throw new IllegalArgumentException("Trang khong duoc nho hon 0");
        }
        return page;
    }

    private int validateSize(int size) {
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Kich thuoc trang phai tu 1 den 100");
        }
        return size;
    }

    private void validateRating(Integer rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Diem danh gia phai tu 1 den 5");
        }
    }
}
