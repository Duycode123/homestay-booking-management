package backend.repository;

import backend.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomTypeRepository extends JpaRepository<RoomType, Integer> {
    List<RoomType> findAllByOrderByTypeNameAsc();

    boolean existsByTypeName(String typeName);
}
