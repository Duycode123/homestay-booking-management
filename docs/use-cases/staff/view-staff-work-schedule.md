# View Staff Work Schedule

## Business Goal

Allow a staff member to see assigned shifts and the room bookings that overlap a selected shift so they can prepare rooms and equipment before customers arrive.

## Actors

- Primary actor: Staff
- Supporting actors: Staff scheduling data, booking system

## Preconditions

- The caller is authenticated.
- The authenticated account has a staff profile.
- Shift data exists in the `shift` table.

## Main Flow - View Assigned Shifts

1. Staff opens the work schedule view.
2. Backend resolves the staff profile from the authenticated account email.
3. Backend loads shifts assigned to that staff member for the requested `fromDate` and `toDate`.
4. If no date range is supplied, backend defaults to the current week.
5. Backend returns shift id, date, start time, and end time.

## Main Flow - View Room Bookings In A Shift

1. Staff selects one shift.
2. Backend resolves the staff profile from the authenticated account email.
3. Backend verifies the selected shift belongs to that staff member.
4. Backend loads non-cancelled bookings whose time window overlaps the shift window.
5. Backend returns bookings ordered by start time.

## Main Flow - Register Available Shifts

1. Staff opens the work schedule view and chooses to register shifts.
2. Frontend shows the next week for registration while the staff schedule view remains focused on the current week.
3. Frontend loads existing registrations for the staff member in that next-week range.
4. Staff selects one or more shift slots and submits them.
5. Backend validates the caller is a staff account, normalizes each slot, rejects overlapping slots, rejects slots outside the next week, and stores valid registrations as `PENDING`.
6. Admin approval later turns an approved registration into an assigned shift.

## Main Flow - Admin Arrange Staff Schedule

1. Admin opens the staff schedule approval view in week or month mode.
2. Frontend loads staff shift registrations for the visible date range.
3. Admin clicks a date cell to see staff who registered for that date.
4. Admin selects one or more pending registrations across the visible calendar.
5. Admin saves the schedule.
6. Frontend approves the selected registrations through the admin decision endpoint.
7. Backend creates assigned shifts for approved registrations, and those shifts appear on each staff member's schedule page.

## Alternate And Error Flows

- No assigned shifts: backend returns an empty list.
- Shift has no bookings: backend returns an empty list.
- Selected shift does not exist: backend returns not found.
- Selected shift belongs to another staff member: backend returns forbidden.
- Authenticated account does not have a staff profile: backend returns forbidden.
- Invalid date range where `fromDate` is after `toDate`: backend returns bad request.
- Registration has no slots: backend returns bad request.
- Registration includes a slot outside next week: backend returns bad request.
- Registration overlaps an existing pending or approved registration, an assigned shift, or another submitted slot: backend returns conflict-style validation through the global error handler.
- Admin saves with no selected registrations: frontend blocks the save.
- Admin approval conflicts with an already assigned overlapping shift: backend rejects that registration decision.

## Business Rules

- Staff can only see their own shifts.
- Staff can only open bookings for a shift assigned to themselves.
- Booking lookup uses overlapping time windows: `booking.startTime < shiftEnd` and `booking.endTime > shiftStart`.
- Cancelled bookings are excluded from the shift booking list.
- Staff can only register shifts for next week.
- Staff can submit at most 21 registration slots per request.
- New staff registrations start as `PENDING`; rejected slots can be submitted again.
- Request/response DTOs stay in the web adapter; ownership and range rules live in the application service.

## Related Endpoints

- `GET /api/staff/schedule/shifts?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
- `GET /api/staff/schedule/shifts/{shiftId}/bookings`
- `GET /api/staff/shift-registrations/my?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
- `POST /api/staff/shift-registrations`
- `GET /api/admin/shift-registrations?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&staffId=ID`
- `PATCH /api/admin/shift-registrations/{registrationId}/decision`

## Data Touched

- `staff`: maps authenticated account to staff profile.
- `shift`: stores assigned staff shifts.
- `staff_shift_registration`: stores staff shift registration requests and approval status.
- `booking`: stores room booking windows and status.
- `room`: provides room name for booking response.
- `customer`: provides customer name for booking response.

## Current Implementation Notes

- Implemented in `backend.staffschedule` with incremental hexagonal boundaries.
- `StaffScheduleController` is the inbound web adapter.
- `StaffShiftRegistrationController` is the inbound web adapter for staff registration submission and lookup.
- `StaffScheduleUseCaseService` enforces staff ownership and date range rules.
- `ShiftRegistrationUseCaseService` enforces next-week registration, overlap checks, and approval workflow rules.
- `StaffSchedulePersistenceAdapter` reads shifts and bookings through outbound persistence ports.
- `JdbcShiftRegistrationAdapter` persists registration requests through outbound persistence ports.

## Known Gaps

- Empty state text is handled by the frontend using empty response lists.
- Equipment details are currently represented by booking `equipmentNotes`; structured per-equipment booking data is not available in the current persistence model.
