package backend.booking.adapter.out.persistence;

import backend.booking.application.model.PageResult;
import backend.booking.application.port.out.LoadBookingPort;
import backend.booking.application.port.out.LoadCustomerPort;
import backend.booking.application.port.out.LoadDiscountCodeForBookingPort;
import backend.booking.application.port.out.LoadReviewPort;
import backend.booking.application.port.out.LoadRoomPort;
import backend.booking.application.port.out.LoadUserPort;
import backend.booking.application.port.out.SaveBookingPort;
import backend.booking.application.port.out.SavePaymentTransactionPort;
import backend.booking.application.port.out.SearchBookingsForManagementPort;
import backend.booking.application.port.out.SearchCustomerBookingsPort;
import backend.booking.application.port.out.model.BookingManagementSearchCriteria;
import backend.booking.application.port.out.model.CustomerBookingHistoryCriteria;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.PaymentTransaction;
import backend.entity.Room;
import backend.entity.User;
import backend.repository.BookingRepository;
import backend.repository.CustomerRepository;
import backend.repository.DiscountCodeRepository;
import backend.repository.PaymentTransactionRepository;
import backend.repository.ReviewRepository;
import backend.repository.RoomRepository;
import backend.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class BookingPersistenceAdapter implements
        LoadRoomPort,
        LoadCustomerPort,
        LoadDiscountCodeForBookingPort,
        LoadUserPort,
        LoadBookingPort,
        LoadReviewPort,
        SaveBookingPort,
        SavePaymentTransactionPort,
        SearchCustomerBookingsPort,
        SearchBookingsForManagementPort {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final DiscountCodeRepository discountCodeRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Override
    public Optional<Room> loadRoom(Integer roomId) {
        return roomRepository.findById(roomId);
    }

    @Override
    public Optional<Room> loadRoomForUpdate(Integer roomId) {
        return roomRepository.findByIdForUpdate(roomId);
    }

    @Override
    public Optional<Customer> loadCustomerByAccountEmail(String email) {
        return customerRepository.findByAccount_Email(email);
    }

    @Override
    public Optional<backend.entity.DiscountCode> loadDiscountCodeForBooking(String code) {
        return discountCodeRepository.findByCodeIgnoreCase(code);
    }

    @Override
    public Optional<User> loadUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<Booking> loadBooking(Integer bookingId) {
        return bookingRepository.findById(bookingId);
    }

    @Override
    public List<Booking> loadBlockingBookings(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BookingStatus cancelledStatus
    ) {
        return bookingRepository.findBlockingBookings(roomId, startTime, endTime, cancelledStatus);
    }

    @Override
    public boolean existsReviewByBookingId(Integer bookingId) {
        return reviewRepository.existsByBooking_Id(bookingId);
    }

    @Override
    public Booking save(Booking booking) {
        return bookingRepository.save(booking);
    }

    @Override
    public Booking saveAndFlush(Booking booking) {
        return bookingRepository.saveAndFlush(booking);
    }

    @Override
    public PaymentTransaction savePaymentTransaction(PaymentTransaction transaction) {
        return paymentTransactionRepository.save(transaction);
    }

    @Override
    public PageResult<Booking> searchCustomerBookings(CustomerBookingHistoryCriteria criteria) {
        Specification<Booking> historySpecification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("customer").get("id"), criteria.customerId()));

            if (criteria.status() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), criteria.status()));
            }
            if (criteria.from() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startTime"), criteria.from()));
            }
            if (criteria.to() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startTime"), criteria.to()));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<Booking> bookingPage = bookingRepository.findAll(
                historySpecification,
                PageRequest.of(
                        criteria.page(),
                        criteria.size(),
                        Sort.by(Sort.Direction.fromString(criteria.direction()), criteria.sortBy())
                )
        );

        return new PageResult<>(
                bookingPage.getContent(),
                bookingPage.getNumber(),
                bookingPage.getSize(),
                bookingPage.getTotalElements(),
                bookingPage.getTotalPages(),
                bookingPage.isFirst(),
                bookingPage.isLast()
        );
    }

    @Override
    public List<Booking> loadBookingsForManagement(BookingManagementSearchCriteria criteria) {
        return bookingRepository.findAll(
                toManagementSpecification(criteria),
                Sort.by(Sort.Direction.fromString(criteria.direction()), criteria.sortBy())
        );
    }

    @Override
    public PageResult<Booking> searchBookingsForManagement(BookingManagementSearchCriteria criteria) {
        Page<Booking> bookingPage = bookingRepository.findAll(
                toManagementSpecification(criteria),
                PageRequest.of(
                        criteria.page(),
                        criteria.size(),
                        Sort.by(Sort.Direction.fromString(criteria.direction()), criteria.sortBy())
                )
        );

        return new PageResult<>(
                bookingPage.getContent(),
                bookingPage.getNumber(),
                bookingPage.getSize(),
                bookingPage.getTotalElements(),
                bookingPage.getTotalPages(),
                bookingPage.isFirst(),
                bookingPage.isLast()
        );
    }

    private Specification<Booking> toManagementSpecification(BookingManagementSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.status() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), criteria.status()));
            }
            if (criteria.roomId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("room").get("id"), criteria.roomId()));
            }
            if (criteria.from() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startTime"), criteria.from()));
            }
            if (criteria.to() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startTime"), criteria.to()));
            }
            if (criteria.search() != null) {
                String pattern = "%" + escapeLikePattern(criteria.search().toLowerCase()) + "%";
                Join<Object, Object> customer = root.join("customer", JoinType.LEFT);
                Join<Object, Object> room = root.join("room", JoinType.LEFT);

                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(customer.get("fullName")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(customer.get("email")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(room.get("roomName")), pattern, '\\')
                ));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private String escapeLikePattern(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
