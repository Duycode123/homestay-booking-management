package backend.support.application.service;

import backend.entity.Booking;
import backend.entity.Customer;
import backend.entity.CustomerIssueReport;
import backend.entity.CustomerIssueType;
import backend.entity.User;
import backend.support.application.model.CustomerIssueReportResult;
import backend.repository.BookingRepository;
import backend.repository.CustomerIssueReportRepository;
import backend.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerSupportUseCaseServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private CustomerIssueReportRepository customerIssueReportRepository;

    private CustomerSupportUseCaseService customerSupportUseCaseService;

    @BeforeEach
    void setUp() {
        customerSupportUseCaseService = new CustomerSupportUseCaseService(
                customerRepository,
                bookingRepository,
                customerIssueReportRepository
        );
    }

    @Test
    void createsIssueReportForOwnedBooking() {
        Customer customer = Customer.builder()
                .id(7)
                .account(User.builder().id(7).email("customer@example.com").build())
                .build();
        Booking booking = Booking.builder()
                .id(12)
                .customer(customer)
                .build();

        when(customerRepository.findByAccount_Email("customer@example.com")).thenReturn(Optional.of(customer));
        when(bookingRepository.findByIdAndCustomer_Account_Email(12, "customer@example.com"))
                .thenReturn(Optional.of(booking));
        when(customerIssueReportRepository.save(any(CustomerIssueReport.class))).thenAnswer(invocation -> {
            CustomerIssueReport saved = invocation.getArgument(0);
            saved.setId(99L);
            saved.prePersist();
            return saved;
        });

        CustomerIssueReportResult result = customerSupportUseCaseService.createIssueReport(
                "customer@example.com",
                "equipment",
                "BR00000012",
                "Micro bi nhiu va mat tin hieu."
        );

        ArgumentCaptor<CustomerIssueReport> reportCaptor = ArgumentCaptor.forClass(CustomerIssueReport.class);
        verify(customerIssueReportRepository).save(reportCaptor.capture());

        CustomerIssueReport savedReport = reportCaptor.getValue();
        assertEquals(CustomerIssueType.EQUIPMENT, savedReport.getIssueType());
        assertEquals(booking, savedReport.getBooking());
        assertEquals(99L, result.reportId());
        assertEquals("OPEN", result.status());
        assertEquals("BR00000012", result.bookingCode());
    }

    @Test
    void rejectsInvalidBookingCodeFormat() {
        Customer customer = Customer.builder()
                .id(7)
                .account(User.builder().id(7).email("customer@example.com").build())
                .build();
        when(customerRepository.findByAccount_Email("customer@example.com")).thenReturn(Optional.of(customer));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> customerSupportUseCaseService.createIssueReport(
                        "customer@example.com",
                        "payment",
                        "BOOK-12",
                        "Khong tim thay giao dich"
                )
        );

        assertEquals("Ma dat phong khong hop le", exception.getMessage());
    }
}
