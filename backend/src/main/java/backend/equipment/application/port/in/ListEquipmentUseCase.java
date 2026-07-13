package backend.equipment.application.port.in;

import backend.equipment.application.port.in.query.ListEquipmentQuery;
import backend.equipment.domain.model.Equipment;

import java.util.List;

public interface ListEquipmentUseCase {
    List<Equipment> getEquipment(ListEquipmentQuery query);
}
