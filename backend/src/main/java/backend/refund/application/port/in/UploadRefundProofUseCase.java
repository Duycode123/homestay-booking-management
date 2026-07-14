package backend.refund.application.port.in;

import backend.refund.application.model.RefundProofUploadResult;

public interface UploadRefundProofUseCase {
    RefundProofUploadResult upload(String adminEmail, String fileName, String contentType, byte[] content);
}
