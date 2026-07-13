package backend.facilitycondition.application.service;

import backend.entity.Role;
import backend.equipment.domain.model.EquipmentStatus;
import backend.facilitycondition.application.model.FacilityActor;
import backend.facilitycondition.application.port.in.command.RecordEquipmentConditionCommand;
import backend.facilitycondition.application.port.in.command.UpdateFacilityConditionReportStatusCommand;
import backend.facilitycondition.application.port.out.FacilityConditionPort;
import backend.facilitycondition.domain.model.FacilityCondition;
import backend.facilitycondition.domain.model.FacilityConditionReport;
import backend.facilitycondition.domain.model.FacilityConditionReportStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FacilityConditionServiceTest {

    @Mock
    private FacilityConditionPort facilityConditionPort;

    private FacilityConditionService service;

    @BeforeEach
    void setUp() {
        service = new FacilityConditionService(facilityConditionPort);
    }

    @Test
    void recordEquipmentConditionRejectsBrokenWithoutNote() {
        when(facilityConditionPort.loadActorByEmail("staff@example.com"))
                .thenReturn(Optional.of(new FacilityActor(10, 20, Role.STAFF)));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.recordEquipmentCondition(new RecordEquipmentConditionCommand(
                        "staff@example.com",
                        1,
                        FacilityCondition.BROKEN,
                        "",
                        null
                ))
        );
    }

    @Test
    void recordEquipmentConditionCreatesMaintenanceSuggestionWhenBroken() {
        when(facilityConditionPort.loadActorByEmail("staff@example.com"))
                .thenReturn(Optional.of(new FacilityActor(10, 20, Role.STAFF)));
        when(facilityConditionPort.loadEquipmentRoomId(3)).thenReturn(Optional.of(7));
        when(facilityConditionPort.saveReport(any(FacilityConditionReport.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.recordEquipmentCondition(new RecordEquipmentConditionCommand(
                "staff@example.com",
                3,
                FacilityCondition.BROKEN,
                "Mat trong bi rach",
                null
        ));

        verify(facilityConditionPort).updateEquipmentStatus(3, EquipmentStatus.BROKEN, "Mat trong bi rach");

        ArgumentCaptor<FacilityConditionReport> reportCaptor = ArgumentCaptor.forClass(FacilityConditionReport.class);
        verify(facilityConditionPort).saveReport(reportCaptor.capture());

        FacilityConditionReport report = reportCaptor.getValue();
        assertTrue(report.maintenanceSuggested());
        assertTrue(report.staffId().equals(20));
        assertTrue(report.roomId().equals(7));
        assertTrue(report.equipmentId().equals(3));
    }

    @Test
    void updateReportStatusPersistsAdminHandlingFields() {
        UUID reportId = UUID.randomUUID();
        FacilityConditionReport updatedReport = FacilityConditionReport.builder()
                .id(reportId)
                .staffId(20)
                .roomId(7)
                .condition(FacilityCondition.BROKEN)
                .maintenanceSuggested(true)
                .status(FacilityConditionReportStatus.RESOLVED)
                .adminNote("Da sua mixer")
                .build();
        when(facilityConditionPort.updateReportStatus(
                eq(reportId),
                eq(FacilityConditionReportStatus.RESOLVED),
                eq("Da sua mixer")
        )).thenReturn(Optional.of(updatedReport));

        FacilityConditionReport result = service.updateReportStatus(new UpdateFacilityConditionReportStatusCommand(
                reportId,
                FacilityConditionReportStatus.RESOLVED,
                "  Da sua mixer  "
        ));

        assertTrue(result.status().equals(FacilityConditionReportStatus.RESOLVED));
        verify(facilityConditionPort).updateReportStatus(reportId, FacilityConditionReportStatus.RESOLVED, "Da sua mixer");
    }
}
