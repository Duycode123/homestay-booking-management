package backend.staffschedule.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ShiftRepository extends JpaRepository<ShiftJpaEntity, Integer> {

    List<ShiftJpaEntity> findByStaff_IdAndDateBetweenOrderByDateAscStartTimeAsc(
            Integer staffId,
            LocalDate fromDate,
            LocalDate toDate
    );
}
