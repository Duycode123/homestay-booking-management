package backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.sepay")
public class SePayProperties {

    private String environment;
    private String checkoutUrl;
    private String merchantId;
    private String secretKey;
    private String successUrl;
    private String errorUrl;
    private String cancelUrl;
    private String qrBankAccount;
    private String qrBankCode;
    private String qrTemplate = "compact";
    private String apiAccessToken;
    private String apiBankAccountId;
    private String apiAccountNumber;

    /**
     * Shared secret that SePay sends back on each webhook call via the
     * {@code Authorization: Apikey <secret>} header. When blank (local/dev),
     * webhook authentication is skipped so the flow can be exercised without a
     * real SePay account; when set, every webhook must present a matching header.
     */
    private String ipnSecret;
    private String webhookHmacSecret;
    private long webhookTimestampToleranceSeconds = 300;

    private String operation;
    private String method;
    private String transactionType;
    private String currency;
    private String portalSignatureParam = "signature";
}
