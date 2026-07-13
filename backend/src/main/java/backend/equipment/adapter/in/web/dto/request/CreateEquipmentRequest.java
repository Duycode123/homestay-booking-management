package backend.equipment.adapter.in.web.dto.request;

import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateEquipmentRequest {

    @NotNull(message = "roomId khong duoc de trong")
    private Integer roomId;

    @NotNull(message = "Loai thiet bi khong duoc de trong")
    private EquipmentType type;

    @NotBlank(message = "Ten thiet bi khong duoc de trong")
    private String name;

    private EquipmentStatus status;

    private String notes;
}
