package backend.facilitycondition.application.port.in.command;

import backend.facilitycondition.domain.model.FacilityCondition;

public record RecordRoomConditionCommand(
        String currentUserEmail,
        Integer roomId,
        FacilityCondition condition,
        String note,
        String imageUrl
) {
}
