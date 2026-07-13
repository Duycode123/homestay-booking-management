package backend.equipment.application.port.in.query;

import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;

public record ListEquipmentQuery(
        Integer roomId,
        EquipmentType type,
        EquipmentStatus status,
        String currentUserEmail
) {
}
