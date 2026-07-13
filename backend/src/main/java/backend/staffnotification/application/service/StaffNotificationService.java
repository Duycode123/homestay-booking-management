package backend.staffnotification.application.service;

import backend.entity.Role;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.staffnotification.application.model.StaffNotificationActor;
import backend.staffnotification.application.model.StaffNotificationItem;
import backend.staffnotification.application.port.in.StaffNotificationUseCase;
import backend.staffnotification.application.port.in.command.StaffNotificationCommand;
import backend.staffnotification.application.port.out.StaffNotificationPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffNotificationService implements StaffNotificationUseCase {

    private final StaffNotificationPort staffNotificationPort;

    @Override
    public List<StaffNotificationItem> listNotifications(String currentUserEmail) {
        StaffNotificationActor actor = loadStaffActor(currentUserEmail);
        return staffNotificationPort.loadNotifications(actor.accountId());
    }

    @Override
    @Transactional
    public StaffNotificationItem markRead(StaffNotificationCommand command) {
        StaffNotificationActor actor = loadStaffActor(command.currentUserEmail());
        return staffNotificationPort.markRead(command.notificationId(), actor.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thong bao"));
    }

    @Override
    @Transactional
    public StaffNotificationItem resolve(StaffNotificationCommand command) {
        StaffNotificationActor actor = loadStaffActor(command.currentUserEmail());
        return staffNotificationPort.resolve(command.notificationId(), actor.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thong bao"));
    }

    @Override
    @Transactional
    public List<StaffNotificationItem> markAllRead(String currentUserEmail) {
        StaffNotificationActor actor = loadStaffActor(currentUserEmail);
        return staffNotificationPort.markAllRead(actor.accountId());
    }

    private StaffNotificationActor loadStaffActor(String email) {
        String normalizedEmail = normalizeRequired(email, "Khong tim thay nguoi dung dang nhap");
        StaffNotificationActor actor = staffNotificationPort.loadActorByEmail(normalizedEmail)
                .orElseThrow(() -> new ForbiddenException("Khong tim thay tai khoan nhan vien"));

        if (actor.role() != Role.STAFF || actor.staffId() == null) {
            throw new ForbiddenException("Chi nhan vien moi duoc xem thong bao nhan vien");
        }

        return actor;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }
}
