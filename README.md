# OCR Studio

이미지에서 한국어와 영어 텍스트를 추출하고, 결과를 교정·복사·저장할 수 있는
Spring Boot 기반 웹 OCR 도구입니다.

## 주요 기능

- PNG, JPG, JPEG, WEBP, BMP 이미지 업로드 및 미리보기
- 한국어, 영어, 한국어+영어 OCR
- 추출 결과 직접 편집
- 텍스트 복사, 음성 읽기, TXT 다운로드
- 최근 OCR 작업을 브라우저에 최대 20개까지 저장
- 작업 이력 검색, 다시 불러오기, 개별/전체 삭제

## 실행 환경

- Java 17
- Spring Boot
- Tess4J / Tesseract OCR

macOS에서는 Tesseract와 언어 데이터를 먼저 설치합니다.

```shell
brew install tesseract tesseract-lang
```

애플리케이션을 실행합니다.

```shell
./gradlew bootRun
```

브라우저에서 `http://localhost:8080`에 접속합니다.

기본 tessdata 경로가 다른 경우 `TESSDATA_PREFIX` 환경 변수로 지정할 수 있습니다.
