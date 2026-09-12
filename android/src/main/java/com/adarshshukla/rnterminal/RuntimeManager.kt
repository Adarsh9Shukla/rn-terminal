package com.adarshshukla.rnterminal

import android.content.Context
import java.io.File

class RuntimeManager(
    private val context: Context
) {

    private val filesDir: File
        get() = context.filesDir

    val prefix: File
        get() = File(filesDir, "usr")

    val home: File
        get() = File(prefix, "home")

    val bin: File
        get() = File(prefix, "bin")

    val lib: File
        get() = File(prefix, "lib")

    val tmp: File
        get() = File(prefix, "tmp")
val packageDatabase: File
    get() = File(prefix, "var/lib/rn-terminal/packages")
    fun initialize() {
        listOf(
            prefix,
            home,
            bin,
            lib,
            tmp,
            File(prefix, "include"),
            File(prefix, "share"),
            File(prefix, "var"),
            File(prefix, "etc")
        ).forEach { directory ->
            if (!directory.exists()) {
                directory.mkdirs()
            }
        }
    }

    fun isInitialized(): Boolean {
        return prefix.exists() &&
               home.exists() &&
               bin.exists() &&
               lib.exists()
    }

    fun getPrefix(): String = prefix.absolutePath

    fun getHome(): String = home.absolutePath

    fun getBin(): String = bin.absolutePath
}