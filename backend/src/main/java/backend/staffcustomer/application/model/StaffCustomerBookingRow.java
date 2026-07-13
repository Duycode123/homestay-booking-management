package backend.staffcustomer.application.model;

public record StaffCustomerBookingRow(
        Integer customerId,
        String customerName,
        String phone,
        String email,
        StaffCustomerBooking booking
) {
}
