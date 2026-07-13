package backend.facilitycondition.application.port.in;

import backend.facilitycondition.application.port.in.command.RecordRoomConditionCommand;
import backend.facilitycondition.domain.model.FacilityConditionReport;

public interface RecordRoomConditionUseCase {
    FacilityConditionReport recordRoomCondition(RecordRoomConditionCommand command);
}
