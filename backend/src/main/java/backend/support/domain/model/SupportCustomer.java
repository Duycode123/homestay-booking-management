package backend.support.domain.model;

public record SupportCustomer(
        Integer id,
        String fullName,
        String email,
        String phone
) {
}
