package com.example.ocr_challenge.controller;

import com.example.ocr_challenge.dto.PostDto;
import com.example.ocr_challenge.dto.PostCreateResponse;
import com.example.ocr_challenge.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<PostCreateResponse> createPost(@RequestBody PostDto request) {
        if (request.getTitle() == null
                || request.getTitle().isBlank()
                || request.getTitle().length() > 200
                || request.getContent() == null
                || request.getContent().isBlank()
                || (request.getAuthor() != null && request.getAuthor().length() > 50)) {
            return ResponseEntity.badRequest().build();
        }
        BoardService.PostCreationResult created = boardService.createPost(
                request.getTitle(),
                request.getContent(),
                request.getAuthor(),
                request.getAttachedOcrText()
        );
        return ResponseEntity.ok(new PostCreateResponse(created.post(), created.deleteToken()));
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
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @RequestHeader(value = "X-Delete-Token", required = false) String deleteToken
    ) {
        return switch (boardService.deletePost(id, deleteToken)) {
            case DELETED -> ResponseEntity.ok().build();
            case NOT_FOUND -> ResponseEntity.notFound().build();
            case FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        };
    }
}
