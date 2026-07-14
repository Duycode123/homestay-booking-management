package backend.refund.adapter.in.web;

import backend.common.ApiResponse;
import backend.refund.adapter.in.web.dto.CompleteRefundRequest;
import backend.refund.adapter.in.web.dto.FailRefundRequest;
import backend.refund.adapter.in.web.dto.RefundResponse;
import backend.refund.application.port.in.ManageRefundUseCase;
import backend.refund.application.port.in.UploadRefundProofUseCase;
import backend.refund.application.port.in.command.CompleteRefundCommand;
import backend.refund.application.port.in.command.FailRefundCommand;
import backend.refund.application.port.in.command.StartRefundCommand;
import backend.refund.application.port.in.query.RefundSearchQuery;
import backend.refund.application.port.out.BuildRefundTransferQrPort;
import backend.refund.domain.model.BookingRefund;
import backend.refund.domain.model.RefundStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/refunds")
@RequiredArgsConstructor
public class AdminRefundController {

    private final ManageRefundUseCase manageRefundUseCase;
    private final UploadRefundProofUseCase uploadRefundProofUseCase;
    private final BuildRefundTransferQrPort buildRefundTransferQrPort;

    @PostMapping(value = "/proofs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProof(
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        try {
            var result = uploadRefundProofUseCase.upload(
                    authentication.getName(),
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getBytes()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response(
                    "Tai anh bien lai thanh cong",
                    Map.of("publicId", result.publicId(), "secureUrl", result.secureUrl())
            ));
        } catch (IOException exception) {
            throw new IllegalArgumentException("Khong the doc anh bien lai tai len");
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RefundResponse>>> listRefunds(
            @RequestParam(required = false) RefundStatus status,
            @RequestParam(required = false) String search
    ) {
        List<RefundResponse> data = manageRefundUseCase.listRefunds(new RefundSearchQuery(status, search))
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(response("Lay danh sach hoan tien thanh cong", data));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<RefundResponse>> start(
            @PathVariable Long id,
            Authentication authentication
    ) {
        RefundResponse data = toResponse(manageRefundUseCase.startRefund(
                new StartRefundCommand(id, authentication.getName())
        ));
        return ResponseEntity.ok(response("Da bat dau xu ly hoan tien", data));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<RefundResponse>> complete(
            @PathVariable Long id,
            @RequestBody @Valid CompleteRefundRequest request,
            Authentication authentication
    ) {
        RefundResponse data = toResponse(manageRefundUseCase.completeRefund(new CompleteRefundCommand(
                id,
                request.transactionReference(),
                request.proofImageUrl(),
                request.adminNote(),
                authentication.getName()
        )));
        return ResponseEntity.ok(response("Da xac nhan hoan tien thanh cong", data));
    }

    @PostMapping("/{id}/fail")
    public ResponseEntity<ApiResponse<RefundResponse>> fail(
            @PathVariable Long id,
            @RequestBody @Valid FailRefundRequest request,
            Authentication authentication
    ) {
        RefundResponse data = toResponse(manageRefundUseCase.failRefund(
                new FailRefundCommand(id, request.failureReason(), authentication.getName())
        ));
        return ResponseEntity.ok(response("Da ghi nhan giao dich hoan tien can xu ly lai", data));
    }

    private <T> ApiResponse<T> response(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }

    private RefundResponse toResponse(BookingRefund refund) {
        return RefundResponse.from(refund, buildRefundTransferQrPort.build(refund).orElse(null));
    }
}
