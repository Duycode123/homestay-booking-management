package backend.refund.application.service;

import backend.refund.application.model.RefundProofFile;
import backend.refund.application.model.RefundProofUploadResult;
import backend.refund.application.port.out.RefundProofStoragePort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefundProofUploadServiceTest {

    @Mock
    private RefundProofStoragePort storagePort;

    private RefundProofUploadService service;

    @BeforeEach
    void setUp() {
        service = new RefundProofUploadService(storagePort);
    }

    @Test
    void uploadsValidPngEvidence() {
        byte[] png = new byte[]{
                (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1
        };
        RefundProofUploadResult expected = new RefundProofUploadResult("refund-1", "https://cdn/refund-1.png");
        when(storagePort.upload(org.mockito.ArgumentMatchers.any())).thenReturn(expected);

        RefundProofUploadResult actual = service.upload("admin@example.com", "receipt.png", "image/png", png);

        assertThat(actual).isEqualTo(expected);
        ArgumentCaptor<RefundProofFile> captor = ArgumentCaptor.forClass(RefundProofFile.class);
        verify(storagePort).upload(captor.capture());
        assertThat(captor.getValue().contentType()).isEqualTo("image/png");
        assertThat(captor.getValue().content()).isEqualTo(png);
    }

    @Test
    void rejectsFileWhoseBytesDoNotMatchDeclaredImageType() {
        byte[] disguisedScript = "<script>alert(1)</script>".getBytes(java.nio.charset.StandardCharsets.UTF_8);

        assertThatThrownBy(() -> service.upload(
                "admin@example.com",
                "receipt.png",
                "image/png",
                disguisedScript
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("khong khop");

        verifyNoInteractions(storagePort);
    }

    @Test
    void rejectsEvidenceLargerThanFiveMegabytes() {
        byte[] oversized = new byte[5 * 1024 * 1024 + 1];

        assertThatThrownBy(() -> service.upload(
                "admin@example.com",
                "large.jpg",
                "image/jpeg",
                oversized
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5MB");

        verifyNoInteractions(storagePort);
    }
}
