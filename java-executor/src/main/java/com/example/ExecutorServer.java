package com.example;

import static spark.Spark.*;

import com.google.googlejavaformat.java.Formatter;
import com.google.gson.*;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

public class ExecutorServer {

    private static final int PORT = 8081;
    private static final int MAX_THREADS = 5;
    private static final long TIMEOUT_SECONDS = 10;

    private static final ExecutorService executor = Executors.newFixedThreadPool(MAX_THREADS);

    private static final List<String> FORBIDDEN_APIS = List.of(
            "Runtime", "ProcessBuilder", "System.exit", "System.load", "System.loadLibrary", "exec", "System.setProperty",
            "System.getProperty", "File", "Files", "Path", "FileInputStream", "FileOutputStream", "java.nio.file",
            "Socket", "URL", "HttpClient", "java.lang.reflect", "getDeclaredMethod", "getMethod", "getDeclaredField", "Class.forName",
            "Unsafe", "sun.misc.Unsafe", "ClassLoader", "defineClass",
            "Thread", "Runnable", "Executor", "ExecutorService", "ThreadPoolExecutor",
            "ForkJoinPool", "CompletableFuture", "Callable"
    );

    public static void main(String[] args) {
        port(PORT);

        final String allowedOrigin = System.getenv("ALLOWED_ORIGIN");

        options("/*", (request, response) -> {
            String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
            if (accessControlRequestHeaders != null) {
                response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }

            String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
            if (accessControlRequestMethod != null) {
                response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
            }

            return "OK";
        });

        before((request, response) -> {
            response.header("Access-Control-Allow-Origin", allowedOrigin != null ? allowedOrigin : "*");
            response.header("Access-Control-Allow-Credentials", "true");
        });

        post("/format", (req, res) -> {
            res.type("application/json");

            JsonObject requestJson = JsonParser.parseString(req.body()).getAsJsonObject();
            String code = requestJson.get("code").getAsString();

            try {
                String formattedCode = formatJavaCode(code);
                return formatJsonResponse(formattedCode);
            } catch (Exception e) {
                return buildErrorResponse("Formatting Error: " + e.getMessage(), -1, "FORMATTING_ERROR");
            }
        });

        post("/execute", (req, res) -> {
            res.type("application/json");

            Future<String> future = executor.submit(() -> handleExecution(req.body()));

            try {
                return future.get(TIMEOUT_SECONDS + 1, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                future.cancel(true);
                return buildErrorResponse("execution timed out.", -1, "timeout");
            } catch (Exception e) {
                return buildErrorResponse("Server Error: " + e.getMessage(), -1, "error");
            }
        });

        Runtime.getRuntime().addShutdownHook(new Thread(() -> executor.shutdownNow()));
    }

    private static String handleExecution(String requestBody) {
        Path tempDir = null;

        try {
            JsonObject requestJson = JsonParser.parseString(requestBody).getAsJsonObject();
            String code = requestJson.get("code").getAsString();
            String input = requestJson.has("input") ? requestJson.get("input").getAsString() : "";

            if (isForbiddenCode(code)) {
                return buildErrorResponse("Forbidden API usage detected.", -1, "error");
            }

            tempDir = Files.createTempDirectory("javaexec");
            Path javaFile = tempDir.resolve("Main.java");
            Files.writeString(javaFile, code);

            Process compileProcess = compileJava(tempDir, javaFile);
            int compileExitCode = compileProcess.waitFor();

            if (compileExitCode != 0) {
                return buildJsonResponse(
                        new String(compileProcess.getInputStream().readAllBytes()),
                        new String(compileProcess.getErrorStream().readAllBytes()),
                        compileExitCode,
                        "COMPILE_ERROR"
                );
            }

            Process runProcess = runJava(tempDir, input);
            boolean finished = runProcess.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!finished) {
                runProcess.destroyForcibly();
                return buildErrorResponse("Execution timed out.", -1, "TIME_OUT");
            }

            int exitCode = runProcess.exitValue();
            byte[] stdoutBytes = runProcess.getInputStream().readAllBytes();
            byte[] stderrBytes = runProcess.getErrorStream().readAllBytes();

            String stdout = new String(stdoutBytes);
            String stderr = new String(stderrBytes);

            if (stderr.contains("OutOfMemoryError")) {
                return buildErrorResponse("Memory limit might have been exceeded.", exitCode, "MEMORY_ERROR");
            }

            if (stderr.toLowerCase().contains("killed")) {
                return buildErrorResponse("Memory limit might have been exceeded.", exitCode, "MEMORY_ERROR");
            }

            if (exitCode != 0 && stderr.isBlank()) {
                return buildErrorResponse("Memory limit might have been exceeded.", exitCode, "MEMORY_ERROR");
            }

            String status = exitCode == 0 ? "SUCCESS" : "RUNTIME_ERROR";
            return buildJsonResponse(stdout, stderr, exitCode, status);

        } catch (Exception e) {
            return buildErrorResponse("Execution Error: " + e.getMessage(), -1, "error");
        } finally {
            if (tempDir != null) {
                try {
                    deleteDirectory(tempDir);
                } catch (IOException ignored) {}
            }
        }
    }

    private static boolean isForbiddenCode(String code) {
        return FORBIDDEN_APIS.stream().anyMatch(code::contains)
                || code.matches("(?s).*\\bnative\\b.*");
    }

    private static Process compileJava(Path dir, Path javaFile) throws IOException {
        return new ProcessBuilder("javac", javaFile.getFileName().toString())
                .directory(dir.toFile())
                .start();
    }

    private static Process runJava(Path dir, String input) throws IOException {
        String execCmd = String.format("echo '%s' | java -cp . Main", input);
        return new ProcessBuilder("bash", "-c", execCmd)
                .directory(dir.toFile())
                .start();
    }

    private static String buildJsonResponse(String stdout, String stderr, int exitCode, String status) {
        JsonObject obj = new JsonObject();
        obj.addProperty("stdout", stdout);
        obj.addProperty("stderr", stderr);
        obj.addProperty("exitCode", exitCode);
        obj.addProperty("status", status);
        return obj.toString();
    }

    private static String formatJsonResponse(String code) {
        JsonObject obj = new JsonObject();
        obj.addProperty("code", code);
        obj.addProperty("stderr", "");
        obj.addProperty("exitCode", "");
        obj.addProperty("status", "");
        return obj.toString();
    }

    private static String buildErrorResponse(String message, int exitCode, String status) {
        return buildJsonResponse("", message, exitCode, status);
    }

    private static void deleteDirectory(Path path) throws IOException {
        Files.walk(path)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
    }

    private static String formatJavaCode(String inputCode) throws Exception {
        return new Formatter().formatSource(inputCode);
    }
}