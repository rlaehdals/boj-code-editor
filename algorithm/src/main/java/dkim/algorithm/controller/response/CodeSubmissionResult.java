package dkim.algorithm.controller.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
public class CodeSubmissionResult {

    private String stdout;
    private String stderr;
    private String exitCode;
    private String status;

}
