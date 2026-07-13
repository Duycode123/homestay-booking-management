package backend.staffschedule.adapter.out.persistence;

import backend.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StaffScheduleStaffRepository extends JpaRepository<Staff, Integer> {

    Optional<Staff> findByAccount_Email(String email);
}
