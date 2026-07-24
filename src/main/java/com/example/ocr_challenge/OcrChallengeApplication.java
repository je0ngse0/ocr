package com.example.ocr_challenge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OcrChallengeApplication {

	static {
		String existing = System.getProperty("jna.library.path");
		String homebrewLib = "/opt/homebrew/lib:/usr/local/lib";
		if (existing == null || existing.isBlank()) {
			System.setProperty("jna.library.path", homebrewLib);
		} else if (!existing.contains("/opt/homebrew/lib")) {
			System.setProperty("jna.library.path", existing + ":" + homebrewLib);
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(OcrChallengeApplication.class, args);
	}

}
