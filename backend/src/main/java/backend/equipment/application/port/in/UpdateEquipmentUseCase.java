package backend.equipment.application.port.in;

import backend.equipment.application.port.in.command.UpdateEquipmentCommand;
import backend.equipment.domain.model.Equipment;

public interface UpdateEquipmentUseCase {
    Equipment updateEquipment(UpdateEquipmentCommand command);
}
