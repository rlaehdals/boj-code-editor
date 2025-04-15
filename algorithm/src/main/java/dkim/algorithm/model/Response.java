package dkim.algorithm.model;

import lombok.Getter;
import lombok.ToString;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;

@Getter
@ToString
public enum Response {

    OK(HttpStatus.OK, SpecificStatus.OK),
    NOT_FOUND_LANGUAGE(HttpStatus.OK, SpecificStatus.NOT_FOUND_LANGUAGE);

    private final HttpStatus httpStatus;

    private final SpecificStatus specificStatus;

    Response(final HttpStatus httpStatus, final SpecificStatus specificStatus) {
        this.httpStatus = httpStatus;
        this.specificStatus = specificStatus;
    }

    public ResponseEntity getApiResponse(Object o) {
        return ResponseEntity
                .status(this.httpStatus)
                .body(ApiResponse.builder()
                        .message(this.specificStatus.name())
                        .sendTime(ZonedDateTime.now(ZoneOffset.UTC))
                        .data(o)
                        .build()
                );

    }

}
