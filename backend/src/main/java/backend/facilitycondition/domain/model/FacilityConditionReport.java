package backend.facilitycondition.domain.model;

import backend.entity.RoomStatus;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder(toBuilder = true)
public record FacilityConditionReport(
        UUID id,
        Integer staffId,
        Integer roomId,
        Integer equipmentId,
        FacilityCondition condition,
        String note,
        String imageUrl,
        boolean maintenanceSuggested,
        RoomStatus roomStatusAfterUpdate,
        FacilityConditionReportStatus status,
        String adminNote,
        LocalDateTime resolvedAt,
        LocalDateTime createdAt
) {
}
