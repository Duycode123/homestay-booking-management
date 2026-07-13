package backend.facilitycondition.application.port.out;

import backend.entity.RoomStatus;
import backend.equipment.domain.model.EquipmentStatus;
import backend.facilitycondition.application.model.FacilityActor;
import backend.facilitycondition.domain.model.FacilityConditionReport;
import backend.facilitycondition.domain.model.FacilityConditionReportStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FacilityConditionPort {
    Optional<FacilityActor> loadActorByEmail(String email);

    boolean existsRoom(Integer roomId);

    Optional<Integer> loadEquipmentRoomId(Integer equipmentId);

    void updateRoomStatus(Integer roomId, RoomStatus status);

    void updateEquipmentStatus(Integer equipmentId, EquipmentStatus status, String note);

    FacilityConditionReport saveReport(FacilityConditionReport report);

    List<FacilityConditionReport> loadHistory(Integer roomId, Integer equipmentId, Boolean maintenanceSuggested, int limit);

    Optional<FacilityConditionReport> updateReportStatus(
            UUID reportId,
            FacilityConditionReportStatus status,
            String adminNote
    );
}
