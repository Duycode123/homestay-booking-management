package backend.config;

import backend.entity.RoomType;
import backend.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DefaultRoomTypeSeeder implements ApplicationRunner {

    private final RoomTypeRepository roomTypeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (roomTypeRepository.count() > 0) {
            return;
        }

        roomTypeRepository.saveAll(List.of(
                RoomType.builder()
                        .typeName("Standard")
                        .description("Phòng tiện nghi cơ bản, phù hợp cho 1-2 khách.")
                        .pricePerHour(new BigDecimal("350000"))
                        .build(),
                RoomType.builder()
                        .typeName("Deluxe")
                        .description("Phòng rộng rãi, có ban công và tiện nghi nâng cấp.")
                        .pricePerHour(new BigDecimal("550000"))
                        .build(),
                RoomType.builder()
                        .typeName("Family")
                        .description("Phòng gia đình có không gian sinh hoạt và sức chứa lớn.")
                        .pricePerHour(new BigDecimal("750000"))
                        .build()
        ));
    }
}
