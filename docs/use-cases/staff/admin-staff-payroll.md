# Admin staff payroll

## Business goal

Allow an administrator to calculate a simple monthly salary for each staff member from completed attendance hours.

## Actors

- Administrator
- Staff member, through the existing check-in/check-out flow

## Preconditions

- The administrator assigns an hourly rate to each staff member.
- A staff member has a scheduled shift before using attendance check-in/check-out.

## Main flow

1. A staff member checks in and checks out for a shift.
2. Attendance stores the completed work duration in hours.
3. The administrator opens a month in the payroll page.
4. The system sums only `DONE` attendance rows that have a check-out time.
5. Salary is calculated as `completed work hours × staff hourly rate`.
6. The administrator finalizes the payroll to preserve a snapshot.
7. After payment, the administrator marks the period as paid.

## Business rules

- Salary is hourly only; there is no monthly-salary, leave-pay, bonus, tax, or insurance calculation in this project scope.
- A shift without check-in creates no attendance hours and therefore no salary.
- `WORKING` and `MISSING_CHECKOUT` attendance rows are excluded from salary.
- Zero work hours always produces zero salary.
- Hourly rates cannot be negative and are editable while reviewing a draft payroll.
- Finalized payroll items preserve the hours, hourly rate, and salary used at finalization time.
- A payroll must be finalized before it can be marked paid.

## Endpoints

- `GET /api/admin/payroll?year={year}&month={month}`
- `PATCH /api/admin/payroll/staff/{staffId}/hourly-rate?year={year}&month={month}`
- `POST /api/admin/payroll/{year}/{month}/finalize`
- `POST /api/admin/payroll/{year}/{month}/mark-paid`

## Data touched

- `staff.hourly_rate`
- `staff_attendance`
- `payroll_period`
- `payroll_item`
