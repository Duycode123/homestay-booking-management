package backend.staff.adapter.in.web;

import backend.common.ApiResponse;
import backend.staff.adapter.in.web.dto.CreateStaffAccountRequest;
import backend.staff.adapter.in.web.dto.StaffAccountResponse;
import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.CreateStaffAccountUseCase;
import backend.staff.application.port.in.DisableStaffAccountUseCase;
import backend.staff.application.port.in.GetStaffAccountDetailUseCase;
import backend.staff.application.port.in.ListStaffAccountsUseCase;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;
import backend.staff.application.port.in.command.DisableStaffAccountCommand;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
public class AdminStaffController {

    private final CreateStaffAccountUseCase createStaffAccountUseCase;
    private final ListStaffAccountsUseCase listStaffAccountsUseCase;
    private final GetStaffAccountDetailUseCase getStaffAccountDetailUseCase;
    private final DisableStaffAccountUseCase disableStaffAccountUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffAccountResponse>>> listStaffAccounts() {
        List<StaffAccountResponse> data = listStaffAccountsUseCase.listStaffAccounts().stream()
                .map(StaffAccountResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.<List<StaffAccountResponse>>builder()
                .success(true)
                .message("Lay danh sach nhan vien thanh cong")
                .data(data)
                .build());
    }

    @GetMapping("/{staffId}")
    public ResponseEntity<ApiResponse<StaffAccountResponse>> getStaffAccountDetail(@PathVariable Integer staffId) {
        StaffAccountResponse data = StaffAccountResponse.from(
                getStaffAccountDetailUseCase.getStaffAccountDetail(staffId)
        );

        return ResponseEntity.ok(ApiResponse.<StaffAccountResponse>builder()
                .success(true)
                .message("Lay thong tin nhan vien thanh cong")
                .data(data)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StaffAccountResponse>> createStaffAccount(
            @Valid @RequestBody CreateStaffAccountRequest request
    ) {
        StaffAccountResult result = createStaffAccountUseCase.createStaffAccount(
                new CreateStaffAccountCommand(
                        request.fullName(),
                        request.email(),
                        request.phone(),
                        request.dateOfBirth(),
                        request.initialPassword()
                )
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<StaffAccountResponse>builder()
                .success(true)
                .message("Tao tai khoan nhan vien thanh cong")
                .data(StaffAccountResponse.from(result))
                .build());
    }

    @PatchMapping("/{staffId}/disable")
    public ResponseEntity<ApiResponse<StaffAccountResponse>> disableStaffAccount(@PathVariable Integer staffId) {
        StaffAccountResult result = disableStaffAccountUseCase.disableStaffAccount(
                new DisableStaffAccountCommand(staffId)
        );

        return ResponseEntity.ok(ApiResponse.<StaffAccountResponse>builder()
                .success(true)
                .message("Vo hieu hoa tai khoan nhan vien thanh cong")
                .data(StaffAccountResponse.from(result))
                .build());
    }
}
