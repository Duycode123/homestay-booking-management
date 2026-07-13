package backend.equipment.application.port.in;

import backend.equipment.application.port.in.command.CreateEquipmentCommand;
import backend.equipment.domain.model.Equipment;

public interface CreateEquipmentUseCase {
    Equipment createEquipment(CreateEquipmentCommand command);
}
