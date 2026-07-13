package backend.facilitycondition.application.service;

import backend.entity.Role;
import backend.entity.RoomStatus;
import backend.equipment.domain.model.EquipmentStatus;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.facilitycondition.application.model.FacilityActor;
import backend.facilitycondition.application.port.in.GetFacilityConditionHistoryUseCase;
import backend.facilitycondition.application.port.in.RecordEquipmentConditionUseCase;
import backend.facilitycondition.application.port.in.RecordRoomConditionUseCase;
import backend.facilitycondition.application.port.in.UpdateFacilityConditionReportStatusUseCase;
import backend.facilitycondition.application.port.in.UpdateRoomStatusUseCase;
import backend.facilitycondition.application.port.in.command.RecordEquipmentConditionCommand;
import backend.facilitycondition.application.port.in.command.RecordRoomConditionCommand;
import backend.facilitycondition.application.port.in.command.UpdateFacilityConditionReportStatusCommand;
import backend.facilitycondition.application.port.in.command.UpdateRoomStatusCommand;
import backend.facilitycondition.application.port.in.query.FacilityConditionHistoryQuery;
import backend.facilitycondition.application.port.out.FacilityConditionPort;
import backend.facilitycondition.domain.model.FacilityCondition;
import backend.facilitycondition.domain.model.FacilityConditionReport;
import backend.facilitycondition.domain.model.FacilityConditionReportStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityConditionService implements
        UpdateRoomStatusUseCase,
        RecordRoomConditionUseCase,
        RecordEquipmentConditionUseCase,
        GetFacilityConditionHistoryUseCase,
        UpdateFacilityConditionReportStatusUseCase {

    private static final int MAX_NOTE_LENGTH = 500;
    private static final int MAX_IMAGE_URL_LENGTH = 500;
    private static final int MAX_ADMIN_NOTE_LENGTH = 1000;
    private static final int DEFAULT_HISTORY_LIMIT = 50;
    private static final int MAX_HISTORY_LIMIT = 200;

    private final FacilityConditionPort facilityConditionPort;

    @Override
    @Transactional
    public FacilityConditionReport updateRoomStatus(UpdateRoomStatusCommand command) {
        FacilityActor actor = loadStaffActor(command.currentUserEmail());
        Integer roomId = requirePositiveId(command.roomId(), "roomId khong hop le");
        RoomStatus status = requireNonNull(command.status(), "Trang thai phong khong duoc de trong");
        String note = normalizeOptionalText(command.note(), MAX_NOTE_LENGTH, "Ghi chu khong duoc vuot qua 500 ky tu");
        String imageUrl = normalizeImageUrl(command.imageUrl());

        ensureRoomExists(roomId);
        facilityConditionPort.updateRoomStatus(roomId, status);

        return facilityConditionPort.saveReport(FacilityConditionReport.builder()
                .id(UUID.randomUUID())
                .staffId(actor.staffId())
                .roomId(roomId)
                .condition(conditionFromRoomStatus(status))
                .note(note)
                .imageUrl(imageUrl)
                .maintenanceSuggested(status == RoomStatus.MAINTENANCE)
                .roomStatusAfterUpdate(status)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Override
    @Transactional
    public FacilityConditionReport recordRoomCondition(RecordRoomConditionCommand command) {
        FacilityActor actor = loadStaffActor(command.currentUserEmail());
        Integer roomId = requirePositiveId(command.roomId(), "roomId khong hop le");
        FacilityCondition condition = requireNonNull(command.condition(), "Tinh trang phong khong duoc de trong");
        String note = normalizeOptionalText(command.note(), MAX_NOTE_LENGTH, "Ghi chu khong duoc vuot qua 500 ky tu");
        String imageUrl = normalizeImageUrl(command.imageUrl());

        ensureBrokenHasNote(condition, note);
        ensureRoomExists(roomId);

        RoomStatus roomStatus = roomStatusFromCondition(condition);
        facilityConditionPort.updateRoomStatus(roomId, roomStatus);

        return facilityConditionPort.saveReport(FacilityConditionReport.builder()
                .id(UUID.randomUUID())
                .staffId(actor.staffId())
                .roomId(roomId)
                .condition(condition)
                .note(note)
                .imageUrl(imageUrl)
                .maintenanceSuggested(condition == FacilityCondition.BROKEN)
                .roomStatusAfterUpdate(roomStatus)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Override
    @Transactional
    public FacilityConditionReport recordEquipmentCondition(RecordEquipmentConditionCommand command) {
        FacilityActor actor = loadStaffActor(command.currentUserEmail());
        Integer equipmentId = requirePositiveId(command.equipmentId(), "equipmentId khong hop le");
        FacilityCondition condition = requireNonNull(command.condition(), "Tinh trang thiet bi khong duoc de trong");
        String note = normalizeOptionalText(command.note(), MAX_NOTE_LENGTH, "Mo ta khong duoc vuot qua 500 ky tu");
        String imageUrl = normalizeImageUrl(command.imageUrl());

        ensureBrokenHasNote(condition, note);
        Integer roomId = facilityConditionPort.loadEquipmentRoomId(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thiet bi"));

        facilityConditionPort.updateEquipmentStatus(equipmentId, equipmentStatusFromCondition(condition), note);

        return facilityConditionPort.saveReport(FacilityConditionReport.builder()
                .id(UUID.randomUUID())
                .staffId(actor.staffId())
                .roomId(roomId)
                .equipmentId(equipmentId)
                .condition(condition)
                .note(note)
                .imageUrl(imageUrl)
                .maintenanceSuggested(condition == FacilityCondition.BROKEN)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Override
    public List<FacilityConditionReport> getHistory(FacilityConditionHistoryQuery query) {
        int limit = query.limit() == null ? DEFAULT_HISTORY_LIMIT : query.limit();
        if (limit < 1) {
            throw new IllegalArgumentException("limit phai lon hon 0");
        }

        return facilityConditionPort.loadHistory(
                query.roomId(),
                query.equipmentId(),
                query.maintenanceSuggested(),
                Math.min(limit, MAX_HISTORY_LIMIT)
        );
    }

    @Override
    @Transactional
    public FacilityConditionReport updateReportStatus(UpdateFacilityConditionReportStatusCommand command) {
        UUID reportId = requireNonNull(command.reportId(), "reportId khong duoc de trong");
        FacilityConditionReportStatus status = requireNonNull(command.status(), "Trang thai xu ly khong duoc de trong");
        String adminNote = normalizeOptionalText(command.adminNote(), MAX_ADMIN_NOTE_LENGTH, "Ghi chu xu ly khong duoc vuot qua 1000 ky tu");

        return facilityConditionPort.updateReportStatus(reportId, status, adminNote)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay bao cao tinh trang co so vat chat"));
    }

    private FacilityActor loadStaffActor(String email) {
        String normalizedEmail = normalizeRequired(email, "Khong tim thay nguoi dung dang nhap");
        FacilityActor actor = facilityConditionPort.loadActorByEmail(normalizedEmail)
                .orElseThrow(() -> new ForbiddenException("Khong tim thay tai khoan nhan vien"));

        if (actor.role() != Role.STAFF || actor.staffId() == null) {
            throw new ForbiddenException("Chi nhan vien moi duoc ghi nhan tinh trang co so vat chat");
        }

        return actor;
    }

    private void ensureRoomExists(Integer roomId) {
        if (!facilityConditionPort.existsRoom(roomId)) {
            throw new ResourceNotFoundException("Khong tim thay phong homestay");
        }
    }

    private void ensureBrokenHasNote(FacilityCondition condition, String note) {
        if (condition == FacilityCondition.BROKEN && (note == null || note.isBlank())) {
            throw new IllegalArgumentException("Can nhap mo ta khi bao hong");
        }
    }

    private RoomStatus roomStatusFromCondition(FacilityCondition condition) {
        return switch (condition) {
            case GOOD -> RoomStatus.AVAILABLE;
            case NEED_CLEANING -> RoomStatus.NEED_CLEANING;
            case NEED_CHECK, BROKEN -> RoomStatus.MAINTENANCE;
        };
    }

    private FacilityCondition conditionFromRoomStatus(RoomStatus status) {
        return switch (status) {
            case AVAILABLE, IN_USE -> FacilityCondition.GOOD;
            case NEED_CLEANING -> FacilityCondition.NEED_CLEANING;
            case MAINTENANCE -> FacilityCondition.NEED_CHECK;
        };
    }

    private EquipmentStatus equipmentStatusFromCondition(FacilityCondition condition) {
        return switch (condition) {
            case GOOD -> EquipmentStatus.GOOD;
            case BROKEN -> EquipmentStatus.BROKEN;
            case NEED_CLEANING, NEED_CHECK -> EquipmentStatus.MAINTENANCE;
        };
    }

    private Integer requirePositiveId(Integer value, String message) {
        if (value == null || value < 1) {
            throw new IllegalArgumentException(message);
        }

        return value;
    }

    private <T> T requireNonNull(T value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }

        return value;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private String normalizeOptionalText(String value, int maxLength, String message) {
        if (value == null || value.trim().isBlank()) {
            return null;
        }

        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(message);
        }

        return normalized;
    }

    private String normalizeImageUrl(String value) {
        String imageUrl = normalizeOptionalText(value, MAX_IMAGE_URL_LENGTH, "imageUrl khong duoc vuot qua 500 ky tu");
        if (imageUrl == null) {
            return null;
        }

        try {
            URI uri = new URI(imageUrl);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalArgumentException("imageUrl khong hop le");
            }
            return imageUrl;
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("imageUrl khong hop le", ex);
        }
    }
}
