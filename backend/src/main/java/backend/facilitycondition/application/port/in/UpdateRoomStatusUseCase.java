package backend.facilitycondition.application.port.in;

import backend.facilitycondition.application.port.in.command.UpdateRoomStatusCommand;
import backend.facilitycondition.domain.model.FacilityConditionReport;

public interface UpdateRoomStatusUseCase {
    FacilityConditionReport updateRoomStatus(UpdateRoomStatusCommand command);
}
