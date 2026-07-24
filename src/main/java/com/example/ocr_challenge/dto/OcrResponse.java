package com.example.ocr_challenge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrResponse {
    private boolean success;
    private String text;
    private long processingTimeMs;
    private String fileName;
    private long fileSize;
    private int wordCount;
    private int lineCount;
    private String engine;
    private String errorMessage;

    public static OcrResponse error(String fileName, String errorMessage) {
        return OcrResponse.builder()
                .success(false)
                .fileName(fileName)
                .errorMessage(errorMessage)
                .build();
    }
}
