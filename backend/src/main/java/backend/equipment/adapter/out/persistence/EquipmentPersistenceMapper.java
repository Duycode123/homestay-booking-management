package backend.equipment.adapter.out.persistence;

import backend.equipment.domain.model.Equipment;
import backend.entity.Room;
import org.springframework.stereotype.Component;

@Component
public class EquipmentPersistenceMapper {

    public Equipment toDomain(EquipmentJpaEntity entity) {
        return Equipment.builder()
                .id(entity.getId())
                .roomId(entity.getRoom().getId())
                .roomName(entity.getRoom().getRoomName())
                .type(entity.getType())
                .name(entity.getName())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .build();
    }

    public void updateEntity(EquipmentJpaEntity entity, Equipment equipment, Room room) {
        entity.setRoom(room);
        entity.setType(equipment.getType());
        entity.setName(equipment.getName());
        entity.setStatus(equipment.getStatus());
        entity.setNotes(equipment.getNotes());
    }
}
