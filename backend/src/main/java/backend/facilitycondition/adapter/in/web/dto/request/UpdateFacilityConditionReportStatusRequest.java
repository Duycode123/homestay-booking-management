package backend.facilitycondition.adapter.in.web.dto.request;

import backend.facilitycondition.domain.model.FacilityConditionReportStatus;

public record UpdateFacilityConditionReportStatusRequest(
        FacilityConditionReportStatus status,
        String adminNote
) {
}
