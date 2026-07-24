package com.example.ocr_challenge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrStatus {
    private boolean available;
    private String tessdataPath;
    private String message;
    private List<String> availableLanguages;
}
