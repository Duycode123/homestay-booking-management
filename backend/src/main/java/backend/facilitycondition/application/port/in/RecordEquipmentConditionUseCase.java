package backend.facilitycondition.application.port.in;

import backend.facilitycondition.application.port.in.command.RecordEquipmentConditionCommand;
import backend.facilitycondition.domain.model.FacilityConditionReport;

public interface RecordEquipmentConditionUseCase {
    FacilityConditionReport recordEquipmentCondition(RecordEquipmentConditionCommand command);
}
