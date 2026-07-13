package backend.equipment.application.port.in;

import backend.equipment.application.port.in.query.GetEquipmentDetailQuery;
import backend.equipment.domain.model.Equipment;

public interface GetEquipmentDetailUseCase {
    Equipment getEquipmentDetail(GetEquipmentDetailQuery query);
}
