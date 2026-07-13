package backend.staffcustomer.application.service;

import backend.entity.Role;
import backend.exception.ForbiddenException;
import backend.staffcustomer.application.model.StaffCustomerActor;
import backend.staffcustomer.application.model.StaffCustomerBooking;
import backend.staffcustomer.application.model.StaffCustomerBookingRow;
import backend.staffcustomer.application.model.StaffCustomerSummary;
import backend.staffcustomer.application.model.StaffCustomerType;
import backend.staffcustomer.application.port.in.ListStaffCustomersUseCase;
import backend.staffcustomer.application.port.in.query.ListStaffCustomersQuery;
import backend.staffcustomer.application.port.out.StaffCustomerQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffCustomerService implements ListStaffCustomersUseCase {

    private static final int VIP_BOOKING_THRESHOLD = 20;
    private static final int RECENT_BOOKING_LIMIT = 8;

    private final StaffCustomerQueryPort staffCustomerQueryPort;

    @Override
    public List<StaffCustomerSummary> listCustomers(ListStaffCustomersQuery query) {
        loadStaffActor(query.currentUserEmail());
        LocalDate today = query.today() == null ? LocalDate.now() : query.today();
        Map<Integer, CustomerBucket> buckets = new LinkedHashMap<>();

        for (StaffCustomerBookingRow row : staffCustomerQueryPort.loadCustomerBookingRows()) {
            CustomerBucket bucket = buckets.computeIfAbsent(
                    row.customerId(),
                    id -> new CustomerBucket(row.customerId(), row.customerName(), row.phone(), row.email())
            );
            bucket.add(row.booking());
        }

        return buckets.values().stream()
                .map(bucket -> bucket.toSummary(today))
                .sorted(Comparator
                        .comparing(StaffCustomerSummary::hasTodayBooking).reversed()
                        .thenComparing(StaffCustomerSummary::lastBookingAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(StaffCustomerSummary::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private StaffCustomerActor loadStaffActor(String email) {
        String normalizedEmail = normalizeRequired(email, "Khong tim thay nguoi dung dang nhap");
        StaffCustomerActor actor = staffCustomerQueryPort.loadActorByEmail(normalizedEmail)
                .orElseThrow(() -> new ForbiddenException("Khong tim thay tai khoan nhan vien"));

        if (actor.role() != Role.STAFF || actor.staffId() == null) {
            throw new ForbiddenException("Chi nhan vien moi duoc xem danh sach khach hang");
        }

        return actor;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private static final class CustomerBucket {
        private final Integer id;
        private final String name;
        private final String phone;
        private final String email;
        private final List<StaffCustomerBooking> bookings = new ArrayList<>();

        private CustomerBucket(Integer id, String name, String phone, String email) {
            this.id = id;
            this.name = name;
            this.phone = phone;
            this.email = email;
        }

        private void add(StaffCustomerBooking booking) {
            bookings.add(booking);
        }

        private StaffCustomerSummary toSummary(LocalDate today) {
            LocalDate lastBookingAt = bookings.stream()
                    .map(StaffCustomerBooking::date)
                    .max(LocalDate::compareTo)
                    .orElse(null);
            String favoriteRoom = bookings.stream()
                    .filter(booking -> booking.roomName() != null && !booking.roomName().isBlank())
                    .collect(Collectors.groupingBy(StaffCustomerBooking::roomName, Collectors.counting()))
                    .entrySet()
                    .stream()
                    .max(Map.Entry.<String, Long>comparingByValue().thenComparing(Map.Entry.comparingByKey()))
                    .map(Map.Entry::getKey)
                    .orElse(null);
            boolean hasTodayBooking = bookings.stream()
                    .anyMatch(booking -> today.equals(booking.date()));

            return new StaffCustomerSummary(
                    id,
                    name,
                    phone,
                    email,
                    classifyCustomer(bookings.size()),
                    bookings.size(),
                    lastBookingAt,
                    favoriteRoom,
                    hasTodayBooking,
                    bookings.stream().limit(RECENT_BOOKING_LIMIT).toList()
            );
        }

        private StaffCustomerType classifyCustomer(int bookingCount) {
            if (bookingCount >= VIP_BOOKING_THRESHOLD) {
                return StaffCustomerType.VIP;
            }
            if (bookingCount <= 1) {
                return StaffCustomerType.NEW;
            }
            return StaffCustomerType.RETURNING;
        }
    }
}
