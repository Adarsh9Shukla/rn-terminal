package com.adarshshukla.rnterminal

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

data class PtySession(
    val fd: Int,
    val pid: Int
)

class LocalTerminalModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private var ptyFd: Int? = null
    private var ptyReaderRunning = false
    private var currentSession: PtySession? = null

    private lateinit var runtimeManager: RuntimeManager
    private lateinit var packageManager: PackageManager
init {
    runtimeManager = RuntimeManager(reactApplicationContext)
    runtimeManager.initialize()

    packageManager = PackageManager(
        reactApplicationContext,
        runtimeManager
    )
}
     override fun getName(): String {
        return "LocalTerminal"
    }

    private fun extractAsset(assetPath: String, targetFile: File) {
        targetFile.parentFile?.mkdirs()
        reactApplicationContext.assets.open(assetPath).use { input ->
            targetFile.outputStream().use { output ->
                input.copyTo(output)
            }
        }
    }

    private fun startPtyReader(fd: Int) {
        if (ptyReaderRunning) {
            return
        }

        ptyReaderRunning = true

        Thread {
            try {
                while (ptyReaderRunning) {
                    val output = PtyNative.readPty(fd)

                    if (output.isNotEmpty()) {
                        println(
                            "PTY NATIVE OUTPUT: " +
                            output.replace("\r", "\\r")
                                .replace("\n", "\\n")
                        )

                        reactApplicationContext
                            .getJSModule(
                                DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                            )
                            .emit(
                                "LocalTerminalPtyOutput",
                                output
                            )
                    }
                }
            } catch (error: Exception) {
                error.printStackTrace()
            }
        }.start()
    }

@ReactMethod
fun getRuntimeInfo(promise: Promise) {
    try {
        runtimeManager.initialize()

        val result = Arguments.createMap()

        result.putString(
            "prefix",
            runtimeManager.getPrefix()
        )

        result.putString(
            "home",
            runtimeManager.getHome()
        )

        result.putString(
            "bin",
            runtimeManager.getBin()
        )

        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("RUNTIME_ERROR", e)
    }
}
    @ReactMethod
fun listInstalledPackages(promise: Promise) {
    try {
        val packages = packageManager.listInstalled()

        val result = Arguments.createArray()

        packages.forEach { pkg ->
            val item = Arguments.createMap()

            item.putString("name", pkg.name)
            item.putString("version", pkg.version)
            item.putString("architecture", pkg.architecture)

            result.pushMap(item)
        }

        promise.resolve(result)
    } catch (error: Exception) {
        promise.reject(
            "PACKAGE_LIST_ERROR",
            error.message,
            error
        )
    }
}
@ReactMethod
fun isPackageInstalled(
    name: String,
    promise: Promise) {
    try {
        promise.resolve(
            packageManager.isInstalled(name)
        )
    } catch (error: Exception) {
        promise.reject(
            "PACKAGE_CHECK_ERROR",
            error.message,
            error
        )
    }
}
@ReactMethod
fun uninstallPackage(
    name: String,
    promise: Promise
) {
    try {
        val removed = packageManager.uninstall(name)

        promise.resolve(removed)
    } catch (error: Exception) {
        promise.reject(
            "PACKAGE_UNINSTALL_ERROR",
            error.message,
            error
        )
    }
}
    @ReactMethod
    fun testEmbeddedBinary(promise: Promise) {
        try {
            val context = reactApplicationContext

            val targetDir = File(context.filesDir, "usr/bin")
            targetDir.mkdirs()

            val target = File(targetDir, "hello")

            extractAsset("testbin/hello", target)

            if (!target.setExecutable(true, false)) {
                throw IllegalStateException("Failed to make binary executable")
            }

            val process = ProcessBuilder(target.absolutePath)
                .redirectErrorStream(true)
                .start()

            val output = process.inputStream
                .bufferedReader()
                .use { it.readText() }

            val exitCode = process.waitFor()

            promise.resolve(
                "exit=$exitCode\n$output"
            )
        } catch (error: Exception) {
            promise.reject(
                "EMBEDDED_BINARY_ERROR",
                error.message,
                error
            )
        }
    }

    @ReactMethod
    fun createPty(
        shellPath: String,
        homePath: String,
        prefixPath: String,
        promise: Promise) {

        try {
      val appDataDir =
    reactApplicationContext.applicationInfo.dataDir

val preloadPath =
    File(
        reactApplicationContext.filesDir,
        "usr/lib/libtermux-exec-direct-ld-preload.so"
    ).absolutePath

val sessionInfo = PtyNative.createPty(
    shellPath,
    homePath,
    prefixPath,
    appDataDir,
    preloadPath
)

            if (sessionInfo.size < 2) {
                throw IllegalStateException(
                    "Invalid PTY session returned"
                )
            }

            val result = Arguments.createMap().apply {
                putInt("fd", sessionInfo[0])
                putInt("pid", sessionInfo[1])
            }

            currentSession = PtySession(
                sessionInfo[0],
                sessionInfo[1]
            )

            ptyFd = sessionInfo[0]

            startPtyReader(sessionInfo[0])

            promise.resolve(result)
        } catch (error: Exception) {
            promise.reject(
                "PTY_CREATE_ERROR",
                error.message,
                error
            )
        }
    }
@ReactMethod
fun installPackage(
    name: String,
    promise: Promise
) {
    try {
        val packageInfo = packageManager.install(name)

        val result = Arguments.createMap()

        result.putString("name", packageInfo.name)
        result.putString("version", packageInfo.version)
        result.putString(
            "architecture",
            packageInfo.architecture
        )

        promise.resolve(result)
    } catch (error: Exception) {
        promise.reject(
            "PACKAGE_INSTALL_ERROR",
            error.message,
            error
        )
    }
}
    @ReactMethod
    fun resizePty(
        fd: Int,
        cols: Int,
        rows: Int,
        promise: Promise
    ) {
        try {
            val result = PtyNative.resizePty(
                fd,
                cols,
                rows
            )

            if (result != 0) {
                promise.reject(
                    "PTY_RESIZE_ERROR",
                    "Failed to resize PTY"
                )
                return
            }

            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject(
                "PTY_RESIZE_ERROR",
                error.message,
                error
            )
        }
    }
@ReactMethod
fun testTermuxExec(promise: Promise) {
    try {
        val context = reactApplicationContext
        val usr = File(context.filesDir, "usr")
        val libDir = File(usr, "lib")

        if (!libDir.exists() && !libDir.mkdirs()) {
            throw IllegalStateException(
                "Failed to create ${libDir.absolutePath}"
            )
        }

        val preloadFile = File(
            libDir,
            "libtermux-exec-direct-ld-preload.so"
        )

        // Always ensure the asset is present.
        extractAsset(
            "usr/lib/libtermux-exec-direct-ld-preload.so",
            preloadFile
        )

        if (!preloadFile.exists()) {
            throw IllegalStateException(
                "Preload library was not extracted"
            )
        }

        val appDataDir =
            context.applicationInfo.dataDir

        val helloPath =
            "${context.filesDir.absolutePath}/usr/bin/hello"

        val preloadPath =
            preloadFile.absolutePath

        println(
            "TERMUX EXEC DEBUG: " +
                "preload=$preloadPath " +
                "exists=${preloadFile.exists()} " +
                "size=${preloadFile.length()} " +
                "hello=$helloPath"
        )

        val builder = ProcessBuilder(
            "/system/bin/sh",
            "-c",
"printf 'shell-started\\n'; pwd; echo \$PATH"        )

        builder.environment().apply {
            put("TERMUX_APP__DATA_DIR", appDataDir)

            put(
                "TERMUX__ROOTFS",
                context.filesDir.absolutePath
            )

            put(
                "TERMUX__PREFIX",
                "${context.filesDir.absolutePath}/usr"
            )

            put(
                "LD_PRELOAD",
                preloadPath
            )
        }

        val process = builder.start()

        val stdout = process.inputStream
            .bufferedReader()
            .readText()

        val stderr = process.errorStream
            .bufferedReader()
            .readText()

        val exitCode = process.waitFor()

        promise.resolve(
            "exitCode=$exitCode\n" +
            "stdout=$stdout\n" +
            "stderr=$stderr"
        )
    } catch (error: Exception) {
        promise.reject(
            "TERMUX_EXEC_TEST_ERROR",
            error.message,
            error
        )
    }
}
    @ReactMethod
    fun writePty(
        fd: Int,
        data: String,
        promise: Promise) {
        try {
            val written = PtyNative.writePty(fd, data)

            if (written < 0) {
                promise.reject(
                    "PTY_WRITE_ERROR",
                    "Failed to write to PTY"
                )
                return
            }

            promise.resolve(written)
        } catch (error: Exception) {
            promise.reject(
                "PTY_WRITE_ERROR",
                error.message,
                error
            )
        }
    }

    @ReactMethod
    fun getNativeLibraryInfo(promise: Promise) {
        try {
            val nativeLibraryDir =
                reactApplicationContext.applicationInfo.nativeLibraryDir

            val result = Arguments.createMap().apply {
                putString("nativeLibraryDir", nativeLibraryDir)

                putString(
                    "termuxExecPath",
                    "${reactApplicationContext.filesDir.absolutePath}/usr/lib/libtermux-exec-direct-ld-preload.so"
                )

                putString(
                    "helloPath",
                    "${reactApplicationContext.filesDir.absolutePath}/usr/bin/hello"
                )
            }

            promise.resolve(result)
        } catch (error: Exception) {
            promise.reject(
                "NATIVE_LIBRARY_INFO_ERROR",
                error.message,
                error
            )
        }
    }

    @ReactMethod
    fun readPty(
        fd: Int,
        promise: Promise) {
        Thread {
            try {
                val output = PtyNative.readPty(fd)

                promise.resolve(output)
            } catch (error: Exception) {
                promise.reject(
                    "PTY_READ_ERROR",
                    error.message,
                    error
                )
            }
        }.start()
    }

    @ReactMethod
    fun getPlatform(promise: Promise) {
        promise.resolve("Android")
    }

    @ReactMethod
    fun getEnvironmentPaths(promise: Promise) {
        try {
            val filesDir = reactApplicationContext.filesDir.absolutePath

            val usrPath = "$filesDir/usr"
            val homePath = "$usrPath/home"
            val binPath = "$usrPath/bin"
            val libPath = "$usrPath/lib"

            val result = Arguments.createMap().apply {
                putString("usr", usrPath)
                putString("home", homePath)
                putString("bin", binPath)
                putString("lib", libPath)
            }

            promise.resolve(result)
        } catch (error: Exception) {
            promise.reject(
                "ENVIRONMENT_PATH_ERROR",
                error.message,
                error
            )
        }
    }

    @ReactMethod
    fun initializeEnvironment(promise: Promise) {
        try {
            val usr = File(reactApplicationContext.filesDir, "usr")

            val directories = listOf(
                usr,
                File(usr, "bin"),
                File(usr, "lib"),
                File(usr, "etc"),
                File(usr, "home"),
                File(usr, "tmp")
            )

            directories.forEach { directory ->
                if (!directory.exists() && !directory.mkdirs()) {
                    throw IllegalStateException(
                        "Failed to create ${directory.absolutePath}"
                    )
                }
            }

            // Extract termux-exec library to filesDir
            val targetSo = File(usr, "lib/libtermux-exec-direct-ld-preload.so")
            extractAsset("usr/lib/libtermux-exec-direct-ld-preload.so", targetSo)

            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject(
                "ENVIRONMENT_INIT_ERROR",
                error.message,
                error
            )
        }
    }

    @ReactMethod
    fun bootstrapShell(promise: Promise) {
        try {
            val usr = File(reactApplicationContext.filesDir, "usr")
            val bin = File(usr, "bin")

            if (!bin.exists() && !bin.mkdirs()) {
                throw IllegalStateException(
                    "Failed to create ${bin.absolutePath}"
                )
            }

            val source = File("/system/bin/sh")
            val target = File(bin, "sh")

            source.inputStream().use { input ->
                target.outputStream().use { output ->
                    input.copyTo(output)
                }
            }

            target.setExecutable(true, false)

            promise.resolve(target.absolutePath)
        } catch (error: Exception) {
            promise.reject(
                "BOOTSTRAP_ERROR",
                error.message,
                error
            )
        }
    }

    @ReactMethod
    fun stopPty(promise: Promise) {
        try {
            ptyReaderRunning = false

            val session = currentSession

            if (session != null) {
                PtyNative.closePty(session.fd)
                PtyNative.killAndWaitPid(session.pid)
            }

            ptyFd = null
            currentSession = null

            promise.resolve("PTY stopped")
        } catch (error: Exception) {
            promise.reject(
                "PTY_STOP_ERROR",
                error.message,
                error
            )
        }
    }
}