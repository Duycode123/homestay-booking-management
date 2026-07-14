package backend.refund.application.model;

public record RefundProofFile(String fileName, String contentType, byte[] content) {
}
