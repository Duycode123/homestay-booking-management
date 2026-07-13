package backend.support.adapter.out.persistence;

import backend.entity.Booking;
import backend.entity.Customer;
import backend.repository.BookingRepository;
import backend.repository.CustomerIssueReportRepository;
import backend.repository.CustomerRepository;
import backend.support.application.port.out.CustomerIssueReportPort;
import backend.support.domain.model.CustomerIssueReport;
import backend.support.domain.model.IssueStatus;
import backend.support.domain.model.IssueType;
import backend.support.domain.model.SupportBooking;
import backend.support.domain.model.SupportCustomer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CustomerIssueReportPersistenceAdapter implements CustomerIssueReportPort {

    private final CustomerIssueReportRepository issueReportRepository;
    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;

    @Override
    public CustomerIssueReport save(CustomerIssueReport report) {
        backend.entity.CustomerIssueReport entity = report.id() == null
                ? newEntity(report)
                : issueReportRepository.findById(report.id())
                        .orElseThrow(() -> new IllegalStateException("Customer issue report no longer exists"));

        entity.setStatus(backend.entity.CustomerIssueReportStatus.valueOf(report.status().name()));
        entity.setAdminNote(report.adminNote());
        return toDomain(issueReportRepository.save(entity));
    }

    @Override
    public List<CustomerIssueReport> findAllNewestFirst() {
        return issueReportRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<CustomerIssueReport> findById(Long reportId) {
        return issueReportRepository.findById(reportId).map(this::toDomain);
    }

    private backend.entity.CustomerIssueReport newEntity(CustomerIssueReport report) {
        Customer customer = customerRepository.getReferenceById(report.customer().id());
        Booking booking = report.booking() == null
                ? null
                : bookingRepository.getReferenceById(report.booking().id());

        return backend.entity.CustomerIssueReport.builder()
                .customer(customer)
                .booking(booking)
                .issueType(backend.entity.CustomerIssueType.valueOf(report.issueType().name()))
                .description(report.description())
                .adminNote(report.adminNote())
                .status(backend.entity.CustomerIssueReportStatus.valueOf(report.status().name()))
                .build();
    }

    private CustomerIssueReport toDomain(backend.entity.CustomerIssueReport entity) {
        Customer customer = entity.getCustomer();
        Booking booking = entity.getBooking();
        SupportCustomer supportCustomer = new SupportCustomer(
                customer.getId(), customer.getFullName(), customer.getEmail(), customer.getPhone()
        );
        SupportBooking supportBooking = booking == null ? null : new SupportBooking(
                booking.getId(),
                booking.getBookingCode(),
                booking.getRoom() == null ? null : booking.getRoom().getId(),
                booking.getRoom() == null ? null : booking.getRoom().getRoomName()
        );

        return new CustomerIssueReport(
                entity.getId(),
                supportCustomer,
                supportBooking,
                IssueType.valueOf(entity.getIssueType().name()),
                entity.getDescription(),
                entity.getAdminNote(),
                IssueStatus.valueOf(entity.getStatus().name()),
                entity.getCreatedAt()
        );
    }
}
