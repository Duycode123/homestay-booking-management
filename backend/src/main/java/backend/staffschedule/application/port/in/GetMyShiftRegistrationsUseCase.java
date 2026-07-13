package backend.staffschedule.application.port.in;

import backend.staffschedule.application.port.in.query.GetMyShiftRegistrationsQuery;
import backend.staffschedule.domain.model.ShiftRegistration;

import java.util.List;

public interface GetMyShiftRegistrationsUseCase {

    List<ShiftRegistration> getMyShiftRegistrations(GetMyShiftRegistrationsQuery query);
}
