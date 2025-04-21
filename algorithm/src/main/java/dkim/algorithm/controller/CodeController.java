package dkim.algorithm.controller;

import dkim.algorithm.controller.request.FormatCode;
import dkim.algorithm.controller.request.SubmissionCodes;
import dkim.algorithm.model.Response;
import dkim.algorithm.service.CodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/codes")
@RequiredArgsConstructor
public class CodeController {

    private final CodeService codeService;

    @PostMapping
    ResponseEntity submission(@RequestBody SubmissionCodes submissionCodes){
        return Response.OK.getApiResponse(codeService.submission(submissionCodes));
    }

    @PostMapping("/format")
    ResponseEntity formatCode(@RequestBody FormatCode formatCode){
        return Response.OK.getApiResponse(codeService.formatCode(formatCode));
    }

}
