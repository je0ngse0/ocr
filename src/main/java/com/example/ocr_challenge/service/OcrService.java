package com.example.ocr_challenge.service;

import com.example.ocr_challenge.dto.OcrResponse;
import com.example.ocr_challenge.dto.OcrStatus;
import org.springframework.web.multipart.MultipartFile;

public interface OcrService {
    OcrResponse extractText(MultipartFile file, String language);
    OcrStatus getEngineStatus();
}
