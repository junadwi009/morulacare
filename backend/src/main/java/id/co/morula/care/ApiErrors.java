package id.co.morula.care;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler({org.springframework.dao.DataAccessException.class, org.springframework.transaction.TransactionException.class})
    ResponseEntity<Models.ApiError> storageUnavailable(Exception ignored) {
        return ResponseEntity.status(503).body(new Models.ApiError("DEMO_STORAGE_UNAVAILABLE", "Penyimpanan demo tidak tersedia. Coba muat ulang; data tidak diganti dengan fixture lokal."));
    }
    @ExceptionHandler(ApiException.class)
    ResponseEntity<Models.ApiError> api(ApiException ex) {
        return ResponseEntity.status(ex.status).body(new Models.ApiError(ex.code, ex.getMessage()));
    }
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class, MissingRequestHeaderException.class})
    ResponseEntity<Models.ApiError> badInput(Exception ignored) {
        return ResponseEntity.badRequest().body(new Models.ApiError("INVALID_REQUEST", "Periksa format dan panjang isian. Data tidak diproses."));
    }
}
