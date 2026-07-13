package backend.staffschedule.application.service;

import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.staffschedule.application.port.in.DecideShiftRegistrationUseCase;
import backend.staffschedule.application.port.in.GetMyShiftRegistrationsUseCase;
import backend.staffschedule.application.port.in.ListShiftRegistrationsForAdminUseCase;
import backend.staffschedule.application.port.in.SubmitShiftRegistrationsUseCase;
import backend.staffschedule.application.port.in.command.DecideShiftRegistrationCommand;
import backend.staffschedule.application.port.in.command.ShiftRegistrationSlotCommand;
import backend.staffschedule.application.port.in.command.SubmitShiftRegistrationsCommand;
import backend.staffschedule.application.port.in.query.GetMyShiftRegistrationsQuery;
import backend.staffschedule.application.port.in.query.ListShiftRegistrationsQuery;
import backend.staffschedule.application.port.out.ShiftAssignmentPort;
import backend.staffschedule.application.port.out.ShiftRegistrationActorPort;
import backend.staffschedule.application.port.out.ShiftRegistrationPort;
import backend.staffschedule.domain.model.ShiftRegistration;
import backend.staffschedule.domain.model.ShiftRegistrationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShiftRegistrationUseCaseService implements
        SubmitShiftRegistrationsUseCase,
        GetMyShiftRegistrationsUseCase,
        ListShiftRegistrationsForAdminUseCase,
        DecideShiftRegistrationUseCase {

    private static final int MAX_SLOTS_PER_REQUEST = 21;
    private static final int MAX_REJECTION_REASON_LENGTH = 500;

    private final ShiftRegistrationActorPort actorPort;
    private final ShiftRegistrationPort registrationPort;
    private final ShiftAssignmentPort assignmentPort;
    private final Clock clock;

    @Override
    @Transactional
    public List<ShiftRegistration> submitShiftRegistrations(SubmitShiftRegistrationsCommand command) {
        Integer staffId = currentStaffId(command.staffEmail());
        List<ShiftRegistrationSlotCommand> slots = requireSlots(command.slots());
        LocalDateTime now = LocalDateTime.now(clock);
        List<ShiftRegistrationSlotCommand> normalizedSlots = new ArrayList<>();
        List<ShiftRegistration> registrations = new ArrayList<>();

        for (ShiftRegistrationSlotCommand slot : slots) {
            ShiftRegistrationSlotCommand normalizedSlot = normalizeSlot(slot);
            requireNextWeek(normalizedSlot.workDate());
            ensureSlotDoesNotOverlapRequest(normalizedSlot, normalizedSlots);
            ensureSlotDoesNotOverlapExistingSchedule(staffId, normalizedSlot);

            normalizedSlots.add(normalizedSlot);
            registrations.add(registrationPort.save(new ShiftRegistration(
                    null,
                    staffId,
                    null,
                    null,
                    normalizedSlot.workDate(),
                    normalizedSlot.startTime(),
                    normalizedSlot.endTime(),
                    ShiftRegistrationStatus.PENDING,
                    null,
                    null,
                    null,
                    now,
                    now
            )));
        }

        return registrations;
    }

    @Override
    public List<ShiftRegistration> getMyShiftRegistrations(GetMyShiftRegistrationsQuery query) {
        Integer staffId = currentStaffId(query.staffEmail());
        DateRange range = normalizeMyRegistrationRange(query.fromDate(), query.toDate());
        return registrationPort.loadStaffRegistrations(staffId, range.fromDate(), range.toDate());
    }

    @Override
    public List<ShiftRegistration> listShiftRegistrations(ListShiftRegistrationsQuery query) {
        validateDateRange(query.fromDate(), query.toDate());
        return registrationPort.searchRegistrations(
                query.status(),
                query.fromDate(),
                query.toDate(),
                query.staffId()
        );
    }

    @Override
    @Transactional
    public ShiftRegistration decideShiftRegistration(DecideShiftRegistrationCommand command) {
        Integer registrationId = requireId(command.registrationId(), "registrationId khong duoc de trong");
        Integer reviewerAccountId = currentAccountId(command.adminEmail());
        boolean approved = requireApprovedDecision(command.approved());
        LocalDateTime now = LocalDateTime.now(clock);

        ShiftRegistration registration = registrationPort.loadRegistration(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dang ky ca lam"));

        if (registration.status() != ShiftRegistrationStatus.PENDING) {
            throw new IllegalStateException("Chi co the xu ly dang ky ca dang cho duyet");
        }

        if (approved) {
            ensureSlotDoesNotOverlapAssignedShift(
                    registration.staffId(),
                    registration.workDate(),
                    registration.startTime(),
                    registration.endTime()
            );
            ShiftRegistration decidedRegistration = registration.approve(reviewerAccountId, now);
            ShiftRegistration savedRegistration = registrationPort.updateDecision(decidedRegistration);
            assignmentPort.createAssignedShift(
                    registration.staffId(),
                    registration.workDate(),
                    registration.startTime(),
                    registration.endTime()
            );
            return savedRegistration;
        }

        String rejectionReason = normalizeRejectionReason(command.rejectionReason());
        return registrationPort.updateDecision(registration.reject(reviewerAccountId, now, rejectionReason));
    }

    private Integer currentStaffId(String email) {
        if (email == null || email.isBlank()) {
            throw new ForbiddenException("Ban can dang nhap bang tai khoan nhan vien");
        }

        return actorPort.loadStaffIdByAccountEmail(email.trim())
                .orElseThrow(() -> new ForbiddenException("Chi nhan vien moi duoc dang ky ca lam"));
    }

    private Integer currentAccountId(String email) {
        if (email == null || email.isBlank()) {
            throw new ForbiddenException("Ban can dang nhap bang tai khoan admin");
        }

        return actorPort.loadAccountIdByEmail(email.trim())
                .orElseThrow(() -> new ForbiddenException("Khong tim thay tai khoan admin"));
    }

    private List<ShiftRegistrationSlotCommand> requireSlots(List<ShiftRegistrationSlotCommand> slots) {
        if (slots == null || slots.isEmpty()) {
            throw new IllegalArgumentException("Danh sach ca dang ky khong duoc de trong");
        }
        if (slots.size() > MAX_SLOTS_PER_REQUEST) {
            throw new IllegalArgumentException("Moi lan chi duoc dang ky toi da 21 ca");
        }
        return slots;
    }

    private ShiftRegistrationSlotCommand normalizeSlot(ShiftRegistrationSlotCommand slot) {
        if (slot == null) {
            throw new IllegalArgumentException("Ca dang ky khong duoc de trong");
        }
        if (slot.workDate() == null) {
            throw new IllegalArgumentException("Ngay lam viec khong duoc de trong");
        }
        if (slot.startTime() == null) {
            throw new IllegalArgumentException("Gio bat dau khong duoc de trong");
        }
        if (slot.endTime() == null) {
            throw new IllegalArgumentException("Gio ket thuc khong duoc de trong");
        }
        if (!slot.startTime().isBefore(slot.endTime())) {
            throw new IllegalArgumentException("Gio bat dau phai truoc gio ket thuc");
        }
        return slot;
    }

    private void requireNextWeek(LocalDate workDate) {
        LocalDate nextWeekStart = startOfWeek(LocalDate.now(clock)).plusWeeks(1);
        LocalDate nextWeekEnd = nextWeekStart.plusDays(6);

        if (workDate.isBefore(nextWeekStart) || workDate.isAfter(nextWeekEnd)) {
            throw new IllegalArgumentException("Chi duoc dang ky ca cho tuan toi");
        }
    }

    private DateRange normalizeMyRegistrationRange(LocalDate fromDate, LocalDate toDate) {
        LocalDate normalizedFromDate = fromDate;
        LocalDate normalizedToDate = toDate;

        if (normalizedFromDate == null && normalizedToDate == null) {
            normalizedFromDate = startOfWeek(LocalDate.now(clock)).plusWeeks(1);
            normalizedToDate = normalizedFromDate.plusDays(6);
        } else if (normalizedFromDate == null) {
            normalizedFromDate = normalizedToDate;
        } else if (normalizedToDate == null) {
            normalizedToDate = normalizedFromDate;
        }

        validateDateRange(normalizedFromDate, normalizedToDate);
        return new DateRange(normalizedFromDate, normalizedToDate);
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate khong duoc sau toDate");
        }
    }

    private void ensureSlotDoesNotOverlapRequest(
            ShiftRegistrationSlotCommand newSlot,
            List<ShiftRegistrationSlotCommand> existingSlots
    ) {
        boolean overlaps = existingSlots.stream()
                .anyMatch(existingSlot -> overlaps(existingSlot, newSlot));

        if (overlaps) {
            throw new IllegalStateException("Danh sach dang ky co ca bi trung gio");
        }
    }

    private void ensureSlotDoesNotOverlapExistingSchedule(
            Integer staffId,
            ShiftRegistrationSlotCommand slot
    ) {
        if (registrationPort.existsOverlappingPendingOrApprovedRegistration(
                staffId,
                slot.workDate(),
                slot.startTime(),
                slot.endTime()
        )) {
            throw new IllegalStateException("Ban da co dang ky ca trung gio");
        }

        ensureSlotDoesNotOverlapAssignedShift(staffId, slot.workDate(), slot.startTime(), slot.endTime());
    }

    private void ensureSlotDoesNotOverlapAssignedShift(
            Integer staffId,
            LocalDate workDate,
            LocalTime startTime,
            LocalTime endTime
    ) {
        if (assignmentPort.existsOverlappingAssignedShift(staffId, workDate, startTime, endTime)) {
            throw new IllegalStateException("Nhan vien da co ca lam trung gio");
        }
    }

    private boolean overlaps(ShiftRegistrationSlotCommand left, ShiftRegistrationSlotCommand right) {
        return left.workDate().equals(right.workDate())
                && left.startTime().isBefore(right.endTime())
                && left.endTime().isAfter(right.startTime());
    }

    private boolean requireApprovedDecision(Boolean approved) {
        if (approved == null) {
            throw new IllegalArgumentException("approved khong duoc de trong");
        }
        return approved;
    }

    private String normalizeRejectionReason(String rejectionReason) {
        if (rejectionReason == null || rejectionReason.trim().isBlank()) {
            throw new IllegalArgumentException("Ly do tu choi khong duoc de trong");
        }

        String normalizedReason = rejectionReason.trim();
        if (normalizedReason.length() > MAX_REJECTION_REASON_LENGTH) {
            throw new IllegalArgumentException("Ly do tu choi khong duoc vuot qua 500 ky tu");
        }
        return normalizedReason;
    }

    private Integer requireId(Integer id, String message) {
        if (id == null) {
            throw new IllegalArgumentException(message);
        }
        return id;
    }

    private LocalDate startOfWeek(LocalDate date) {
        return date.minusDays(date.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue());
    }

    private record DateRange(LocalDate fromDate, LocalDate toDate) {
    }
}
