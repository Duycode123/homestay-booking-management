package backend.facilitycondition.application.port.in;

import backend.facilitycondition.application.port.in.query.FacilityConditionHistoryQuery;
import backend.facilitycondition.domain.model.FacilityConditionReport;

import java.util.List;

public interface GetFacilityConditionHistoryUseCase {
    List<FacilityConditionReport> getHistory(FacilityConditionHistoryQuery query);
}
