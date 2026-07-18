package backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;
import java.util.TimeZone;

@Configuration
public class TimeConfig {

    public TimeConfig(@Value("${app.time-zone:Asia/Ho_Chi_Minh}") String timeZone) {
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of(timeZone)));
    }

    @Bean
    public Clock systemClock(@Value("${app.time-zone:Asia/Ho_Chi_Minh}") String timeZone) {
        return Clock.system(ZoneId.of(timeZone));
    }
}
