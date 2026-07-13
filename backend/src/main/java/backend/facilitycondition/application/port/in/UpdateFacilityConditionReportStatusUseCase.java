package backend.facilitycondition.application.port.in;

import backend.facilitycondition.application.port.in.command.UpdateFacilityConditionReportStatusCommand;
import backend.facilitycondition.domain.model.FacilityConditionReport;

public interface UpdateFacilityConditionReportStatusUseCase {
    FacilityConditionReport updateReportStatus(UpdateFacilityConditionReportStatusCommand command);
}
