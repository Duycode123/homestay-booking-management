package backend.equipment.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class Equipment {

    private final Integer id;
    private final Integer roomId;
    private final String roomName;
    private final EquipmentType type;
    private final String name;
    private final EquipmentStatus status;
    private final String notes;
}
