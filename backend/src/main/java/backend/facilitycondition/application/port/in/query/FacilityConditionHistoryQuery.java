package backend.facilitycondition.application.port.in.query;

public record FacilityConditionHistoryQuery(
        Integer roomId,
        Integer equipmentId,
        Boolean maintenanceSuggested,
        Integer limit
) {
}
