package backend.equipment.application.port.in.command;

public record DeleteEquipmentCommand(
        Integer equipmentId,
        String currentUserEmail
) {
}
