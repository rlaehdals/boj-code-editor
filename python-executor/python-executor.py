from flask import Flask, request, jsonify
import subprocess
import tempfile
import os
import shutil

app = Flask(__name__)

TIMEOUT_SECONDS = 10

FORBIDDEN_APIS = [
    "import os", "subprocess", "eval", "exec", "open",
    "__import__", "compile", "globals", "locals",
    "from os", "requests", "socket", "urllib"
]

STATUS = {
    "SUCCESS": "SUCCESS",
    "RUNTIME_ERROR": "RUNTIME_ERROR",
    "TIMEOUT": "TIME_OUT",
    "ERROR": "error",
    "FORBIDDEN": "error"
}


def contains_forbidden_api(code: str) -> bool:
    return any(api in code for api in FORBIDDEN_APIS)


def build_response(stdout="", stderr="", exit_code=-1, status=STATUS["ERROR"]):
    return {
        "stdout": stdout,
        "stderr": stderr,
        "exitCode": exit_code,
        "status": status
    }


def execute_code(code: str, input_data: str):
    temp_dir = tempfile.mkdtemp()
    script_path = os.path.join(temp_dir, "script.py")

    try:
        with open(script_path, "w") as f:
            f.write(code)

        exec_cmd = f"ulimit -v 262144; python3 script.py"
        result = subprocess.run(
            ["bash", "-c", exec_cmd],
            input=input_data,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=temp_dir,
            timeout=TIMEOUT_SECONDS
        )

        stderr = result.stderr.strip()
        stdout = result.stdout

        # 메모리 초과 메시지 치환
        if "MemoryError" in stderr or "Killed" in stderr or "cannot allocate memory" in stderr:
            return build_response(
                stdout=stdout,
                stderr="Memory limit might have been exceeded.",
                exit_code=result.returncode,
                status=STATUS["RUNTIME_ERROR"]
            )

        status = STATUS["SUCCESS"] if result.returncode == 0 else STATUS["RUNTIME_ERROR"]
        return build_response(stdout, stderr, result.returncode, status)

    except subprocess.TimeoutExpired:
        return build_response(
            stderr="Execution timed out.",
            exit_code=-1,
            status=STATUS["TIMEOUT"]
        )

    except Exception as e:
        return build_response(
            stderr=f"Execution Error: {str(e)}",
            status=STATUS["ERROR"]
        )

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.route("/execute", methods=["POST"])
def execute():
    try:
        data = request.get_json()
        code = data.get("code", "")
        input_data = data.get("input", "")

        if contains_forbidden_api(code):
            return jsonify(build_response(
                stderr="Forbidden API usage detected.",
                status=STATUS["FORBIDDEN"]
            ))

        result = execute_code(code, input_data)
        return jsonify(result)

    except Exception as e:
        return jsonify(build_response(
            stderr=f"Server Error: {str(e)}"
        ))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8082)
