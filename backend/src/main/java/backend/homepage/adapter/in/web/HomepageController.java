package backend.homepage.adapter.in.web;

import backend.common.ApiResponse;
import backend.homepage.application.model.HomepageRecentActivity;
import backend.homepage.application.service.HomepageQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/homepage")
@RequiredArgsConstructor
public class HomepageController {

    private final HomepageQueryService homepageQueryService;

    @GetMapping("/recent-activities")
    public ResponseEntity<ApiResponse<List<HomepageRecentActivity>>> getRecentActivities() {
        List<HomepageRecentActivity> data = homepageQueryService.getRecentActivities();

        return ResponseEntity.ok(ApiResponse.<List<HomepageRecentActivity>>builder()
                .success(true)
                .message("Lay hoat dong trang chu thanh cong")
                .data(data)
                .build());
    }
}
