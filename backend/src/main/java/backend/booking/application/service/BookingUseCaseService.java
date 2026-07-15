package backend.booking.application.service;

import backend.booking.application.model.PageResult;
import backend.booking.application.policy.BookingStatusTransitionPolicy;
import backend.booking.application.port.in.CalculateBookingCostUseCase;
import backend.booking.application.port.in.CancelBookingForManagementUseCase;
import backend.booking.application.port.in.CancelCustomerBookingUseCase;
import backend.booking.application.port.in.CreateBookingUseCase;
import backend.booking.application.port.in.GetCustomerBookingDetailUseCase;
import backend.booking.application.port.in.GetBookingManagementDetailUseCase;
import backend.booking.application.port.in.GetCustomerBookingHistoryUseCase;
import backend.booking.application.port.in.GetRoomAvailabilityUseCase;
import backend.booking.application.port.in.ListBookingsForManagementUseCase;
import backend.booking.application.port.in.SettleBookingAtCheckoutUseCase;
import backend.booking.application.port.in.UpdateBookingStatusUseCase;
import backend.booking.application.port.in.ReviewCustomerCancellationUseCase;
import backend.booking.application.port.in.command.CalculateBookingCostCommand;
import backend.booking.application.port.in.command.CancelBookingForManagementCommand;
import backend.booking.application.port.in.command.CancelCustomerBookingCommand;
import backend.booking.application.port.in.command.CreateBookingCommand;
import backend.booking.application.port.in.command.SettleBookingAtCheckoutCommand;
import backend.booking.application.port.in.command.UpdateBookingStatusCommand;
import backend.booking.application.port.in.command.ReviewCustomerCancellationCommand;
import backend.booking.application.port.in.query.CustomerBookingHistoryQuery;
import backend.booking.application.port.in.query.GetCustomerBookingDetailQuery;
import backend.booking.application.port.in.query.GetBookingManagementDetailQuery;
import backend.booking.application.port.in.query.GetRoomAvailabilityQuery;
import backend.booking.application.port.in.query.ListBookingsForManagementQuery;
import backend.booking.application.port.out.LoadBookingPort;
import backend.booking.application.port.out.CreatePendingRefundPort;
import backend.booking.application.port.out.LoadCustomerPort;
import backend.booking.application.port.out.LoadDiscountCodeForBookingPort;
import backend.booking.application.port.out.LoadReviewPort;
import backend.booking.application.port.out.LoadRoomPort;
import backend.booking.application.port.out.LoadStaffForBookingPort;
import backend.booking.application.port.out.LoadSuccessfulPaymentAmountPort;
import backend.booking.application.port.out.LoadUserPort;
import backend.booking.application.port.out.SaveBookingPort;
import backend.booking.application.port.out.SavePaymentTransactionPort;
import backend.booking.application.port.out.SearchBookingsForManagementPort;
import backend.booking.application.port.out.SearchCustomerBookingsPort;
import backend.booking.application.port.out.model.BookingManagementSearchCriteria;
import backend.booking.application.port.out.model.CustomerBookingHistoryCriteria;
import backend.coupon.domain.model.CouponValidationResult;
import backend.coupon.domain.port.in.ValidateCouponCommand;
import backend.coupon.domain.port.in.ValidateCouponUseCase;
import backend.dto.response.BookingCostResponse;
import backend.dto.response.BookingResponse;
import backend.dto.response.CustomerBookingCancellationResponse;
import backend.dto.response.PagedResponse;
import backend.dto.response.RoomAvailabilityResponse;
import backend.dto.response.TimeSlotResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.CancellationRequestStatus;
import backend.entity.DiscountCode;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.Staff;
import backend.entity.User;
import backend.exception.BookingConflictException;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingUseCaseService implements
        CalculateBookingCostUseCase,
        CreateBookingUseCase,
        GetCustomerBookingHistoryUseCase,
        GetCustomerBookingDetailUseCase,
        GetRoomAvailabilityUseCase,
        ListBookingsForManagementUseCase,
        GetBookingManagementDetailUseCase,
        UpdateBookingStatusUseCase,
        SettleBookingAtCheckoutUseCase,
        CancelBookingForManagementUseCase,
        CancelCustomerBookingUseCase,
        ReviewCustomerCancellationUseCase {

    private static final long CUSTOMER_CANCELLATION_DEADLINE_HOURS = 24;
    public static final int MINIMUM_BOOKING_HOURS = 8;
    private static final long MINIMUM_BOOKING_MINUTES = MINIMUM_BOOKING_HOURS * 60L;
    private static final int FULL_REFUND_PERCENTAGE = 100;
    private static final int MONEY_SCALE = 2;
    private static final BigDecimal ZERO_MONEY = BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    private static final Pattern BANK_CODE_PATTERN = Pattern.compile("^[A-Z0-9]{2,20}$");
    private static final Pattern ACCOUNT_NUMBER_PATTERN = Pattern.compile("^[0-9]{6,30}$");
    private static final Pattern ACCOUNT_HOLDER_PATTERN = Pattern.compile("^[\\p{L} .'-]{2,100}$");

    private final LoadRoomPort loadRoomPort;
    private final LoadCustomerPort loadCustomerPort;
    private final LoadDiscountCodeForBookingPort loadDiscountCodeForBookingPort;
    private final LoadUserPort loadUserPort;
    private final LoadBookingPort loadBookingPort;
    private final SaveBookingPort saveBookingPort;
    private final SearchCustomerBookingsPort searchCustomerBookingsPort;
    private final SearchBookingsForManagementPort searchBookingsForManagementPort;
    private final LoadReviewPort loadReviewPort;
    private final LoadStaffForBookingPort loadStaffForBookingPort;
    private final LoadSuccessfulPaymentAmountPort loadSuccessfulPaymentAmountPort;
    private final SavePaymentTransactionPort savePaymentTransactionPort;
    private final CreatePendingRefundPort createPendingRefundPort;
    private final BookingCancellationNotificationService bookingCancellationNotificationService;
    private final ValidateCouponUseCase validateCouponUseCase;
    private final BookingStatusTransitionPolicy bookingStatusTransitionPolicy;
    private final Clock clock;

    @Override
    public BookingCostResponse calculateCost(CalculateBookingCostCommand command) {
        validateCostRequest(command);

        Room room = loadRoomPort.loadRoom(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong homestay"));

        BigDecimal totalHours = calculateTotalHours(command.startTime(), command.endTime());
        BigDecimal pricePerHour = room.getRoomType().getPricePerHour();
        BigDecimal originalAmount = totalHours.multiply(pricePerHour);
        CostBreakdown costBreakdown = calculateCostBreakdown(command.couponCode(), originalAmount);

        return new BookingCostResponse(
                room.getId(),
                room.getRoomName(),
                room.getRoomType().getTypeName(),
                command.startTime(),
                command.endTime(),
                totalHours,
                pricePerHour,
                costBreakdown.originalAmount(),
                costBreakdown.couponCode(),
                costBreakdown.discountAmount(),
                costBreakdown.totalAmount()
        );
    }

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingCommand command) {
        validateCreateBookingRequest(command);

        Customer customer = loadCustomerPort.loadCustomerByAccountEmail(command.customerEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));

        Room room = loadRoomPort.loadRoomForUpdate(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong homestay"));

        if (room.getStatus() == RoomStatus.MAINTENANCE || room.getStatus() == RoomStatus.INACTIVE) {
            throw new BookingConflictException("Phong hien khong san sang de dat");
        }

        if (hasBlockingBooking(room.getId(), command.startTime(), command.endTime())) {
            throw new BookingConflictException("Phong da co lich trong khoang thoi gian nay");
        }

        BigDecimal totalHours = calculateTotalHours(command.startTime(), command.endTime());
        BigDecimal pricePerHour = room.getRoomType().getPricePerHour();
        BigDecimal originalAmount = totalHours.multiply(pricePerHour);
        CostBreakdown costBreakdown = calculateCostBreakdown(command.couponCode(), originalAmount);
        DiscountCode appliedDiscountCode = loadAppliedDiscountCode(costBreakdown.couponCode());

        Booking booking = Booking.builder()
                .customer(customer)
                .room(room)
                .discountCode(appliedDiscountCode)
                .startTime(command.startTime())
                .endTime(command.endTime())
                .paymentMethod(command.paymentMethod())
                .pricePerHour(pricePerHour)
                .totalAmount(costBreakdown.totalAmount())
                .status(BookingStatus.PENDING_PAYMENT)
                .note(command.note())
                .build();

        Booking savedBooking;
        try {
            savedBooking = saveBookingPort.saveAndFlush(booking);
        } catch (DataIntegrityViolationException exception) {
            throw new BookingConflictException(
                    "Phong vua duoc dat boi yeu cau khac trong cung khoang thoi gian",
                    exception
            );
        }

        return toBookingResponse(savedBooking);
    }

    @Override
    public PagedResponse<BookingResponse> getCustomerBookingHistory(CustomerBookingHistoryQuery query) {
        validateHistoryQuery(query);

        Customer customer = loadCustomerPort.loadCustomerByAccountEmail(query.customerEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));

        String sortProperty = resolveSortProperty(query.sortBy());
        String sortDirection = resolveSortDirection(query.direction());

        PageResult<Booking> bookingPage = searchCustomerBookingsPort.searchCustomerBookings(
                new CustomerBookingHistoryCriteria(
                        customer.getId(),
                        query.status(),
                        query.from(),
                        query.to(),
                        query.page(),
                        query.size(),
                        sortProperty,
                        sortDirection
                )
        );

        return PagedResponse.of(
                bookingPage.content().stream().map(this::toBookingResponse).toList(),
                bookingPage.page(),
                bookingPage.size(),
                bookingPage.totalElements(),
                bookingPage.totalPages(),
                bookingPage.first(),
                bookingPage.last()
        );
    }

    @Override
    public BookingResponse getCustomerBookingDetail(GetCustomerBookingDetailQuery query) {
        if (query.bookingId() == null) {
            throw new IllegalArgumentException("bookingId khong duoc de trong");
        }

        Customer customer = loadCustomerPort.loadCustomerByAccountEmail(query.customerEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));

        Booking booking = loadBookingPort.loadBooking(query.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        if (booking.getCustomer() == null || !booking.getCustomer().getId().equals(customer.getId())) {
            throw new ForbiddenException("Ban khong co quyen xem don dat phong nay");
        }

        return toBookingResponse(booking);
    }

    @Override
    public RoomAvailabilityResponse getAvailableSlots(GetRoomAvailabilityQuery query) {
        validateAvailabilityRange(query.roomId(), query.from(), query.to());

        Room room = loadRoomPort.loadRoom(query.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong homestay"));

        if (room.getStatus() == RoomStatus.MAINTENANCE || room.getStatus() == RoomStatus.INACTIVE) {
            return new RoomAvailabilityResponse(
                    room.getId(),
                    room.getRoomName(),
                    query.from(),
                    query.to(),
                    false,
                    List.of()
            );
        }

        List<Booking> blockingBookings = findBlockingBookings(query.roomId(), query.from(), query.to());
        List<TimeSlotResponse> availableSlots = calculateAvailableSlots(
                query.from(),
                query.to(),
                blockingBookings
        );

        return new RoomAvailabilityResponse(
                room.getId(),
                room.getRoomName(),
                query.from(),
                query.to(),
                true,
                availableSlots
        );
    }

    @Override
    public List<BookingResponse> getAllBookings(ListBookingsForManagementQuery query) {
        User currentUser = getCurrentUser(query.currentUserEmail());
        checkAdminOrStaff(currentUser);

        return searchBookingsForManagementPort
                .loadBookingsForManagement(toManagementCriteria(query, null, null)).stream()
                .map(this::toManagementBookingResponse)
                .toList();
    }

    @Override
    public PagedResponse<BookingResponse> getBookingsPage(ListBookingsForManagementQuery query) {
        User currentUser = getCurrentUser(query.currentUserEmail());
        checkAdminOrStaff(currentUser);

        int page = query.page() == null ? 0 : query.page();
        int size = query.size() == null ? 10 : query.size();

        if (page < 0) {
            throw new IllegalArgumentException("Trang khong duoc nho hon 0");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Kich thuoc trang phai tu 1 den 100");
        }

        PageResult<Booking> bookingPage = searchBookingsForManagementPort.searchBookingsForManagement(
                toManagementCriteria(query, page, size)
        );

        return PagedResponse.of(
                bookingPage.content().stream().map(this::toManagementBookingResponse).toList(),
                bookingPage.page(),
                bookingPage.size(),
                bookingPage.totalElements(),
                bookingPage.totalPages(),
                bookingPage.first(),
                bookingPage.last()
        );
    }

    private BookingManagementSearchCriteria toManagementCriteria(
            ListBookingsForManagementQuery query,
            Integer page,
            Integer size
    ) {
        if (query.from() != null && query.to() != null && query.from().isAfter(query.to())) {
            throw new IllegalArgumentException("Thoi gian bat dau khong duoc sau thoi gian ket thuc");
        }

        String sortProperty = query.sortBy() == null ? "createdAt" : resolveSortProperty(query.sortBy());
        String sortDirection = query.direction() == null ? "DESC" : resolveSortDirection(query.direction());

        String search = query.search() == null || query.search().trim().isBlank()
                ? null
                : query.search().trim();

        return new BookingManagementSearchCriteria(
                query.status(),
                query.roomId(),
                search,
                query.from(),
                query.to(),
                page,
                size,
                sortProperty,
                sortDirection
        );
    }

    @Override
    public BookingResponse getBookingDetail(GetBookingManagementDetailQuery query) {
        User currentUser = getCurrentUser(query.currentUserEmail());
        checkAdminOrStaff(currentUser);

        Booking booking = loadBookingPort.loadBooking(query.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        return toManagementBookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(UpdateBookingStatusCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        checkAdminOrStaff(currentUser);

        if (command.status() == null) {
            throw new IllegalArgumentException("Trang thai don khong duoc de trong");
        }

        Booking booking = loadBookingPort.loadBooking(command.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        LocalDateTime now = LocalDateTime.now(clock);
        bookingStatusTransitionPolicy.validateManagementTransition(booking, command.status(), now);

        if (booking.getStatus() == command.status()) {
            return toManagementBookingResponse(booking);
        }

        if (command.status() == BookingStatus.COMPLETED) {
            ensureBookingFullyPaid(booking);
        }

        if (command.status() == BookingStatus.CHECKED_IN) {
            attachCheckInStaff(booking, currentUser, command.currentUserEmail());
            booking.setCheckinTime(now);
        } else if (command.status() == BookingStatus.COMPLETED) {
            if (booking.getCheckinTime() == null) {
                booking.setCheckinTime(booking.getStartTime() != null && booking.getStartTime().isBefore(now)
                        ? booking.getStartTime()
                        : now);
            }
            booking.setCheckoutTime(now);
        }

        booking.setStatus(command.status());

        Booking savedBooking = saveBookingPort.save(booking);

        return toManagementBookingResponse(savedBooking);
    }

    @Override
    @Transactional
    public BookingResponse settleBookingAtCheckout(SettleBookingAtCheckoutCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        checkAdminOrStaff(currentUser);

        Booking booking = loadBookingPort.loadBookingForUpdate(command.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalStateException("Chi co the ket toan booking dang check-in");
        }
        if (command.method() == null) {
            throw new IllegalArgumentException("Phuong thuc thanh toan khong duoc de trong");
        }

        BigDecimal paidAmount = loadPaidAmount(booking);
        BigDecimal totalAmount = normalizeMoney(booking.getTotalAmount());
        BigDecimal remainingAmount = totalAmount.subtract(paidAmount).max(ZERO_MONEY);
        if (remainingAmount.signum() <= 0) {
            throw new IllegalStateException("Booking da duoc thanh toan day du");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        PaymentTransaction settlement = PaymentTransaction.builder()
                .booking(booking)
                .processedBy(currentUser)
                .provider(PaymentProvider.COUNTER)
                .transactionReference("CHECKOUT-" + booking.getId() + "-"
                        + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase())
                .amount(remainingAmount)
                .status(PaymentTransactionStatus.SUCCEEDED)
                .responseCode("BALANCE_CASH_SETTLED")
                .paidAt(now)
                .build();

        savePaymentTransactionPort.savePaymentTransaction(settlement);
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCheckoutTime(now);
        Booking savedBooking = saveBookingPort.save(booking);

        return new BookingResponse(savedBooking, totalAmount);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(CancelBookingForManagementCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        checkAdminOrStaff(currentUser);

        Booking booking = loadBookingPort.loadBooking(command.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        bookingStatusTransitionPolicy.validateManagementCancellation(booking, command.reason());

        booking.setStatus(BookingStatus.CANCELLED);

        if (command.reason() != null && !command.reason().isBlank()) {
            String cancellationNote = "Ly do huy: " + command.reason().trim();
            booking.setNote(booking.getNote() == null || booking.getNote().isBlank()
                    ? cancellationNote
                    : booking.getNote() + System.lineSeparator() + cancellationNote);
        }

        Booking savedBooking = saveBookingPort.save(booking);

        return toManagementBookingResponse(savedBooking);
    }

    @Override
    @Transactional
    public CustomerBookingCancellationResponse cancelCustomerBooking(CancelCustomerBookingCommand command) {
        if (command.bookingId() == null) {
            throw new IllegalArgumentException("bookingId khong duoc de trong");
        }

        Customer customer = loadCustomerPort.loadCustomerByAccountEmail(command.customerEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));

        Booking booking = loadBookingPort.loadBookingForUpdate(command.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        if (booking.getCustomer() == null || !booking.getCustomer().getId().equals(customer.getId())) {
            throw new ForbiddenException("Ban khong co quyen huy don dat phong nay");
        }

        validateCustomerCancellationPolicy(booking);
        BigDecimal refundAmount = resolveRefundAmount(booking);
        RefundDestination refundDestination = validateRefundDestination(command);

        booking.setCancellationRequestStatus(CancellationRequestStatus.PENDING);
        booking.setCancellationReason(normalizeCancellationReason(command.reason()));
        booking.setCancellationRequestedAt(LocalDateTime.now(clock));
        booking.setCancellationReviewedAt(null);
        booking.setCancellationReviewedBy(null);
        booking.setCancellationAdminNote(null);
        booking.setRefundAmount(refundAmount);
        booking.setRefundPercentage(FULL_REFUND_PERCENTAGE);
        booking.setRefundMethod("Chuyen khoan ngan hang theo thong tin khach cung cap");
        booking.setExpectedRefundAt(null);
        booking.setRefundBankCode(refundDestination.bankCode());
        booking.setRefundBankName(refundDestination.bankName());
        booking.setRefundAccountNumber(refundDestination.accountNumber());
        booking.setRefundAccountHolder(refundDestination.accountHolder());

        Booking savedBooking = saveBookingPort.save(booking);

        return new CustomerBookingCancellationResponse(
                new BookingResponse(savedBooking, loadPaidAmount(savedBooking)),
                refundAmount,
                FULL_REFUND_PERCENTAGE,
                resolveRefundMethod(savedBooking),
                null
        );
    }

    @Override
    @Transactional
    public CustomerBookingCancellationResponse reviewCustomerCancellation(ReviewCustomerCancellationCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        if (!String.valueOf(currentUser.getRole()).trim().equals("ADMIN")) {
            throw new ForbiddenException("Chi admin co quyen duyet yeu cau huy phong");
        }

        Booking booking = loadBookingPort.loadBookingForUpdate(command.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        if (booking.getCancellationRequestStatus() != CancellationRequestStatus.PENDING) {
            throw new IllegalStateException("Yeu cau huy khong con o trang thai cho duyet");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        booking.setCancellationReviewedAt(now);
        booking.setCancellationReviewedBy(command.currentUserEmail());
        booking.setCancellationAdminNote(normalizeOptionalText(command.adminNote()));

        if (!command.approved()) {
            booking.setCancellationRequestStatus(CancellationRequestStatus.REJECTED);
            Booking rejectedBooking = saveBookingPort.save(booking);
            return new CustomerBookingCancellationResponse(
                    new BookingResponse(rejectedBooking, loadPaidAmount(rejectedBooking)),
                    rejectedBooking.getRefundAmount(),
                    rejectedBooking.getRefundPercentage(),
                    rejectedBooking.getRefundMethod(),
                    null
            );
        }

        if (booking.getStartTime() == null || !now.isBefore(booking.getStartTime())) {
            throw new IllegalStateException("Khong the duyet huy sau gio nhan phong");
        }
        if (booking.getStatus() != BookingStatus.PAID && booking.getStatus() != BookingStatus.DEPOSIT_PAID) {
            throw new IllegalStateException("Trang thai booking khong con phu hop de hoan tien");
        }

        BigDecimal refundAmount = resolveRefundAmount(booking);
        booking.setCancellationRequestStatus(CancellationRequestStatus.APPROVED);
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setRefundAmount(refundAmount);
        booking.setRefundPercentage(FULL_REFUND_PERCENTAGE);
        booking.setRefundMethod(resolveRefundMethod(booking));

        String cancellationNote = "Admin duyet huy theo yeu cau cua khach: " + booking.getCancellationReason();
        booking.setNote(booking.getNote() == null || booking.getNote().isBlank()
                ? cancellationNote
                : booking.getNote() + System.lineSeparator() + cancellationNote);

        Booking savedBooking = saveBookingPort.save(booking);
        LocalDateTime expectedRefundAt = bookingCancellationNotificationService.notifyCancellationRefund(
                savedBooking,
                refundAmount
        );
        savedBooking.setExpectedRefundAt(expectedRefundAt);
        savedBooking = saveBookingPort.save(savedBooking);
        createPendingRefundPort.createPendingRefundIfAbsent(
                savedBooking,
                refundAmount,
                savedBooking.getRefundMethod(),
                expectedRefundAt
        );

        return new CustomerBookingCancellationResponse(
                new BookingResponse(savedBooking, loadPaidAmount(savedBooking)),
                refundAmount,
                FULL_REFUND_PERCENTAGE,
                savedBooking.getRefundMethod(),
                expectedRefundAt
        );
    }

    private void validateCostRequest(CalculateBookingCostCommand command) {
        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        if (command.startTime() == null || command.endTime() == null) {
            throw new IllegalArgumentException("Thoi gian bat dau va ket thuc khong duoc de trong");
        }

        if (!command.startTime().isBefore(command.endTime())) {
            throw new IllegalArgumentException("Thoi gian bat dau phai nho hon thoi gian ket thuc");
        }

        if (command.startTime().isBefore(LocalDateTime.now(clock))) {
            throw new IllegalArgumentException("Khong the tinh phi cho thoi gian trong qua khu");
        }

        long minutes = Duration.between(command.startTime(), command.endTime()).toMinutes();

        if (minutes < MINIMUM_BOOKING_MINUTES) {
            throw new IllegalArgumentException("Thoi luong thue toi thieu la 8 gio");
        }
    }

    private void validateCreateBookingRequest(CreateBookingCommand command) {
        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        if (command.startTime() == null || command.endTime() == null) {
            throw new IllegalArgumentException("Thoi gian bat dau va ket thuc khong duoc de trong");
        }

        if (command.paymentMethod() == null) {
            throw new IllegalArgumentException("Phuong thuc thanh toan khong duoc de trong");
        }

        if (!command.startTime().isBefore(command.endTime())) {
            throw new IllegalArgumentException("Thoi gian bat dau phai nho hon thoi gian ket thuc");
        }

        if (command.startTime().isBefore(LocalDateTime.now(clock))) {
            throw new IllegalArgumentException("Khong the dat lich trong qua khu");
        }

        long minutes = Duration.between(command.startTime(), command.endTime()).toMinutes();

        if (minutes < MINIMUM_BOOKING_MINUTES) {
            throw new IllegalArgumentException("Thoi luong thue toi thieu la 8 gio");
        }
    }

    private void validateHistoryQuery(CustomerBookingHistoryQuery query) {
        if (query.page() < 0) {
            throw new IllegalArgumentException("Trang khong duoc nho hon 0");
        }
        if (query.size() < 1 || query.size() > 100) {
            throw new IllegalArgumentException("Kich thuoc trang phai tu 1 den 100");
        }
        if (query.from() != null && query.to() != null && query.from().isAfter(query.to())) {
            throw new IllegalArgumentException("Thoi gian bat dau khong duoc sau thoi gian ket thuc");
        }
    }

    private String resolveSortProperty(String sortBy) {
        return switch (sortBy) {
            case "createdAt", "startTime", "endTime", "totalAmount", "status" -> sortBy;
            default -> throw new IllegalArgumentException(
                    "sortBy chi nhan createdAt, startTime, endTime, totalAmount hoac status"
            );
        };
    }

    private String resolveSortDirection(String direction) {
        if (direction == null) {
            throw new IllegalArgumentException("direction chi nhan asc hoac desc");
        }

        String normalizedDirection = direction.trim().toUpperCase();
        if (!normalizedDirection.equals("ASC") && !normalizedDirection.equals("DESC")) {
            throw new IllegalArgumentException("direction chi nhan asc hoac desc");
        }

        return normalizedDirection;
    }

    private void validateAvailabilityRange(
            Integer roomId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        if (roomId == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        if (from == null || to == null) {
            throw new IllegalArgumentException("Thoi gian bat dau va ket thuc khong duoc de trong");
        }

        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("Thoi gian bat dau phai nho hon thoi gian ket thuc");
        }
    }

    private boolean hasBlockingBooking(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {
        return !findBlockingBookings(roomId, startTime, endTime).isEmpty();
    }

    private List<Booking> findBlockingBookings(
            Integer roomId,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {
        return loadBookingPort.loadBlockingBookings(
                roomId,
                startTime,
                endTime,
                BookingStatus.CANCELLED
        );
    }

    private List<TimeSlotResponse> calculateAvailableSlots(
            LocalDateTime from,
            LocalDateTime to,
            List<Booking> blockingBookings
    ) {
        List<TimeSlotResponse> slots = new ArrayList<>();
        LocalDateTime cursor = from;

        for (Booking booking : blockingBookings) {
            LocalDateTime busyStart = booking.getStartTime().isBefore(from)
                    ? from
                    : booking.getStartTime();
            LocalDateTime busyEnd = booking.getEndTime().isAfter(to)
                    ? to
                    : booking.getEndTime();

            if (busyStart.isAfter(cursor)) {
                slots.add(new TimeSlotResponse(cursor, busyStart));
            }

            if (busyEnd.isAfter(cursor)) {
                cursor = busyEnd;
            }

            if (!cursor.isBefore(to)) {
                break;
            }
        }

        if (cursor.isBefore(to)) {
            slots.add(new TimeSlotResponse(cursor, to));
        }

        return List.copyOf(slots);
    }

    private BigDecimal calculateTotalHours(LocalDateTime startTime, LocalDateTime endTime) {
        long minutes = Duration.between(startTime, endTime).toMinutes();

        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private CostBreakdown calculateCostBreakdown(String rawCouponCode, BigDecimal originalAmount) {
        BigDecimal normalizedOriginalAmount = normalizeMoney(originalAmount);

        if (rawCouponCode == null || rawCouponCode.isBlank()) {
            return CostBreakdown.withoutCoupon(normalizedOriginalAmount);
        }

        CouponValidationResult validationResult = validateCouponUseCase.validate(
                new ValidateCouponCommand(rawCouponCode, normalizedOriginalAmount)
        );

        if (!validationResult.valid()) {
            throw new IllegalArgumentException(validationResult.reason());
        }

        return new CostBreakdown(
                normalizedOriginalAmount,
                validationResult.code(),
                normalizeMoney(validationResult.discountAmount()),
                normalizeMoney(validationResult.payableAmount())
        );
    }

    private DiscountCode loadAppliedDiscountCode(String couponCode) {
        if (couponCode == null) {
            return null;
        }

        return loadDiscountCodeForBookingPort.loadDiscountCodeForBooking(couponCode)
                .orElseThrow(() -> new IllegalStateException("Khong the tai ma giam gia hop le de ap dung"));
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private void validateCustomerCancellationPolicy(Booking booking) {
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Don dat phong da duoc huy truoc do");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Khong the huy don da hoan thanh");
        }

        if (booking.getStatus() != BookingStatus.PAID && booking.getStatus() != BookingStatus.DEPOSIT_PAID) {
            throw new IllegalStateException("Chi ho tro huy va hoan tien cho don da thanh toan hoac da dat coc");
        }

        if (booking.getCancellationRequestStatus() == CancellationRequestStatus.PENDING) {
            throw new IllegalStateException("Yeu cau huy phong dang cho admin duyet");
        }

        if (booking.getCancellationRequestStatus() == CancellationRequestStatus.APPROVED) {
            throw new IllegalStateException("Yeu cau huy phong da duoc duyet");
        }

        if (booking.getStartTime() == null) {
            throw new IllegalStateException("Don dat phong khong co thoi gian bat dau hop le");
        }

        LocalDateTime latestCancellationTime = booking.getStartTime().minusHours(CUSTOMER_CANCELLATION_DEADLINE_HOURS);
        if (LocalDateTime.now(clock).isAfter(latestCancellationTime)) {
            throw new IllegalStateException("Chi co the gui yeu cau huy truoc gio nhan phong toi thieu 24 tieng");
        }
    }

    private String normalizeCancellationReason(String reason) {
        String normalized = normalizeOptionalText(reason);
        if (normalized == null || normalized.length() < 10) {
            throw new IllegalArgumentException("Vui long nhap ly do huy it nhat 10 ky tu");
        }
        return normalized;
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private RefundDestination validateRefundDestination(CancelCustomerBookingCommand command) {
        String bankCode = requiredText(command.refundBankCode(), "Vui long chon ngan hang nhan tien hoan")
                .toUpperCase(Locale.ROOT);
        if (!BANK_CODE_PATTERN.matcher(bankCode).matches()) {
            throw new IllegalArgumentException("Ma ngan hang nhan tien hoan khong hop le");
        }

        String bankName = requiredText(command.refundBankName(), "Ten ngan hang nhan tien hoan khong duoc de trong");
        if (bankName.length() > 100) {
            throw new IllegalArgumentException("Ten ngan hang khong duoc vuot qua 100 ky tu");
        }

        String accountNumber = requiredText(
                command.refundAccountNumber(),
                "So tai khoan nhan tien hoan khong duoc de trong"
        ).replaceAll("\\s+", "");
        if (!ACCOUNT_NUMBER_PATTERN.matcher(accountNumber).matches()) {
            throw new IllegalArgumentException("So tai khoan phai gom tu 6 den 30 chu so");
        }

        String accountHolder = requiredText(
                command.refundAccountHolder(),
                "Ten chu tai khoan nhan tien hoan khong duoc de trong"
        ).replaceAll("\\s+", " ").toUpperCase(Locale.forLanguageTag("vi-VN"));
        if (!ACCOUNT_HOLDER_PATTERN.matcher(accountHolder).matches()) {
            throw new IllegalArgumentException("Ten chu tai khoan nhan tien hoan khong hop le");
        }

        return new RefundDestination(bankCode, bankName, accountNumber, accountHolder);
    }

    private String requiredText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private record RefundDestination(
            String bankCode,
            String bankName,
            String accountNumber,
            String accountHolder
    ) {
    }

    private void attachCheckInStaff(Booking booking, User currentUser, String currentUserEmail) {
        Staff staff = loadStaffForBookingPort.loadStaffByAccountEmail(currentUserEmail).orElse(null);
        if (staff == null && String.valueOf(currentUser.getRole()).trim().equals("STAFF")) {
            throw new IllegalStateException("Tai khoan nhan vien chua co ho so staff de check-in");
        }
        booking.setCheckinStaff(staff);
    }

    private String resolveRefundMethod(Booking booking) {
        if (booking.getRefundAccountNumber() != null && !booking.getRefundAccountNumber().isBlank()) {
            return "Chuyen khoan ngan hang theo thong tin khach cung cap";
        }
        return switch (booking.getPaymentMethod()) {
            case ONLINE -> "Hoan ve phuong thuc thanh toan online ban dau";
            case CASH -> "Hoan tien mat tai quay";
        };
    }

    private BigDecimal resolveRefundAmount(Booking booking) {
        return booking.getStatus() == BookingStatus.DEPOSIT_PAID
                ? resolveSuccessfulOnlineAmount(booking)
                : normalizeMoney(booking.getTotalAmount());
    }

    private BigDecimal resolveSuccessfulOnlineAmount(Booking booking) {
        BigDecimal loadedAmount = loadSuccessfulPaymentAmountPort.loadSuccessfulPaymentAmount(booking.getId());
        BigDecimal paidAmount = normalizeMoney(loadedAmount == null ? BigDecimal.ZERO : loadedAmount);
        if (paidAmount.signum() <= 0) {
            throw new IllegalStateException("Khong xac dinh duoc so tien online da thu; vui long doi soat thu cong");
        }

        return paidAmount.min(normalizeMoney(booking.getTotalAmount()));
    }

    private void ensureBookingFullyPaid(Booking booking) {
        if (loadPaidAmount(booking).compareTo(normalizeMoney(booking.getTotalAmount())) < 0) {
            throw new IllegalStateException("Booking con tien chua thanh toan; vui long ket toan truoc khi checkout");
        }
    }

    private BigDecimal loadPaidAmount(Booking booking) {
        if (booking.getId() == null) {
            return ZERO_MONEY;
        }

        BigDecimal loadedAmount = loadSuccessfulPaymentAmountPort.loadSuccessfulPaymentAmount(booking.getId());
        return normalizeMoney(loadedAmount == null ? BigDecimal.ZERO : loadedAmount)
                .min(normalizeMoney(booking.getTotalAmount()));
    }

    private User getCurrentUser(String email) {
        return loadUserPort.loadUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private BookingResponse toBookingResponse(Booking booking) {
        return new BookingResponse(
                booking,
                loadPaidAmount(booking),
                booking.getId() != null && loadReviewPort.existsReviewByBookingId(booking.getId())
        );
    }

    private BookingResponse toManagementBookingResponse(Booking booking) {
        return new BookingResponse(booking, loadPaidAmount(booking));
    }

    private void checkAdminOrStaff(User user) {
        String role = String.valueOf(user.getRole()).trim();

        if (!role.equals("ADMIN") && !role.equals("STAFF")) {
            throw new ForbiddenException("Ban khong co quyen quan ly don dat phong");
        }
    }

    private record CostBreakdown(
            BigDecimal originalAmount,
            String couponCode,
            BigDecimal discountAmount,
            BigDecimal totalAmount
    ) {
        private static CostBreakdown withoutCoupon(BigDecimal originalAmount) {
            return new CostBreakdown(originalAmount, null, ZERO_MONEY, originalAmount);
        }
    }
}
