package backend.facilitycondition.adapter.in.web.dto.response;

import backend.entity.RoomStatus;
import backend.facilitycondition.domain.model.FacilityCondition;
import backend.facilitycondition.domain.model.FacilityConditionReport;
import backend.facilitycondition.domain.model.FacilityConditionReportStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record FacilityConditionReportResponse(
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
    public static FacilityConditionReportResponse from(FacilityConditionReport report) {
        return new FacilityConditionReportResponse(
                report.id(),
                report.staffId(),
                report.roomId(),
                report.equipmentId(),
                report.condition(),
                report.note(),
                report.imageUrl(),
                report.maintenanceSuggested(),
                report.roomStatusAfterUpdate(),
                report.status(),
                report.adminNote(),
                report.resolvedAt(),
                report.createdAt()
        );
    }
}
