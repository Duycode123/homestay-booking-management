package backend.staff.application.port.in;

import backend.staff.application.model.StaffAccountResult;

public interface GetStaffAccountDetailUseCase {
    StaffAccountResult getStaffAccountDetail(Integer staffId);
}

