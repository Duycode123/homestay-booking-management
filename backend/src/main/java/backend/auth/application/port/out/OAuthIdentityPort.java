package backend.auth.application.port.out;

import java.util.Optional;

public interface OAuthIdentityPort {
    Optional<Integer> findAccountId(String provider, String providerSubject);

    void link(Integer accountId, String provider, String providerSubject);

    void recordLogin(String provider, String providerSubject);
}
