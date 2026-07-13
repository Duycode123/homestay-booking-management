package backend.equipment.application.port.in;

import backend.equipment.application.port.in.command.DeleteEquipmentCommand;

public interface DeleteEquipmentUseCase {
    void deleteEquipment(DeleteEquipmentCommand command);
}
