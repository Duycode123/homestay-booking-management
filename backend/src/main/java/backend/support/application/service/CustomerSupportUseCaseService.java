package backend.support.application.service;

import backend.exception.ResourceNotFoundException;
import backend.support.application.model.AdminCustomerIssueReportResult;
import backend.support.application.model.CustomerIssueReportResult;
import backend.support.application.port.in.CreateCustomerIssueReportUseCase;
import backend.support.application.port.in.GetCustomerIssueReportUseCase;
import backend.support.application.port.in.ListCustomerIssueReportsUseCase;
import backend.support.application.port.in.UpdateCustomerIssueReportUseCase;
import backend.support.application.port.out.CustomerIssueReportPort;
import backend.support.application.port.out.LoadCustomerSupportContextPort;
import backend.support.domain.model.CustomerIssueReport;
import backend.support.domain.model.IssueStatus;
import backend.support.domain.model.IssueType;
import backend.support.domain.model.SupportBooking;
import backend.support.domain.model.SupportCustomer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerSupportUseCaseService implements
        CreateCustomerIssueReportUseCase,
        ListCustomerIssueReportsUseCase,
        GetCustomerIssueReportUseCase,
        UpdateCustomerIssueReportUseCase {

    private final LoadCustomerSupportContextPort customerContextPort;
    private final CustomerIssueReportPort issueReportPort;

    @Override
    @Transactional
    public CustomerIssueReportResult createIssueReport(
            String customerEmail,
            String rawIssueType,
            String rawBookingCode,
            String rawDescription
    ) {
        SupportCustomer customer = customerContextPort.loadCustomerByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so khach hang"));
        SupportBooking booking = resolveBooking(customerEmail, rawBookingCode);

        CustomerIssueReport savedReport = issueReportPort.save(CustomerIssueReport.open(
                customer,
                booking,
                normalizeIssueType(rawIssueType),
                normalizeDescription(rawDescription)
        ));

        return new CustomerIssueReportResult(
                savedReport.id(),
                savedReport.issueType().name(),
                savedReport.status().name(),
                booking == null ? null : booking.id(),
                booking == null ? null : booking.bookingCode(),
                savedReport.createdAt()
        );
    }

    @Override
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

        return issueReportPort.findAllNewestFirst()
                .stream()
                .filter(report -> matchesQuery(report, query))
                .filter(report -> matchesStatus(report, status))
                .filter(report -> matchesPriority(report, priority))
                .filter(report -> matchesRoom(report, roomId))
                .filter(report -> matchesSubmittedDate(report, submittedDate))
                .map(this::toAdminResponse)
                .toList();
    }

    @Override
    public AdminCustomerIssueReportResult getAdminIssueReport(Long reportId) {
        return issueReportPort.findById(reportId)
                .map(this::toAdminResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bao cao su co"));
    }

    @Override
    @Transactional
    public AdminCustomerIssueReportResult updateAdminIssueReportStatus(
            Long reportId,
            String rawStatus,
            String rawAdminNote
    ) {
        CustomerIssueReport report = issueReportPort.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bao cao su co"));
        CustomerIssueReport updatedReport = report.updateStatus(
                normalizeAdminStatus(rawStatus),
                normalizeAdminNote(rawAdminNote)
        );
        return toAdminResponse(issueReportPort.save(updatedReport));
    }

    private IssueType normalizeIssueType(String rawIssueType) {
        if (rawIssueType == null || rawIssueType.trim().isBlank()) {
            throw new IllegalArgumentException("Loai su co khong duoc de trong");
        }
        try {
            return IssueType.valueOf(rawIssueType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Loai su co khong hop le");
        }
    }

    private AdminCustomerIssueReportResult toAdminResponse(CustomerIssueReport report) {
        SupportBooking booking = report.booking();
        SupportCustomer customer = report.customer();

        return new AdminCustomerIssueReportResult(
                String.valueOf(report.id()),
                "IR-%04d".formatted(report.id()),
                customer.fullName(),
                customer.email(),
                customer.phone(),
                booking == null || booking.roomId() == null ? "none" : String.valueOf(booking.roomId()),
                booking == null || booking.roomName() == null ? "Khong gan phong" : booking.roomName(),
                booking == null ? null : booking.bookingCode(),
                titleFor(report.issueType()),
                report.description(),
                priorityFor(report.issueType()),
                toUiStatus(report.status()),
                report.createdAt(),
                report.adminNote() == null ? "" : report.adminNote()
        );
    }

    private boolean matchesQuery(CustomerIssueReport report, String query) {
        if (query.isBlank()) {
            return true;
        }
        SupportBooking booking = report.booking();
        SupportCustomer customer = report.customer();
        String value = String.join(" ",
                "IR-%04d".formatted(report.id()),
                safe(customer.fullName()),
                safe(customer.email()),
                safe(customer.phone()),
                booking == null ? "" : safe(booking.bookingCode()),
                booking == null ? "" : safe(booking.roomName()),
                titleFor(report.issueType()),
                safe(report.description())
        ).toLowerCase(Locale.ROOT);
        return value.contains(query);
    }

    private boolean matchesStatus(CustomerIssueReport report, String status) {
        return status.isBlank() || "ALL".equals(status) || toUiStatus(report.status()).equals(status);
    }

    private boolean matchesPriority(CustomerIssueReport report, String priority) {
        return priority.isBlank() || "ALL".equals(priority) || priorityFor(report.issueType()).equals(priority);
    }

    private boolean matchesRoom(CustomerIssueReport report, String roomId) {
        if (roomId.isBlank() || "ALL".equals(roomId)) {
            return true;
        }
        SupportBooking booking = report.booking();
        return booking != null && booking.roomId() != null && String.valueOf(booking.roomId()).equals(roomId);
    }

    private boolean matchesSubmittedDate(CustomerIssueReport report, LocalDate submittedDate) {
        return submittedDate == null
                || report.createdAt() != null && submittedDate.equals(report.createdAt().toLocalDate());
    }

    private String titleFor(IssueType issueType) {
        return switch (issueType) {
            case ROOM -> "Su co phong homestay";
            case EQUIPMENT -> "Su co thiet bi";
            case PAYMENT -> "Su co thanh toan";
            case ACCOUNT -> "Su co tai khoan";
            case OTHER -> "Su co khac";
        };
    }

    private String priorityFor(IssueType issueType) {
        return switch (issueType) {
            case PAYMENT, ROOM -> "HIGH";
            case EQUIPMENT -> "MEDIUM";
            case ACCOUNT, OTHER -> "LOW";
        };
    }

    private String toUiStatus(IssueStatus status) {
        return status == IssueStatus.OPEN ? "NEW" : status.name();
    }

    private IssueStatus normalizeAdminStatus(String rawStatus) {
        String status = normalizeOptional(rawStatus);
        if (status.isBlank()) {
            throw new IllegalArgumentException("Trang thai khong duoc de trong");
        }
        if ("NEW".equals(status)) {
            return IssueStatus.OPEN;
        }
        try {
            return IssueStatus.valueOf(status);
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

    private SupportBooking resolveBooking(String customerEmail, String rawBookingCode) {
        if (rawBookingCode == null || rawBookingCode.trim().isBlank()) {
            return null;
        }
        Integer bookingId = parseBookingId(rawBookingCode);
        return customerContextPort.loadOwnedBooking(bookingId, customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong cua ban voi ma nay"));
    }

    private Integer parseBookingId(String rawBookingCode) {
        String normalized = rawBookingCode.trim().toUpperCase(Locale.ROOT);
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
