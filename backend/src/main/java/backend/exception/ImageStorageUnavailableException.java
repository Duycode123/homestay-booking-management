package backend.exception;

public class ImageStorageUnavailableException extends RuntimeException {

    public ImageStorageUnavailableException(String message) {
        super(message);
    }

    public ImageStorageUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
