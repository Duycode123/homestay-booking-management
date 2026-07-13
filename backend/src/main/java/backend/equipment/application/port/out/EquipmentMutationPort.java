package backend.equipment.application.port.out;

import backend.equipment.domain.model.Equipment;

public interface EquipmentMutationPort {

    Equipment save(Equipment equipment);

    void deleteEquipment(Integer equipmentId);
}
