package dkim.algorithm.controller.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
public class CodeFormattingResult {

    private String code;
    private String stderr;
    private String exitCode;
    private String status;

}
