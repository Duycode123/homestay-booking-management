package backend.equipment.application.port.out;

import backend.entity.Role;

import java.util.Optional;

public interface EquipmentActorPort {
    Optional<Role> loadRoleByEmail(String email);
}
