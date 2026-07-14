package backend.refund.application.port.out;

import backend.refund.application.model.RefundProofFile;
import backend.refund.application.model.RefundProofUploadResult;

public interface RefundProofStoragePort {
    RefundProofUploadResult upload(RefundProofFile file);
}
