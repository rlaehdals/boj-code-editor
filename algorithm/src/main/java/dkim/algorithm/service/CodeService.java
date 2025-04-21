package dkim.algorithm.service;

import dkim.algorithm.controller.request.FormatCode;
import dkim.algorithm.controller.request.Language;
import dkim.algorithm.controller.request.SubmissionCodes;
import dkim.algorithm.controller.response.CodeFormattingResult;
import dkim.algorithm.controller.response.CodeSubmissionResult;
import dkim.algorithm.controller.response.FormattingCodeResponse;
import dkim.algorithm.controller.response.SubmissionCodesResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeService {

    private final RestTemplate restTemplate;

    @Value("${code.executor.url:default}")
    private String BASE_URL;

    public SubmissionCodesResponse submission(final SubmissionCodes submissionCodes) {
        String languagePath = getLanguagePath(submissionCodes.getLanguage());
        String baseUrl = getBaseUrl(languagePath);

        if (languagePath == null) {
            return new SubmissionCodesResponse(null, null, "NOT_SUPPORT_LANGUAGE");
        }

        String url = baseUrl + "/execute";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<SubmissionCodes> requestEntity = new HttpEntity<>(submissionCodes, headers);

        CodeSubmissionResult result = restTemplate.postForObject(url, requestEntity, CodeSubmissionResult.class);

        if (result != null && (result.getStderr() == null || result.getStderr().isEmpty())) {
            return new SubmissionCodesResponse(submissionCodes.getExpectedAnswer(), result.getStdout(), null);
        } else {
            return new SubmissionCodesResponse(null, null, result != null ? result.getStderr() : "Execution failed");
        }
    }

    private String getBaseUrl(String languagePath) {
        if(!BASE_URL.contains("default")){
            return BASE_URL;
        }else{
            return switch (languagePath) {
                case "java" -> "http://" + languagePath + "-executor" + ":8081";
                case "python" -> "http://" + languagePath + "-executor" + ":8082";
                case "javascript" -> "http://" + languagePath + "-executor" + ":8083";
                default -> null;
            };
        }
    }

    private String getLanguagePath(Language language) {
        return switch (language) {
            case JAVA -> "java";
            case PYTHON -> "python";
            case JAVASCRIPT -> "javascript";
            default -> null;
        };
    }

    public Object formatCode(final FormatCode formatCode) {
        String languagePath = getLanguagePath(formatCode.getLanguage());
        String baseUrl = getBaseUrl(languagePath);

        String url = baseUrl + "/format";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<FormatCode> requestEntity = new HttpEntity<>(formatCode, headers);

        CodeFormattingResult result = restTemplate.postForObject(url, requestEntity, CodeFormattingResult.class);

        if (result != null && (result.getStderr() == null || result.getStderr().isEmpty())) {
            return new FormattingCodeResponse(result.getCode(), "");
        } else {
            return new FormattingCodeResponse(null, result.getStderr());
        }
    }
}