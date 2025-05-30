package dkim.algorithm.controller.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class FormattingCodeResponse {

    private String formattedCode;
    private String errorMessage;

}
