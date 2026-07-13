package backend.staffschedule.application.port.out;

import java.util.Optional;

public interface ShiftRegistrationActorPort {

    Optional<Integer> loadStaffIdByAccountEmail(String email);

    Optional<Integer> loadAccountIdByEmail(String email);
}
