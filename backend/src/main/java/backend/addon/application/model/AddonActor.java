package backend.addon.application.model;

public record AddonActor(Integer userId, String email, String role) {
    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isStaff() {
        return "STAFF".equals(role);
    }
}
