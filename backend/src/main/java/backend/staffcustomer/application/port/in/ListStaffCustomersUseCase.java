package backend.staffcustomer.application.port.in;

import backend.staffcustomer.application.model.StaffCustomerSummary;
import backend.staffcustomer.application.port.in.query.ListStaffCustomersQuery;

import java.util.List;

public interface ListStaffCustomersUseCase {
    List<StaffCustomerSummary> listCustomers(ListStaffCustomersQuery query);
}
