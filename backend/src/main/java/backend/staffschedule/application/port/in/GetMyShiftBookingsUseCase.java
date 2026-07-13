package backend.staffschedule.application.port.in;

import backend.staffschedule.application.port.in.query.GetMyShiftBookingsQuery;
import backend.staffschedule.domain.model.StaffShiftBooking;

import java.util.List;

public interface GetMyShiftBookingsUseCase {

    List<StaffShiftBooking> getMyShiftBookings(GetMyShiftBookingsQuery query);
}
