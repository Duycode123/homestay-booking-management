package backend.attendance.application.port.out;

import backend.attendance.application.model.AttendanceActor;

import java.util.Optional;

public interface AttendanceActorPort {
    Optional<AttendanceActor> loadActorByEmail(String email);
}
