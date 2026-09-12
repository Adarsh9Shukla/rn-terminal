package com.adarshshukla.rnterminal

import android.content.Context
import org.json.JSONObject
import java.io.File

data class PackageInfo(
    val name: String,
    val version: String,
    val architecture: String
)

class PackageManager(
    private val context: Context,
    private val runtimeManager: RuntimeManager
) {

    private val packageDatabase: File
        get() = runtimeManager.packageDatabase

    fun isInstalled(name: String): Boolean {
        return File(packageDatabase, "$name.json").exists()
    }

    fun listInstalled(): List<PackageInfo> {
        val files = packageDatabase.listFiles() ?: return emptyList()

        return files
            .filter { it.extension == "json" }
            .mapNotNull { file ->
                try {
                    val json = JSONObject(file.readText())

                    PackageInfo(
                        name = json.getString("name"),
                        version = json.getString("version"),
                        architecture = json.getString("architecture")
                    )
                } catch (error: Exception) {
                    null
                }
            }
    }

    fun savePackageInfo(
        name: String,
        version: String,
        architecture: String) {
        packageDatabase.mkdirs()

        val json = JSONObject().apply {
            put("name", name)
            put("version", version)
            put("architecture", architecture)
            put("installedAt", System.currentTimeMillis())
        }

        File(
            packageDatabase,
            "$name.json"
        ).writeText(
            json.toString(2)
        )
    }

    fun removePackageInfo(name: String): Boolean {
        val file = File(packageDatabase, "$name.json")

        return if (file.exists()) {
            file.delete()
        } else {
            false
        }
    }
    fun install(packageName: String): PackageInfo {
    runtimeManager.initialize()

    val assetRoot = "packages/$packageName"
    val manifestPath = "$assetRoot/package.json"

    val manifestJson = context.assets
        .open(manifestPath)
        .bufferedReader()
        .use { it.readText() }

    val manifest = JSONObject(manifestJson)

    val name = manifest.getString("name")
    val version = manifest.getString("version")
    val architecture = manifest.getString("architecture")

    require(name == packageName) {
        "Package name mismatch: expected $packageName, got $name"
    }

    val files = manifest.getJSONArray("files")

    for (index in 0 until files.length()) {
        val relativePath = files.getString(index)

        installFile(
            assetRoot = assetRoot,
            relativePath = relativePath
        )
    }

    savePackageInfo(
        name = name,
        version = version,
        architecture = architecture
    )

    return PackageInfo(
        name = name,
        version = version,
        architecture = architecture
    )
}private fun installFile(
    assetRoot: String,
    relativePath: String
) {
    val sourcePath = "$assetRoot/$relativePath"
    val destination = File(
        runtimeManager.prefix,
        relativePath
    )

    destination.parentFile?.mkdirs()

    context.assets.open(sourcePath).use { input ->
        destination.outputStream().use { output ->
            input.copyTo(output)
        }
    }

    destination.setExecutable(
        true,
        false
    )
}
}