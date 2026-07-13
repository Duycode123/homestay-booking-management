package backend.staff.application.port.out;

public interface StaffPasswordPort {
    String encodePassword(String rawPassword);
}
