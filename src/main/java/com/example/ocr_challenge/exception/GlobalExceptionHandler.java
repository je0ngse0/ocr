package com.example.ocr_challenge.exception;

import com.example.ocr_challenge.dto.OcrResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<OcrResponse> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(OcrResponse.error("none", "파일 크기가 제한(10MB)을 초과했습니다. 더 작은 이미지를 업로드하세요."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<OcrResponse> handleIllegalArgument(IllegalArgumentException exc) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(OcrResponse.error("none", exc.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<OcrResponse> handleGeneralException(Exception exc) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(OcrResponse.error("none", "서버 내부 오류: " + exc.getMessage()));
    }
}
