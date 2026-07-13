package backend.payment.adapter.out.sepay;

import backend.config.SePayProperties;
import backend.payment.application.port.out.model.SePayIncomingPaymentQuery;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class SePayTransactionLookupAdapterTest {

    @Test
    void findsIncomingPaymentFromSePayV2TransactionsApi() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        SePayProperties properties = properties();
        SePayTransactionLookupAdapter adapter = new SePayTransactionLookupAdapter(properties, builder.build());

        server.expect(once(), requestTo(startsWith("https://userapi.sepay.vn/v2/transactions?")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer test-token"))
                .andExpect(queryParam("q", "PAY1234567890ABCDEF"))
                .andExpect(queryParam("amount_in_min", "50000"))
                .andExpect(queryParam("amount_in_max", "50000"))
                .andRespond(withSuccess("""
                        {
                          "status": "success",
                          "data": [
                            {
                              "id": "sepay-v2-transaction-1",
                              "transaction_date": "2026-07-09 19:05:30",
                              "account_number": "0924054707",
                              "amount_in": 50000,
                              "amount_out": 0,
                              "transaction_content": "Thanh toan PAY1234567890ABCDEF",
                              "code": null,
                              "bank_account_id": "488553b4-7074-11f1-b21a-a6006ab65aca",
                              "transfer_type": "in"
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        var result = adapter.findIncomingPayment(query());

        assertTrue(result.isPresent());
        assertEquals("sepay-v2-transaction-1", result.get().providerTransactionId());
        assertEquals(new BigDecimal("50000.00"), result.get().amount());
        server.verify();
    }

    @Test
    void fallsBackToLegacySePayV1TransactionsApi() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        SePayProperties properties = properties();
        SePayTransactionLookupAdapter adapter = new SePayTransactionLookupAdapter(properties, builder.build());

        server.expect(once(), requestTo(startsWith("https://userapi.sepay.vn/v2/transactions?")))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "status": "success",
                          "data": []
                        }
                        """, MediaType.APPLICATION_JSON));

        server.expect(once(), requestTo(startsWith("https://my.sepay.vn/userapi/transactions/list?")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer test-token"))
                .andExpect(queryParam("amount_in", "50000"))
                .andExpect(queryParam("account_number", "0924054707"))
                .andRespond(withSuccess("""
                        {
                          "status": 200,
                          "transactions": [
                            {
                              "id": "49682",
                              "transaction_date": "2026-07-09 19:05:30",
                              "account_number": "0924054707",
                              "amount_in": "50000.00",
                              "amount_out": "0.00",
                              "transaction_content": "Thanh toan PAY1234567890ABCDEF",
                              "code": null,
                              "bank_account_id": "67982"
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        var result = adapter.findIncomingPayment(query());

        assertTrue(result.isPresent());
        assertEquals("49682", result.get().providerTransactionId());
        assertEquals(new BigDecimal("50000.00"), result.get().amount());
        server.verify();
    }

    private SePayProperties properties() {
        SePayProperties properties = new SePayProperties();
        properties.setApiAccessToken("test-token");
        properties.setApiBankAccountId("67982");
        properties.setApiAccountNumber("0924054707");
        return properties;
    }

    private SePayIncomingPaymentQuery query() {
        return new SePayIncomingPaymentQuery(
                "PAY1234567890ABCDEF",
                new BigDecimal("50000.00"),
                LocalDate.of(2026, 7, 9),
                LocalDate.of(2026, 7, 9),
                LocalDateTime.of(2026, 7, 9, 19, 0)
        );
    }
}
