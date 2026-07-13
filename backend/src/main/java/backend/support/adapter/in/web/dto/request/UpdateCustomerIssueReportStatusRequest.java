package backend.support.adapter.in.web.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCustomerIssueReportStatusRequest {

    private String status;
    private String adminNote;
}
