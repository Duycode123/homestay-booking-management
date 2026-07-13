package backend.support.application.service;

import backend.support.application.model.CustomerIssueReportResult;
import backend.support.application.port.out.CustomerIssueReportPort;
import backend.support.application.port.out.LoadCustomerSupportContextPort;
import backend.support.domain.model.CustomerIssueReport;
import backend.support.domain.model.IssueStatus;
import backend.support.domain.model.IssueType;
import backend.support.domain.model.SupportBooking;
import backend.support.domain.model.SupportCustomer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerSupportUseCaseServiceTest {

    @Mock
    private LoadCustomerSupportContextPort customerContextPort;

    @Mock
    private CustomerIssueReportPort issueReportPort;

    private CustomerSupportUseCaseService customerSupportUseCaseService;

    @BeforeEach
    void setUp() {
        customerSupportUseCaseService = new CustomerSupportUseCaseService(customerContextPort, issueReportPort);
    }

    @Test
    void createsIssueReportForOwnedBooking() {
        SupportCustomer customer = new SupportCustomer(7, "Customer", "customer@example.com", "0900000000");
        SupportBooking booking = new SupportBooking(12, "BR00000012", 3, "Garden Room");
        when(customerContextPort.loadCustomerByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(customerContextPort.loadOwnedBooking(12, "customer@example.com")).thenReturn(Optional.of(booking));
        when(issueReportPort.save(any(CustomerIssueReport.class))).thenAnswer(invocation -> {
            CustomerIssueReport draft = invocation.getArgument(0);
            return new CustomerIssueReport(
                    99L,
                    draft.customer(),
                    draft.booking(),
                    draft.issueType(),
                    draft.description(),
                    draft.adminNote(),
                    IssueStatus.OPEN,
                    LocalDateTime.of(2026, 7, 13, 10, 0)
            );
        });

        CustomerIssueReportResult result = customerSupportUseCaseService.createIssueReport(
                "customer@example.com",
                "equipment",
                "BR00000012",
                "Micro bi nhiu va mat tin hieu."
        );

        ArgumentCaptor<CustomerIssueReport> reportCaptor = ArgumentCaptor.forClass(CustomerIssueReport.class);
        verify(issueReportPort).save(reportCaptor.capture());
        assertEquals(IssueType.EQUIPMENT, reportCaptor.getValue().issueType());
        assertEquals(booking, reportCaptor.getValue().booking());
        assertEquals(99L, result.reportId());
        assertEquals("OPEN", result.status());
        assertEquals("BR00000012", result.bookingCode());
    }

    @Test
    void rejectsInvalidBookingCodeFormat() {
        SupportCustomer customer = new SupportCustomer(7, "Customer", "customer@example.com", "0900000000");
        when(customerContextPort.loadCustomerByEmail("customer@example.com")).thenReturn(Optional.of(customer));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> customerSupportUseCaseService.createIssueReport(
                        "customer@example.com", "payment", "BOOK-12", "Khong tim thay giao dich"
                )
        );

        assertEquals("Ma dat phong khong hop le", exception.getMessage());
    }
}
