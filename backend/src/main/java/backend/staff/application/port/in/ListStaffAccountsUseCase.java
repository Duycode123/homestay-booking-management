package backend.staff.application.port.in;

import backend.staff.application.model.StaffAccountResult;

import java.util.List;

public interface ListStaffAccountsUseCase {
    List<StaffAccountResult> listStaffAccounts();
}

