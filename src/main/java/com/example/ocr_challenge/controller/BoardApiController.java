package com.example.ocr_challenge.controller;

import com.example.ocr_challenge.dto.PostDto;
import com.example.ocr_challenge.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BoardApiController {

    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<List<PostDto>> getAllPosts() {
        return ResponseEntity.ok(boardService.getAllPosts());
    }

    @PostMapping
    public ResponseEntity<PostDto> createPost(@RequestBody PostDto request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        PostDto created = boardService.createPost(
                request.getTitle(),
                request.getContent(),
                request.getAuthor(),
                request.getAttachedOcrText()
        );
        return ResponseEntity.ok(created);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Void> likePost(@PathVariable Long id) {
        boolean success = boardService.likePost(id);
        if (success) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        boolean success = boardService.deletePost(id);
        if (success) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
