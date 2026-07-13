package backend.booking.application.service;

import backend.booking.application.model.PageResult;
import backend.booking.application.port.in.command.CreateBookingCommand;
import backend.booking.application.port.in.command.CancelCustomerBookingCommand;
import backend.booking.application.port.in.command.UpdateBookingStatusCommand;
import backend.booking.application.port.in.query.CustomerBookingHistoryQuery;
import backend.booking.application.port.in.query.GetCustomerBookingDetailQuery;
import backend.booking.application.port.in.query.GetRoomAvailabilityQuery;
import backend.booking.application.port.out.LoadBookingPort;
import backend.booking.application.port.out.LoadCustomerPort;
import backend.booking.application.port.out.LoadDiscountCodeForBookingPort;
import backend.booking.application.port.out.LoadReviewPort;
import backend.booking.application.port.out.LoadRoomPort;
import backend.booking.application.port.out.LoadStaffForBookingPort;
import backend.booking.application.port.out.LoadSuccessfulPaymentAmountPort;
import backend.booking.application.port.out.LoadUserPort;
import backend.booking.application.port.out.SaveBookingPort;
import backend.booking.application.port.out.SearchBookingsForManagementPort;
import backend.booking.application.port.out.SearchCustomerBookingsPort;
import backend.booking.application.port.in.query.ListBookingsForManagementQuery;
import backend.booking.application.port.out.model.BookingManagementSearchCriteria;
import backend.booking.application.policy.BookingStatusTransitionPolicy;
import backend.coupon.domain.model.CouponValidationResult;
import backend.coupon.domain.model.DiscountType;
import backend.coupon.domain.port.in.ValidateCouponUseCase;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.dto.response.PagedResponse;
import backend.dto.response.RoomAvailabilityResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.PaymentMethod;
import backend.entity.Role;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.entity.Staff;
import backend.entity.User;
import backend.exception.BookingConflictException;
import backend.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingUseCaseServiceTest {

    @Mock
    private LoadRoomPort loadRoomPort;

    @Mock
    private LoadCustomerPort loadCustomerPort;

    @Mock
    private LoadDiscountCodeForBookingPort loadDiscountCodeForBookingPort;

    @Mock
    private LoadUserPort loadUserPort;

    @Mock
    private LoadBookingPort loadBookingPort;

    @Mock
    private SaveBookingPort saveBookingPort;

    @Mock
    private SearchCustomerBookingsPort searchCustomerBookingsPort;

    @Mock
    private SearchBookingsForManagementPort searchBookingsForManagementPort;

    @Mock
    private LoadReviewPort loadReviewPort;

    @Mock
    private LoadStaffForBookingPort loadStaffForBookingPort;

    @Mock
    private LoadSuccessfulPaymentAmountPort loadSuccessfulPaymentAmountPort;

    @Mock
    private BookingCancellationNotificationService bookingCancellationNotificationService;

    @Mock
    private ValidateCouponUseCase validateCouponUseCase;

    private BookingUseCaseService bookingUseCaseService;

    private final Clock clock = Clock.fixed(
            Instant.parse("2026-01-01T03:00:00Z"),
            ZoneId.of("Asia/Ho_Chi_Minh")
    );

    @BeforeEach
    void setUp() {
        bookingUseCaseService = new BookingUseCaseService(
                loadRoomPort,
                loadCustomerPort,
                loadDiscountCodeForBookingPort,
                loadUserPort,
                loadBookingPort,
                saveBookingPort,
                searchCustomerBookingsPort,
                searchBookingsForManagementPort,
                loadReviewPort,
                loadStaffForBookingPort,
                loadSuccessfulPaymentAmountPort,
                bookingCancellationNotificationService,
                validateCouponUseCase,
                new BookingStatusTransitionPolicy(),
                clock
        );
    }

    @Test
    void rejectsSkippingFromPaidDirectlyToCompleted() {
        User staffUser = User.builder().id(3).email("staff@example.com").role(Role.STAFF).build();
        Booking booking = bookingAt(
                LocalDateTime.of(2026, 1, 1, 10, 0),
                LocalDateTime.of(2026, 1, 1, 12, 0)
        );
        booking.setId(12);

        when(loadUserPort.loadUserByEmail(staffUser.getEmail())).thenReturn(Optional.of(staffUser));
        when(loadBookingPort.loadBooking(12)).thenReturn(Optional.of(booking));

        assertThrows(IllegalStateException.class, () -> bookingUseCaseService.updateBookingStatus(
                new UpdateBookingStatusCommand(12, BookingStatus.COMPLETED, staffUser.getEmail())
        ));
        verify(saveBookingPort, never()).save(any());
    }

    @Test
    void rejectsManualPaymentConfirmationForOnlinePendingBooking() {
        User admin = User.builder().id(1).email("admin@example.com").role(Role.ADMIN).build();
        Booking booking = bookingAt(
                LocalDateTime.of(2026, 1, 2, 10, 0),
                LocalDateTime.of(2026, 1, 2, 12, 0)
        );
        booking.setId(13);
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setPaymentMethod(PaymentMethod.ONLINE);

        when(loadUserPort.loadUserByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(loadBookingPort.loadBooking(13)).thenReturn(Optional.of(booking));

        assertThrows(IllegalStateException.class, () -> bookingUseCaseService.updateBookingStatus(
                new UpdateBookingStatusCommand(13, BookingStatus.PAID, admin.getEmail())
        ));
        verify(saveBookingPort, never()).save(any());
    }

    @Test
    void allowsCashPaymentConfirmationForPendingBooking() {
        User admin = User.builder().id(1).email("admin@example.com").role(Role.ADMIN).build();
        Booking booking = bookingAt(
                LocalDateTime.of(2026, 1, 2, 10, 0),
                LocalDateTime.of(2026, 1, 2, 12, 0)
        );
        booking.setId(14);
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setPaymentMethod(PaymentMethod.CASH);

        when(loadUserPort.loadUserByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(loadBookingPort.loadBooking(14)).thenReturn(Optional.of(booking));
        when(saveBookingPort.save(booking)).thenReturn(booking);

        BookingResponse response = bookingUseCaseService.updateBookingStatus(
                new UpdateBookingStatusCommand(14, BookingStatus.PAID, admin.getEmail())
        );

        assertEquals(BookingStatus.PAID, response.getStatus());
    }

    @Test
    void recordsActualCheckInTimeAndStaff() {
        User staffUser = User.builder().id(3).email("staff@example.com").role(Role.STAFF).build();
        Staff staff = Staff.builder().id(8).account(staffUser).fullName("Nhan vien A").build();
        Booking booking = bookingAt(
                LocalDateTime.of(2026, 1, 1, 10, 15),
                LocalDateTime.of(2026, 1, 1, 12, 0)
        );
        booking.setId(15);

        when(loadUserPort.loadUserByEmail(staffUser.getEmail())).thenReturn(Optional.of(staffUser));
        when(loadBookingPort.loadBooking(15)).thenReturn(Optional.of(booking));
        when(loadStaffForBookingPort.loadStaffByAccountEmail(staffUser.getEmail())).thenReturn(Optional.of(staff));
        when(saveBookingPort.save(booking)).thenReturn(booking);

        BookingResponse response = bookingUseCaseService.updateBookingStatus(
                new UpdateBookingStatusCommand(15, BookingStatus.CHECKED_IN, staffUser.getEmail())
        );

        assertEquals(BookingStatus.CHECKED_IN, response.getStatus());
        assertEquals(LocalDateTime.of(2026, 1, 1, 10, 0), response.getCheckinTime());
        assertEquals(8, response.getCheckinStaffId());
    }

    @Test
    void refundsOnlyCollectedAmountForDepositCancellation() {
        User account = User.builder().id(7).email("customer@example.com").role(Role.CUSTOMER).build();
        Customer customer = Customer.builder().id(7).account(account).build();
        Booking booking = bookingAt(
                LocalDateTime.of(2026, 1, 3, 10, 0),
                LocalDateTime.of(2026, 1, 3, 12, 0)
        );
        booking.setId(16);
        booking.setCustomer(customer);
        booking.setStatus(BookingStatus.DEPOSIT_PAID);
        booking.setPaymentMethod(PaymentMethod.ONLINE);
        booking.setTotalAmount(new BigDecimal("300000.00"));

        when(loadCustomerPort.loadCustomerByAccountEmail(account.getEmail())).thenReturn(Optional.of(customer));
        when(loadBookingPort.loadBooking(16)).thenReturn(Optional.of(booking));
        when(loadSuccessfulPaymentAmountPort.loadSuccessfulPaymentAmount(16))
                .thenReturn(new BigDecimal("50000.00"));
        when(saveBookingPort.save(booking)).thenReturn(booking);

        var response = bookingUseCaseService.cancelCustomerBooking(
                new CancelCustomerBookingCommand(16, "Thay doi ke hoach", account.getEmail())
        );

        assertEquals(BookingStatus.CANCELLED, response.booking().getStatus());
        assertEquals(new BigDecimal("50000.00"), response.refundAmount());
    }

    @Test
    void returnsContinuousAvailableSlotsAroundBookings() {
        LocalDateTime from = LocalDateTime.of(2030, 1, 10, 9, 0);
        LocalDateTime to = LocalDateTime.of(2030, 1, 10, 17, 0);
        Room room = availableRoom();

        Booking first = bookingAt(
                LocalDateTime.of(2030, 1, 10, 10, 0),
                LocalDateTime.of(2030, 1, 10, 12, 0)
        );
        Booking overlapping = bookingAt(
                LocalDateTime.of(2030, 1, 10, 11, 0),
                LocalDateTime.of(2030, 1, 10, 13, 0)
        );
        Booking last = bookingAt(
                LocalDateTime.of(2030, 1, 10, 15, 0),
                LocalDateTime.of(2030, 1, 10, 16, 0)
        );

        when(loadRoomPort.loadRoom(1)).thenReturn(Optional.of(room));
        when(loadBookingPort.loadBlockingBookings(
                eq(1),
                eq(from),
                eq(to),
                eq(BookingStatus.CANCELLED)
        )).thenReturn(List.of(first, overlapping, last));

        RoomAvailabilityResponse response = bookingUseCaseService.getAvailableSlots(
                new GetRoomAvailabilityQuery(1, from, to)
        );

        assertEquals(3, response.availableSlots().size());
        assertEquals(from, response.availableSlots().get(0).startTime());
        assertEquals(first.getStartTime(), response.availableSlots().get(0).endTime());
        assertEquals(overlapping.getEndTime(), response.availableSlots().get(1).startTime());
        assertEquals(last.getStartTime(), response.availableSlots().get(1).endTime());
        assertEquals(last.getEndTime(), response.availableSlots().get(2).startTime());
        assertEquals(to, response.availableSlots().get(2).endTime());
    }

    @Test
    void rejectsBookingWhenRequestedTimeOverlaps() {
        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endTime = startTime.plusHours(2);
        Room room = availableRoom();
        User account = User.builder().id(7).email("customer@example.com").build();
        Customer customer = Customer.builder().id(7).account(account).build();

        when(loadCustomerPort.loadCustomerByAccountEmail(account.getEmail())).thenReturn(Optional.of(customer));
        when(loadRoomPort.loadRoomForUpdate(1)).thenReturn(Optional.of(room));
        when(loadBookingPort.loadBlockingBookings(
                eq(1),
                eq(startTime),
                eq(endTime),
                eq(BookingStatus.CANCELLED)
        )).thenReturn(List.of(bookingAt(startTime.plusMinutes(30), endTime.plusHours(1))));

        CreateBookingCommand command = new CreateBookingCommand(
                1,
                startTime,
                endTime,
                PaymentMethod.CASH,
                null,
                null,
                account.getEmail()
        );

        assertThrows(
                BookingConflictException.class,
                () -> bookingUseCaseService.createBooking(command)
        );
        verify(saveBookingPort, never()).saveAndFlush(any(Booking.class));
    }

    @Test
    void calculatesCostWithValidatedCoupon() {
        LocalDateTime startTime = LocalDateTime.of(2030, 1, 10, 10, 0);
        LocalDateTime endTime = startTime.plusHours(2);
        Room room = availableRoom();

        when(loadRoomPort.loadRoom(1)).thenReturn(Optional.of(room));
        when(validateCouponUseCase.validate(any())).thenReturn(new CouponValidationResult(
                true,
                "Coupon hop le",
                "SUMMER25",
                DiscountType.PERCENTAGE,
                new BigDecimal("25.00"),
                BigDecimal.ZERO.setScale(2),
                new BigDecimal("300000.00"),
                new BigDecimal("75000.00"),
                new BigDecimal("225000.00")
        ));

        BookingCostResponse response = bookingUseCaseService.calculateCost(
                new backend.booking.application.port.in.command.CalculateBookingCostCommand(
                        1,
                        startTime,
                        endTime,
                        "SUMMER25"
                )
        );

        assertEquals(new BigDecimal("300000.00"), response.getOriginalAmount());
        assertEquals("SUMMER25", response.getCouponCode());
        assertEquals(new BigDecimal("75000.00"), response.getDiscountAmount());
        assertEquals(new BigDecimal("225000.00"), response.getTotalAmount());
    }

    @Test
    void allowsBookingThatStartsWhenPreviousBookingEnds() {
        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endTime = startTime.plusHours(2);
        Room room = availableRoom();
        User account = User.builder().id(7).email("customer@example.com").build();
        Customer customer = Customer.builder().id(7).account(account).build();

        when(loadCustomerPort.loadCustomerByAccountEmail(account.getEmail())).thenReturn(Optional.of(customer));
        when(loadRoomPort.loadRoomForUpdate(1)).thenReturn(Optional.of(room));
        when(loadBookingPort.loadBlockingBookings(
                eq(1),
                eq(startTime),
                eq(endTime),
                eq(BookingStatus.CANCELLED)
        )).thenReturn(List.of());
        when(saveBookingPort.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> {
            Booking saved = invocation.getArgument(0);
            saved.setId(99);
            return saved;
        });

        CreateBookingCommand command = new CreateBookingCommand(
                1,
                startTime,
                endTime,
                PaymentMethod.CASH,
                null,
                null,
                account.getEmail()
        );

        assertEquals(
                99,
                bookingUseCaseService.createBooking(command).getBookingId()
        );
    }

    @Test
    void includesReviewFlagsInCustomerBookingHistory() {
        LocalDateTime startTime = LocalDateTime.of(2030, 1, 10, 10, 0);
        LocalDateTime endTime = startTime.plusHours(2);
        User account = User.builder().id(7).email("customer@example.com").build();
        Customer customer = Customer.builder().id(7).account(account).build();
        Booking completedBooking = bookingAt(startTime, endTime);
        completedBooking.setId(12);
        completedBooking.setStatus(BookingStatus.COMPLETED);

        when(loadCustomerPort.loadCustomerByAccountEmail(account.getEmail())).thenReturn(Optional.of(customer));
        when(searchCustomerBookingsPort.searchCustomerBookings(any())).thenReturn(
                new PageResult<>(List.of(completedBooking), 0, 10, 1, 1, true, true)
        );
        when(loadReviewPort.existsReviewByBookingId(12)).thenReturn(true);

        PagedResponse<BookingResponse> response = bookingUseCaseService.getCustomerBookingHistory(
                new CustomerBookingHistoryQuery(account.getEmail(), null, null, null, 0, 10, "createdAt", "desc")
        );

        assertEquals(1, response.content().size());
        assertEquals(Boolean.TRUE, response.content().get(0).getAlreadyReviewed());
        assertEquals(Boolean.FALSE, response.content().get(0).getCanReview());
    }

    @Test
    void rejectsCustomerBookingDetailForAnotherCustomer() {
        User ownerAccount = User.builder().id(7).email("customer@example.com").build();
        Customer currentCustomer = Customer.builder().id(7).account(ownerAccount).build();
        Customer otherCustomer = Customer.builder()
                .id(8)
                .account(User.builder().id(8).email("other@example.com").build())
                .build();
        Booking booking = bookingAt(
                LocalDateTime.of(2030, 1, 10, 10, 0),
                LocalDateTime.of(2030, 1, 10, 12, 0)
        );
        booking.setId(12);
        booking.setCustomer(otherCustomer);

        when(loadCustomerPort.loadCustomerByAccountEmail(ownerAccount.getEmail())).thenReturn(Optional.of(currentCustomer));
        when(loadBookingPort.loadBooking(12)).thenReturn(Optional.of(booking));

        assertThrows(
                ForbiddenException.class,
                () -> bookingUseCaseService.getCustomerBookingDetail(
                        new GetCustomerBookingDetailQuery(12, ownerAccount.getEmail())
                )
        );
    }

    @Test
    void adminBookingListPassesNormalizedCriteriaToSearchPort() {
        User admin = User.builder().id(1).email("admin@example.com").role(Role.ADMIN).build();
        when(loadUserPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(searchBookingsForManagementPort.loadBookingsForManagement(any())).thenReturn(List.of());

        bookingUseCaseService.getAllBookings(new ListBookingsForManagementQuery(
                BookingStatus.PAID,
                3,
                "  an@example.com  ",
                null,
                null,
                null,
                null,
                null,
                null,
                "admin@example.com"
        ));

        ArgumentCaptor<BookingManagementSearchCriteria> criteriaCaptor =
                ArgumentCaptor.forClass(BookingManagementSearchCriteria.class);
        verify(searchBookingsForManagementPort).loadBookingsForManagement(criteriaCaptor.capture());
        assertEquals(BookingStatus.PAID, criteriaCaptor.getValue().status());
        assertEquals(3, criteriaCaptor.getValue().roomId());
        assertEquals("an@example.com", criteriaCaptor.getValue().search());
        assertEquals("createdAt", criteriaCaptor.getValue().sortBy());
        assertEquals("DESC", criteriaCaptor.getValue().direction());
    }

    @Test
    void adminBookingPageRejectsInvalidPaginationAndSort() {
        User admin = User.builder().id(1).email("admin@example.com").role(Role.ADMIN).build();
        when(loadUserPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        assertThrows(IllegalArgumentException.class, () -> bookingUseCaseService.getBookingsPage(
                new ListBookingsForManagementQuery(
                        null, null, null, null, null, -1, 10, null, null, "admin@example.com"
                )
        ));
        assertThrows(IllegalArgumentException.class, () -> bookingUseCaseService.getBookingsPage(
                new ListBookingsForManagementQuery(
                        null, null, null, null, null, 0, 101, null, null, "admin@example.com"
                )
        ));
        assertThrows(IllegalArgumentException.class, () -> bookingUseCaseService.getBookingsPage(
                new ListBookingsForManagementQuery(
                        null, null, null, null, null, 0, 10, "hackedColumn", null, "admin@example.com"
                )
        ));
        verify(searchBookingsForManagementPort, never()).searchBookingsForManagement(any());
    }

    @Test
    void adminBookingListRejectsCustomerActor() {
        User customer = User.builder().id(2).email("customer@example.com").role(Role.CUSTOMER).build();
        when(loadUserPort.loadUserByEmail("customer@example.com")).thenReturn(Optional.of(customer));

        assertThrows(ForbiddenException.class, () -> bookingUseCaseService.getAllBookings(
                new ListBookingsForManagementQuery(null, "customer@example.com")
        ));
        verify(searchBookingsForManagementPort, never()).loadBookingsForManagement(any());
    }

    private Room availableRoom() {
        RoomType roomType = RoomType.builder()
                .id(2)
                .typeName("Standard")
                .pricePerHour(new BigDecimal("150000"))
                .build();

        return Room.builder()
                .id(1)
                .roomName("Room A")
                .roomType(roomType)
                .status(RoomStatus.AVAILABLE)
                .build();
    }

    private Booking bookingAt(LocalDateTime startTime, LocalDateTime endTime) {
        return Booking.builder()
                .startTime(startTime)
                .endTime(endTime)
                .status(BookingStatus.PAID)
                .build();
    }
}
