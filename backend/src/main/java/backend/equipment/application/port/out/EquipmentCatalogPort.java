package backend.equipment.application.port.out;

import backend.equipment.domain.model.Equipment;
import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;

import java.util.List;
import java.util.Optional;

public interface EquipmentCatalogPort {

    List<Equipment> loadEquipment(Integer roomId, EquipmentType type, EquipmentStatus status);

    Optional<Equipment> loadEquipment(Integer equipmentId);

    boolean existsRoom(Integer roomId);
}
