package backend.repository;

import backend.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Integer> {
    Optional<Staff> findByAccount_Email(String email);

    List<Staff> findAllByOrderByIdAsc();

    boolean existsByEmailIgnoreCase(String email);
}
