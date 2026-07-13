package backend.facilitycondition.application.port.in.command;

import backend.facilitycondition.domain.model.FacilityConditionReportStatus;

import java.util.UUID;

public record UpdateFacilityConditionReportStatusCommand(
        UUID reportId,
        FacilityConditionReportStatus status,
        String adminNote
) {
}
