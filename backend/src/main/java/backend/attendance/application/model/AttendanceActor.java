package backend.attendance.application.model;

import backend.entity.Role;

public record AttendanceActor(
        Integer accountId,
        Integer staffId,
        Role role
) {
}
