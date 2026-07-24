package com.example.ocr_challenge.controller;

import com.example.ocr_challenge.dto.OcrResponse;
import com.example.ocr_challenge.dto.OcrStatus;
import com.example.ocr_challenge.service.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OcrApiController {

    private final OcrService ocrService;

    @PostMapping("/extract")
    public ResponseEntity<OcrResponse> extractText(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "lang", defaultValue = "kor+eng") String lang) {
        
        OcrResponse response = ocrService.extractText(file, lang);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<OcrStatus> getStatus() {
        return ResponseEntity.ok(ocrService.getEngineStatus());
    }
}
