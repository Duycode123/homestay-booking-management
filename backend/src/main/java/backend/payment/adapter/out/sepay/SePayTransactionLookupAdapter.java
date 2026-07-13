package backend.payment.adapter.out.sepay;

import backend.config.SePayProperties;
import backend.payment.application.port.out.FindSePayIncomingPaymentPort;
import backend.payment.application.port.out.model.SePayIncomingPayment;
import backend.payment.application.port.out.model.SePayIncomingPaymentQuery;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import java.util.regex.Pattern;

@Component
public class SePayTransactionLookupAdapter implements FindSePayIncomingPaymentPort {

    private static final Logger log = LoggerFactory.getLogger(SePayTransactionLookupAdapter.class);
    private static final String SEPAY_V2_TRANSACTIONS_URL = "https://userapi.sepay.vn/v2/transactions";
    private static final String SEPAY_V1_TRANSACTIONS_URL = "https://my.sepay.vn/userapi/transactions/list";
    private static final DateTimeFormatter SEPAY_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Pattern UUID_PATTERN =
            Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

    private final SePayProperties sePayProperties;
    private final RestClient restClient;

    @Autowired
    public SePayTransactionLookupAdapter(SePayProperties sePayProperties) {
        this(sePayProperties, RestClient.create());
    }

    SePayTransactionLookupAdapter(SePayProperties sePayProperties, RestClient restClient) {
        this.sePayProperties = sePayProperties;
        this.restClient = restClient;
    }

    @Override
    public Optional<SePayIncomingPayment> findIncomingPayment(SePayIncomingPaymentQuery query) {
        String accessToken = blankToNull(sePayProperties.getApiAccessToken());
        if (accessToken == null) {
            return Optional.empty();
        }

        Optional<SePayIncomingPayment> v2Payment = querySePayV2(query, accessToken);
        if (v2Payment.isPresent()) {
            return v2Payment;
        }

        return querySePayV1(query, accessToken);
    }

    private Optional<SePayIncomingPayment> querySePayV2(SePayIncomingPaymentQuery query, String accessToken) {
        try {
            JsonNode response = restClient.get()
                    .uri(buildV2TransactionsUri(query))
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);

            return findMatchingTransaction(response == null ? null : response.path("data"), query);
        } catch (RestClientException | IllegalArgumentException exception) {
            log.warn("Cannot query SePay v2 transactions for payment {}", query.paymentReference(), exception);
            return Optional.empty();
        }
    }

    private Optional<SePayIncomingPayment> querySePayV1(SePayIncomingPaymentQuery query, String accessToken) {
        try {
            JsonNode response = restClient.get()
                    .uri(buildV1TransactionsUri(query))
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);

            return findMatchingTransaction(response == null ? null : response.path("transactions"), query);
        } catch (RestClientException | IllegalArgumentException exception) {
            log.warn("Cannot query SePay v1 transactions for payment {}", query.paymentReference(), exception);
            return Optional.empty();
        }
    }

    private URI buildV2TransactionsUri(SePayIncomingPaymentQuery query) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(SEPAY_V2_TRANSACTIONS_URL)
                .queryParam("q", query.paymentReference())
                .queryParam("transfer_type", "in")
                .queryParam("transaction_date_from", formatStartOfDay(query))
                .queryParam("transaction_date_to", formatEndOfDay(query))
                .queryParam("amount_in_min", toVndInteger(query.expectedAmount()))
                .queryParam("amount_in_max", toVndInteger(query.expectedAmount()))
                .queryParam("per_page", 20);

        String bankAccountId = resolveV2BankAccountId();
        if (bankAccountId != null) {
            uriBuilder.queryParam("bank_account_id", bankAccountId);
        }

        return uriBuilder.build().encode().toUri();
    }

    private URI buildV1TransactionsUri(SePayIncomingPaymentQuery query) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(SEPAY_V1_TRANSACTIONS_URL)
                .queryParam("amount_in", toVndInteger(query.expectedAmount()))
                .queryParam("transaction_date_min", query.fromDate())
                .queryParam("transaction_date_max", query.toDate())
                .queryParam("limit", 20);

        String accountNumber = resolveAccountNumber();
        if (accountNumber != null) {
            uriBuilder.queryParam("account_number", accountNumber);
        }

        return uriBuilder.build().encode().toUri();
    }

    private Optional<SePayIncomingPayment> findMatchingTransaction(JsonNode transactions, SePayIncomingPaymentQuery query) {
        if (transactions == null || !transactions.isArray()) {
            return Optional.empty();
        }

        for (JsonNode item : transactions) {
            if (!matchesConfiguredBankAccount(item)) {
                continue;
            }

            BigDecimal amountIn = amount(item.path("amount_in"));
            if (amountIn == null || amountIn.compareTo(query.expectedAmount().setScale(2, RoundingMode.HALF_UP)) < 0) {
                continue;
            }

            String code = text(item.path("code"));
            String content = text(item.path("transaction_content"));
            if (!matchesReference(query.paymentReference(), code, content)) {
                continue;
            }

            LocalDateTime transactionDate = parseTransactionDate(text(item.path("transaction_date")));
            if (transactionDate != null && query.createdAt() != null && transactionDate.isBefore(query.createdAt().minusMinutes(1))) {
                continue;
            }

            return Optional.of(new SePayIncomingPayment(
                    text(item.path("id")),
                    amountIn,
                    content,
                    code,
                    transactionDate
            ));
        }

        return Optional.empty();
    }

    private String formatStartOfDay(SePayIncomingPaymentQuery query) {
        return SEPAY_DATE_TIME_FORMATTER.format(query.fromDate().atStartOfDay());
    }

    private String formatEndOfDay(SePayIncomingPaymentQuery query) {
        return SEPAY_DATE_TIME_FORMATTER.format(query.toDate().atTime(23, 59, 59));
    }

    private boolean matchesConfiguredBankAccount(JsonNode item) {
        String configuredAccountNumber = resolveAccountNumber();
        if (configuredAccountNumber != null) {
            String actualAccountNumber = text(item.path("account_number"));
            if (configuredAccountNumber.equals(actualAccountNumber)) {
                return true;
            }
        }

        String configuredBankAccountId = blankToNull(sePayProperties.getApiBankAccountId());
        if (configuredBankAccountId != null) {
            String actualBankAccountId = text(item.path("bank_account_id"));
            return configuredBankAccountId.equals(actualBankAccountId);
        }

        return true;
    }

    private String resolveV2BankAccountId() {
        String configuredBankAccountId = blankToNull(sePayProperties.getApiBankAccountId());
        if (configuredBankAccountId == null || !UUID_PATTERN.matcher(configuredBankAccountId).matches()) {
            return null;
        }

        return configuredBankAccountId;
    }

    private boolean matchesReference(String paymentReference, String code, String content) {
        String normalizedReference = normalize(paymentReference);
        return normalizedReference.equals(normalize(code))
                || normalize(content).contains(normalizedReference);
    }

    private String resolveAccountNumber() {
        String configured = blankToNull(sePayProperties.getApiAccountNumber());
        return configured == null ? blankToNull(sePayProperties.getQrBankAccount()) : configured;
    }

    private BigDecimal amount(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }

        try {
            return new BigDecimal(node.asText()).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private LocalDateTime parseTransactionDate(String rawDate) {
        if (rawDate == null) {
            return null;
        }

        try {
            return LocalDateTime.parse(rawDate, SEPAY_DATE_TIME_FORMATTER);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String toVndInteger(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String text(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }

        String value = node.asText();
        return value == null || value.isBlank() ? null : value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase().replace("-", "");
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }
}
