package backend.staffcustomer.application.port.out;

import backend.staffcustomer.application.model.StaffCustomerActor;
import backend.staffcustomer.application.model.StaffCustomerBookingRow;

import java.util.List;
import java.util.Optional;

public interface StaffCustomerQueryPort {
    Optional<StaffCustomerActor> loadActorByEmail(String email);

    List<StaffCustomerBookingRow> loadCustomerBookingRows();
}
