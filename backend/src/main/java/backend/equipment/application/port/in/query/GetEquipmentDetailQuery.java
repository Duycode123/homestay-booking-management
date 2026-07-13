package backend.equipment.application.port.in.query;

public record GetEquipmentDetailQuery(
        Integer equipmentId,
        String currentUserEmail
) {
}
