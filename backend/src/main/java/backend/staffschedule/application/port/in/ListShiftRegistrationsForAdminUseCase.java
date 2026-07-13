package backend.staffschedule.application.port.in;

import backend.staffschedule.application.port.in.query.ListShiftRegistrationsQuery;
import backend.staffschedule.domain.model.ShiftRegistration;

import java.util.List;

public interface ListShiftRegistrationsForAdminUseCase {

    List<ShiftRegistration> listShiftRegistrations(ListShiftRegistrationsQuery query);
}
