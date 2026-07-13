package backend.support.application.service;

import backend.entity.Booking;
import backend.entity.Customer;
import backend.entity.CustomerIssueReport;
import backend.entity.CustomerIssueReportStatus;
import backend.entity.CustomerIssueType;
import backend.exception.ResourceNotFoundException;
import backend.repository.BookingRepository;
import backend.repository.CustomerIssueReportRepository;
import backend.repository.CustomerRepository;
import backend.support.application.model.AdminCustomerIssueReportResult;
import backend.support.application.model.CustomerIssueReportResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerSupportUseCaseService {

    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;
    private final CustomerIssueReportRepository customerIssueReportRepository;

    @Transactional
    public CustomerIssueReportResult createIssueReport(
            String customerEmail,
            String rawIssueType,
            String rawBookingCode,
            String rawDescription
    ) {
        Customer customer = customerRepository.findByAccount_Email(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));

        CustomerIssueType issueType = normalizeIssueType(rawIssueType);
        String description = normalizeDescription(rawDescription);
        Booking booking = resolveBooking(customerEmail, rawBookingCode);

        CustomerIssueReport savedReport = customerIssueReportRepository.save(
                CustomerIssueReport.builder()
                        .customer(customer)
                        .booking(booking)
                        .issueType(issueType)
                        .description(description)
                        .status(CustomerIssueReportStatus.OPEN)
                        .build()
        );

        return new CustomerIssueReportResult(
                savedReport.getId(),
                savedReport.getIssueType().name(),
                savedReport.getStatus().name(),
                booking == null ? null : booking.getId(),
                booking == null ? null : booking.getBookingCode(),
                savedReport.getCreatedAt()
        );
    }

    public List<AdminCustomerIssueReportResult> getAdminIssueReports(
            String rawQuery,
            String rawStatus,
            String rawPriority,
            String rawRoomId,
            LocalDate submittedDate
    ) {
        String query = normalizeSearch(rawQuery);
        String status = normalizeOptional(rawStatus);
        String priority = normalizeOptional(rawPriority);
        String roomId = normalizeOptional(rawRoomId);

        return customerIssueReportRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(report -> matchesQuery(report, query))
                .filter(report -> matchesStatus(report, status))
                .filter(report -> matchesPriority(report, priority))
                .filter(report -> matchesRoom(report, roomId))
                .filter(report -> matchesSubmittedDate(report, submittedDate))
                .map(this::toAdminResponse)
                .toList();
    }

    public AdminCustomerIssueReportResult getAdminIssueReport(Long reportId) {
        return customerIssueReportRepository.findById(reportId)
                .map(this::toAdminResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bao cao su co"));
    }

    @Transactional
    public AdminCustomerIssueReportResult updateAdminIssueReportStatus(
            Long reportId,
            String rawStatus,
            String rawAdminNote
    ) {
        CustomerIssueReport report = customerIssueReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bao cao su co"));

        report.setStatus(normalizeAdminStatus(rawStatus));
        report.setAdminNote(normalizeAdminNote(rawAdminNote));

        return toAdminResponse(customerIssueReportRepository.save(report));
    }

    private CustomerIssueType normalizeIssueType(String rawIssueType) {
        if (rawIssueType == null || rawIssueType.trim().isBlank()) {
            throw new IllegalArgumentException("Loai su co khong duoc de trong");
        }

        try {
            return CustomerIssueType.valueOf(rawIssueType.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Loai su co khong hop le");
        }
    }

    private AdminCustomerIssueReportResult toAdminResponse(CustomerIssueReport report) {
        Booking booking = report.getBooking();
        Customer customer = report.getCustomer();

        return new AdminCustomerIssueReportResult(
                String.valueOf(report.getId()),
                "IR-%04d".formatted(report.getId()),
                customer.getFullName(),
                customer.getEmail(),
                customer.getPhone(),
                booking == null || booking.getRoom() == null ? "none" : String.valueOf(booking.getRoom().getId()),
                booking == null || booking.getRoom() == null ? "Khong gan phong" : booking.getRoom().getRoomName(),
                booking == null ? null : booking.getBookingCode(),
                titleFor(report.getIssueType()),
                report.getDescription(),
                priorityFor(report.getIssueType()),
                toUiStatus(report.getStatus()),
                report.getCreatedAt(),
                report.getAdminNote() == null ? "" : report.getAdminNote()
        );
    }

    private boolean matchesQuery(CustomerIssueReport report, String query) {
        if (query.isBlank()) {
            return true;
        }

        Booking booking = report.getBooking();
        Customer customer = report.getCustomer();
        String value = String.join(" ",
                "IR-%04d".formatted(report.getId()),
                safe(customer.getFullName()),
                safe(customer.getEmail()),
                safe(customer.getPhone()),
                booking == null ? "" : safe(booking.getBookingCode()),
                booking == null || booking.getRoom() == null ? "" : safe(booking.getRoom().getRoomName()),
                titleFor(report.getIssueType()),
                safe(report.getDescription())
        ).toLowerCase(Locale.ROOT);

        return value.contains(query);
    }

    private boolean matchesStatus(CustomerIssueReport report, String status) {
        return status.isBlank() || "ALL".equals(status) || toUiStatus(report.getStatus()).equals(status);
    }

    private boolean matchesPriority(CustomerIssueReport report, String priority) {
        return priority.isBlank() || "ALL".equals(priority) || priorityFor(report.getIssueType()).equals(priority);
    }

    private boolean matchesRoom(CustomerIssueReport report, String roomId) {
        if (roomId.isBlank() || "ALL".equals(roomId)) {
            return true;
        }

        Booking booking = report.getBooking();
        return booking != null
                && booking.getRoom() != null
                && String.valueOf(booking.getRoom().getId()).equals(roomId);
    }

    private boolean matchesSubmittedDate(CustomerIssueReport report, LocalDate submittedDate) {
        return submittedDate == null
                || report.getCreatedAt() != null && submittedDate.equals(report.getCreatedAt().toLocalDate());
    }

    private String titleFor(CustomerIssueType issueType) {
        return switch (issueType) {
            case ROOM -> "Su co phong homestay";
            case EQUIPMENT -> "Su co thiet bi";
            case PAYMENT -> "Su co thanh toan";
            case ACCOUNT -> "Su co tai khoan";
            case OTHER -> "Su co khac";
        };
    }

    private String priorityFor(CustomerIssueType issueType) {
        return switch (issueType) {
            case PAYMENT, ROOM -> "HIGH";
            case EQUIPMENT -> "MEDIUM";
            case ACCOUNT, OTHER -> "LOW";
        };
    }

    private String toUiStatus(CustomerIssueReportStatus status) {
        return status == CustomerIssueReportStatus.OPEN ? "NEW" : status.name();
    }

    private CustomerIssueReportStatus normalizeAdminStatus(String rawStatus) {
        String status = normalizeOptional(rawStatus);
        if (status.isBlank()) {
            throw new IllegalArgumentException("Trang thai khong duoc de trong");
        }

        if ("NEW".equals(status)) {
            return CustomerIssueReportStatus.OPEN;
        }

        try {
            return CustomerIssueReportStatus.valueOf(status);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Trang thai bao cao khong hop le");
        }
    }

    private String normalizeAdminNote(String rawAdminNote) {
        String adminNote = rawAdminNote == null ? "" : rawAdminNote.trim();
        if (adminNote.length() > 1000) {
            throw new IllegalArgumentException("Ghi chu xu ly khong duoc vuot qua 1000 ky tu");
        }

        return adminNote;
    }

    private String normalizeSearch(String rawValue) {
        return normalizeOptional(rawValue).toLowerCase(Locale.ROOT);
    }

    private String normalizeOptional(String rawValue) {
        return rawValue == null ? "" : rawValue.trim().toUpperCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String normalizeDescription(String rawDescription) {
        if (rawDescription == null || rawDescription.trim().isBlank()) {
            throw new IllegalArgumentException("Noi dung mo ta khong duoc de trong");
        }

        String description = rawDescription.trim();
        if (description.length() > 1000) {
            throw new IllegalArgumentException("Noi dung mo ta khong duoc vuot qua 1000 ky tu");
        }

        return description;
    }

    private Booking resolveBooking(String customerEmail, String rawBookingCode) {
        if (rawBookingCode == null || rawBookingCode.trim().isBlank()) {
            return null;
        }

        Integer bookingId = parseBookingId(rawBookingCode);
        return bookingRepository.findByIdAndCustomer_Account_Email(bookingId, customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong cua ban voi ma nay"));
    }

    private Integer parseBookingId(String rawBookingCode) {
        String normalized = rawBookingCode.trim().toUpperCase();
        String numericPart = normalized.startsWith("BR") ? normalized.substring(2) : normalized;

        if (!numericPart.matches("\\d+")) {
            throw new IllegalArgumentException("Ma dat phong khong hop le");
        }

        try {
            return Integer.valueOf(numericPart);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Ma dat phong khong hop le");
        }
    }
}
