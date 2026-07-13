package backend.facilitycondition.application.port.in.command;

import backend.facilitycondition.domain.model.FacilityCondition;

public record RecordEquipmentConditionCommand(
        String currentUserEmail,
        Integer equipmentId,
        FacilityCondition condition,
        String note,
        String imageUrl
) {
}
