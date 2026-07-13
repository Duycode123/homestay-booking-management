package backend.facilitycondition.application.model;

import backend.entity.Role;

public record FacilityActor(
        Integer accountId,
        Integer staffId,
        Role role
) {
}
