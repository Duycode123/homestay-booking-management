package backend.repository;

import backend.entity.ReviewAdminResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewAdminResponseRepository extends JpaRepository<ReviewAdminResponse, Integer> {

    Optional<ReviewAdminResponse> findByReview_Id(Integer reviewId);
}
