package backend.staffperformance.application.model;

import backend.entity.Role;

public record StaffPerformanceActor(
        Integer accountId,
        Integer staffId,
        Role role
) {
}
