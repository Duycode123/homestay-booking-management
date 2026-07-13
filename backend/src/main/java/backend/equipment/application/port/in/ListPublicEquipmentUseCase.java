package backend.equipment.application.port.in;

import backend.equipment.application.port.in.query.ListPublicEquipmentQuery;
import backend.equipment.domain.model.Equipment;

import java.util.List;

public interface ListPublicEquipmentUseCase {

    List<Equipment> getPublicEquipment(ListPublicEquipmentQuery query);
}
