package backend.support.adapter.in.web.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCustomerIssueReportRequest {

    private String issueType;
    private String bookingCode;
    private String description;
}
