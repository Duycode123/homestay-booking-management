package backend.amenity.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface CommonAmenityJpaRepository extends JpaRepository<CommonAmenityEntity, Long> {
    List<CommonAmenityEntity> findAllByActiveTrueOrderByDisplayOrderAscNameAsc();
    List<CommonAmenityEntity> findAllByOrderByDisplayOrderAscNameAsc();
    boolean existsByNameIgnoreCase(String name);
}
