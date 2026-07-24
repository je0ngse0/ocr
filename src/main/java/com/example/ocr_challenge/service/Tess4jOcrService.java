package com.example.ocr_challenge.service;

import com.example.ocr_challenge.dto.OcrResponse;
import com.example.ocr_challenge.dto.OcrStatus;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
public class Tess4jOcrService implements OcrService {

    static {
        // Ensure JNA native library search path includes macOS Homebrew path
        String existing = System.getProperty("jna.library.path");
        String homebrewLib = "/opt/homebrew/lib:/usr/local/lib";
        if (existing == null || existing.isBlank()) {
            System.setProperty("jna.library.path", homebrewLib);
        } else if (!existing.contains("/opt/homebrew/lib")) {
            System.setProperty("jna.library.path", existing + ":" + homebrewLib);
        }
    }

    @Value("${ocr.tessdata.path:/opt/homebrew/share/tessdata}")
    private String tessdataPath;

    @Value("${ocr.default.language:kor+eng}")
    private String defaultLanguage;

    @Override
    public OcrResponse extractText(MultipartFile file, String language) {
        if (file == null || file.isEmpty()) {
            return OcrResponse.error("unknown", "업로드된 파일이 비어 있습니다.");
        }

        String fileName = file.getOriginalFilename();
        long fileSize = file.getSize();
        long startTime = System.currentTimeMillis();
        String selectedLang = (language != null && !language.isBlank()) ? language : defaultLanguage;

        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                return OcrResponse.error(fileName, "유효한 이미지 파일이 아닙니다. (PNG, JPG, BMP 등 지원)");
            }

            // Image preprocessing for improved OCR stability
            BufferedImage processedImage = preprocessImage(image);

            ITesseract instance = new Tesseract();
            
            // Set tessdata path if directory exists
            if (Files.exists(Paths.get(tessdataPath))) {
                instance.setDatapath(tessdataPath);
            }

            instance.setLanguage(selectedLang);

            String resultText = instance.doOCR(processedImage).trim();
            long endTime = System.currentTimeMillis();

            int lineCount = resultText.isEmpty() ? 0 : resultText.split("\r\n|\r|\n").length;
            int wordCount = resultText.isEmpty() ? 0 : resultText.split("\\s+").length;

            return OcrResponse.builder()
                    .success(true)
                    .text(resultText)
                    .processingTimeMs(endTime - startTime)
                    .fileName(fileName)
                    .fileSize(fileSize)
                    .lineCount(lineCount)
                    .wordCount(wordCount)
                    .engine("Tess4J (Tesseract OCR)")
                    .build();

        } catch (UnsatisfiedLinkError | NoClassDefFoundError e) {
            return OcrResponse.error(fileName, 
                "Tesseract 네이티브 C++ 라이브러리 연동 실패 (libtesseract.dylib).\n" +
                "해결방법: macOS 터미널에서 'brew install tesseract tesseract-lang'을 실행하고 서버를 재시작해 주세요.\n" +
                "오류 원인: " + e.getMessage());
        } catch (TesseractException e) {
            return OcrResponse.error(fileName, "OCR 인식 중 오류가 발생했습니다: " + e.getMessage());
        } catch (IOException e) {
            return OcrResponse.error(fileName, "이미지 파일을 읽는 도중 오류가 발생했습니다: " + e.getMessage());
        } catch (Throwable e) {
            return OcrResponse.error(fileName, "처리 중 오류 발생: " + e.getMessage());
        }
    }

    @Override
    public OcrStatus getEngineStatus() {
        Path tessPath = Paths.get(tessdataPath);
        boolean pathExists = Files.exists(tessPath) && Files.isDirectory(tessPath);
        List<String> languages = new ArrayList<>();

        if (pathExists) {
            try (var stream = Files.list(tessPath)) {
                languages = stream
                        .map(Path::getFileName)
                        .map(Path::toString)
                        .filter(name -> name.endsWith(".traineddata"))
                        .map(name -> name.replace(".traineddata", ""))
                        .sorted()
                        .toList();
            } catch (IOException ignored) {
            }
        }

        boolean available = false;
        String message;

        try {
            ITesseract instance = new Tesseract();
            if (pathExists) {
                instance.setDatapath(tessdataPath);
            }
            available = true;
            message = "Tesseract OCR 엔진이 준비되었습니다.";
        } catch (UnsatisfiedLinkError | NoClassDefFoundError e) {
            message = "Tesseract C/C++ 네이티브 라이브러리가 로드되지 않았습니다. (brew install tesseract)";
        } catch (Throwable e) {
            message = "Tesseract 초기화 알림: " + e.getMessage();
        }

        return OcrStatus.builder()
                .available(available)
                .tessdataPath(tessdataPath)
                .availableLanguages(languages)
                .message(message)
                .build();
    }

    /**
     * Grayscale image conversion for OCR enhancement
     */
    private BufferedImage preprocessImage(BufferedImage original) {
        BufferedImage gray = new BufferedImage(
                original.getWidth(),
                original.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY
        );
        var g = gray.createGraphics();
        g.drawImage(original, 0, 0, null);
        g.dispose();
        return gray;
    }
}
