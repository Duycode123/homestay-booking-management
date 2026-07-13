package backend.equipment.adapter.in.web.dto.response;

import backend.equipment.domain.model.Equipment;
import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class EquipmentResponse {

    private Integer id;
    private Integer roomId;
    private String roomName;
    private EquipmentType type;
    private String name;
    private EquipmentStatus status;
    private String notes;

    public static EquipmentResponse from(Equipment equipment) {
        return EquipmentResponse.builder()
                .id(equipment.getId())
                .roomId(equipment.getRoomId())
                .roomName(equipment.getRoomName())
                .type(equipment.getType())
                .name(equipment.getName())
                .status(equipment.getStatus())
                .notes(equipment.getNotes())
                .build();
    }
}
