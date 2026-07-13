package backend.equipment.application.port.in.command;

import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;

public record UpdateEquipmentCommand(
        Integer equipmentId,
        Integer roomId,
        EquipmentType type,
        String name,
        EquipmentStatus status,
        String notes,
        String currentUserEmail
) {
}
