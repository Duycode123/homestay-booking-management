package backend.homepage.application.port.in;

import backend.homepage.application.model.HomepageRecentActivity;

import java.util.List;

public interface GetRecentHomepageActivitiesUseCase {

    List<HomepageRecentActivity> getRecentActivities();
}
