package backend.staffcustomer.adapter.in.web;

import backend.common.ApiResponse;
import backend.staffcustomer.adapter.in.web.dto.StaffCustomerSummaryResponse;
import backend.staffcustomer.application.port.in.ListStaffCustomersUseCase;
import backend.staffcustomer.application.port.in.query.ListStaffCustomersQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff/customers")
@RequiredArgsConstructor
public class StaffCustomerController {

    private final ListStaffCustomersUseCase listStaffCustomersUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffCustomerSummaryResponse>>> listCustomers(Authentication authentication) {
        List<StaffCustomerSummaryResponse> data = listStaffCustomersUseCase
                .listCustomers(new ListStaffCustomersQuery(authentication.getName(), LocalDate.now()))
                .stream()
                .map(StaffCustomerSummaryResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.<List<StaffCustomerSummaryResponse>>builder()
                .success(true)
                .message("Danh sach khach hang cua nhan vien")
                .data(data)
                .build());
    }
}
