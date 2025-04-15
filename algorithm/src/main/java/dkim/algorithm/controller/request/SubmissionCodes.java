package dkim.algorithm.controller.request;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class SubmissionCodes {

    private String code;
    private String input;
    private String expectedAnswer;
    private Language language;

}
