#include <jni.h>
#include <pty.h>
#include <unistd.h>
#include <string>
#include <sys/ioctl.h>
#include <termios.h>
#include <signal.h>
#include <sys/wait.h>

extern "C"
JNIEXPORT jintArray JNICALL
Java_com_adarshshukla_rnterminal_PtyNative_createPty(
    JNIEnv* env,
    jobject /* thiz */,
    jstring shellPath,
    jstring homePath,
    jstring prefixPath,
    jstring appDataDir,
    jstring preloadPath
) {
    const char* shell =
        env->GetStringUTFChars(shellPath, nullptr);

    const char* home =
        env->GetStringUTFChars(homePath, nullptr);

    const char* prefix =
        env->GetStringUTFChars(prefixPath, nullptr);

    const char* appData =
        env->GetStringUTFChars(appDataDir, nullptr);

    const char* preload =
        env->GetStringUTFChars(preloadPath, nullptr);

    int masterFd = -1;
    pid_t pid = -1;

    struct winsize windowSize {};
    windowSize.ws_col = 80;
    windowSize.ws_row = 24;

    pid = forkpty(
        &masterFd,
        nullptr,
        nullptr,
        &windowSize
    );

    if (pid < 0) {
        env->ReleaseStringUTFChars(
            shellPath,
            shell
        );

        env->ReleaseStringUTFChars(
            homePath,
            home
        );

        env->ReleaseStringUTFChars(
            prefixPath,
            prefix
        );

        env->ReleaseStringUTFChars(
            appDataDir,
            appData
        );

        env->ReleaseStringUTFChars(
            preloadPath,
            preload
        );

        return nullptr;
    }

    if (pid == 0) {
        /*
         * Child process.
         *
         * Configure the embedded Termux-style environment.
         */
setenv("TERMUX_APP__DATA_DIR", appData, 1);
setenv("TERMUX__ROOTFS", appData, 1);
setenv("TERMUX__PREFIX", prefix, 1);
setenv("HOME", home, 1);
setenv("PREFIX", prefix, 1);

std::string path =
    std::string(prefix) +
    "/bin:/system/bin:/system/xbin";

setenv("PATH", path.c_str(), 1);

setenv("LD_PRELOAD", preload, 1);
setenv("TERM", "xterm-256color", 1);
setenv("PS1", "$ ", 1);
setenv("TERM", "xterm-256color", 1);
if (chdir(home) != 0) {
    // Ignore for now.
}

execl(shell, "sh", nullptr);
        /*
         * If execl() fails, exit the child.
         */
        _exit(127);
    }

    /*
     * Parent process.
     */

    env->ReleaseStringUTFChars(
        shellPath,
        shell
    );

    env->ReleaseStringUTFChars(
        homePath,
        home
    );

    env->ReleaseStringUTFChars(
        prefixPath,
        prefix
    );

    env->ReleaseStringUTFChars(
        appDataDir,
        appData
    );

    env->ReleaseStringUTFChars(
        preloadPath,
        preload
    );

    jint values[2];

    values[0] = masterFd;
    values[1] = static_cast<jint>(pid);

    jintArray result =
        env->NewIntArray(2);

    env->SetIntArrayRegion(
        result,
        0,
        2,
        values
    );

    return result;
}

extern "C"
JNIEXPORT jint JNICALL
Java_com_adarshshukla_rnterminal_PtyNative_writePty(
    JNIEnv* env,
    jobject /* thiz */,
    jint fd,
    jstring data) {
    const char* chars =
        env->GetStringUTFChars(data, nullptr);

    if (chars == nullptr) {
        return -1;
    }

    const jsize length =
        env->GetStringUTFLength(data);

    const ssize_t written =
        write(fd, chars, length);

    env->ReleaseStringUTFChars(data, chars);

    return static_cast<jint>(written);
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_adarshshukla_rnterminal_PtyNative_readPty(
    JNIEnv* env,
    jobject /* thiz */,
    jint fd
) {
    char buffer[4096];

    const ssize_t bytesRead = read(
        fd,
        buffer,
        sizeof(buffer) - 1
    );

    if (bytesRead <= 0) {
        return env->NewStringUTF("");
    }

    buffer[bytesRead] = '\0';

    return env->NewStringUTF(buffer);
}
extern "C"
JNIEXPORT jint JNICALL
Java_com_adarshshukla_rnterminal_PtyNative_closePty(
    JNIEnv* env,
    jobject /* thiz */,
    jint fd) {
    return close(fd);
}

extern "C"
JNIEXPORT jint JNICALL
Java_com_adarshshukla_rnterminal_PtyNative_resizePty(
    JNIEnv* env,
    jobject /* thiz */,
    jint fd,
    jint cols,
    jint rows) {
    struct winsize size{};

    size.ws_col = static_cast<unsigned short>(cols);
    size.ws_row = static_cast<unsigned short>(rows);

    return ioctl(
        fd,
        TIOCSWINSZ,
        &size
    );
}

extern "C"
JNIEXPORT jint JNICALL
Java_com_adarshshukla_rnterminal_PtyNative_killAndWaitPid(
    JNIEnv* env,
    jobject /* thiz */,
    jint pid) {
    if (pid <= 0) {
        return -1;
    }

    if (kill(static_cast<pid_t>(pid), SIGTERM) != 0) {
        return -1;
    }

    int status = 0;

    if (waitpid(
            static_cast<pid_t>(pid),
            &status,
            0
        ) == -1) {
        return -1;
    }

    return 0;
}