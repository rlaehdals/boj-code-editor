package dkim.algorithm.controller.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionCodesResponse {

    private String expectedAnswer;
    private String realAnswer;
    private String errorMessage;

}
