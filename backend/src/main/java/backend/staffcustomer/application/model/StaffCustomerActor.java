package backend.staffcustomer.application.model;

import backend.entity.Role;

public record StaffCustomerActor(
        Integer accountId,
        Integer staffId,
        Role role
) {
}
