package backend.staff.application.service;

import backend.entity.Role;
import backend.entity.Staff;
import backend.entity.User;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;
import backend.staff.application.port.in.command.DisableStaffAccountCommand;
import backend.staff.application.port.out.StaffAccountPort;
import backend.staff.application.port.out.StaffEmailVerificationNotificationPort;
import backend.staff.application.port.out.StaffPasswordPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffManagementUseCaseServiceTest {

    @Mock
    private StaffAccountPort staffAccountPort;

    @Mock
    private StaffPasswordPort staffPasswordPort;

    @Mock
    private StaffEmailVerificationNotificationPort staffEmailVerificationNotificationPort;

    private StaffManagementUseCaseService staffManagementUseCaseService;

    @BeforeEach
    void setUp() {
        staffManagementUseCaseService = new StaffManagementUseCaseService(
                staffAccountPort,
                staffPasswordPort,
                staffEmailVerificationNotificationPort
        );
    }

    @Test
    void createStaffAccountCreatesUnverifiedAccountAndSendsVerificationEmail() {
        when(staffAccountPort.existsAccountByEmail("staff@example.com")).thenReturn(false);
        when(staffAccountPort.existsStaffProfileByEmail("staff@example.com")).thenReturn(false);
        when(staffPasswordPort.encodePassword("123123")).thenReturn("encoded-password");
        when(staffAccountPort.saveAccount(any(User.class))).thenAnswer(invocation -> {
            User account = invocation.getArgument(0);
            account.setId(10);
            return account;
        });
        when(staffAccountPort.saveStaff(any(Staff.class))).thenAnswer(invocation -> {
            Staff staff = invocation.getArgument(0);
            staff.setId(3);
            return staff;
        });

        var result = staffManagementUseCaseService.createStaffAccount(new CreateStaffAccountCommand(
                "  Nguyen Van Staff  ",
                " Staff@Example.COM ",
                " 0909000111 ",
                LocalDate.of(2000, 1, 2),
                null
        ));

        ArgumentCaptor<User> accountCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<Staff> staffCaptor = ArgumentCaptor.forClass(Staff.class);
        verify(staffAccountPort).saveAccount(accountCaptor.capture());
        verify(staffAccountPort).saveStaff(staffCaptor.capture());

        assertEquals("staff@example.com", accountCaptor.getValue().getEmail());
        assertEquals("encoded-password", accountCaptor.getValue().getPassword());
        assertEquals(Role.STAFF, accountCaptor.getValue().getRole());
        assertFalse(accountCaptor.getValue().isEmailVerified());
        assertTrue(accountCaptor.getValue().isEnabled());
        assertTrue(accountCaptor.getValue().getEmailVerificationTokenHash() != null
                && !accountCaptor.getValue().getEmailVerificationTokenHash().isBlank());
        assertTrue(accountCaptor.getValue().getEmailVerificationExpiresAt() != null);
        assertTrue(accountCaptor.getValue().getEmailVerificationSentAt() != null);
        assertEquals(accountCaptor.getValue(), staffCaptor.getValue().getAccount());
        assertEquals("Nguyen Van Staff", staffCaptor.getValue().getFullName());
        assertEquals("0909000111", staffCaptor.getValue().getPhone());
        assertEquals("staff@example.com", staffCaptor.getValue().getEmail());
        assertEquals("123123", result.initialPassword());
        assertFalse(result.emailVerified());
        verify(staffEmailVerificationNotificationPort).sendVerificationEmail(
                org.mockito.ArgumentMatchers.eq("staff@example.com"),
                org.mockito.ArgumentMatchers.anyString()
        );
    }

    @Test
    void createStaffAccountRejectsExistingAccountEmail() {
        when(staffAccountPort.existsAccountByEmail("staff@example.com")).thenReturn(true);

        assertThrows(
                IllegalStateException.class,
                () -> staffManagementUseCaseService.createStaffAccount(new CreateStaffAccountCommand(
                        "Staff",
                        "staff@example.com",
                        null,
                        null,
                        null
                ))
        );

        verify(staffAccountPort, never()).saveAccount(any());
        verify(staffAccountPort, never()).saveStaff(any());
    }

    @Test
    void listStaffAccountsReturnsStaffAccountDetails() {
        User account = User.builder()
                .id(10)
                .email("staff@example.com")
                .role(Role.STAFF)
                .emailVerified(true)
                .enabled(true)
                .build();
        Staff staff = Staff.builder()
                .id(3)
                .account(account)
                .fullName("Staff")
                .email("staff@example.com")
                .phone("0909000111")
                .dateOfBirth(LocalDate.of(2000, 1, 2))
                .build();

        when(staffAccountPort.loadAllStaff()).thenReturn(List.of(staff));

        var result = staffManagementUseCaseService.listStaffAccounts();

        assertEquals(1, result.size());
        assertEquals(10, result.get(0).accountId());
        assertEquals(3, result.get(0).staffId());
        assertEquals("staff@example.com", result.get(0).email());
        assertEquals("Staff", result.get(0).fullName());
        assertEquals(LocalDate.of(2000, 1, 2), result.get(0).dateOfBirth());
        assertTrue(result.get(0).enabled());
    }

    @Test
    void disableStaffAccountMarksLinkedAccountDisabled() {
        User account = User.builder()
                .id(10)
                .email("staff@example.com")
                .role(Role.STAFF)
                .enabled(true)
                .build();
        Staff staff = Staff.builder()
                .id(3)
                .account(account)
                .fullName("Staff")
                .email("staff@example.com")
                .build();

        when(staffAccountPort.loadStaffById(3)).thenReturn(Optional.of(staff));
        when(staffAccountPort.saveAccount(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = staffManagementUseCaseService.disableStaffAccount(new DisableStaffAccountCommand(3));

        assertFalse(account.isEnabled());
        assertFalse(result.enabled());
        verify(staffAccountPort).saveAccount(account);
    }
}
