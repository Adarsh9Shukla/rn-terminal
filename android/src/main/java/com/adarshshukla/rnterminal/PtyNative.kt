package com.adarshshukla.rnterminal

class PtyNative {

    companion object {

        init {
            System.loadLibrary("rnterminal")
        }

       
        @JvmStatic
        external fun writePty(
            fd: Int,
            data: String
        ): Int
@JvmStatic
external fun createPty(
    shellPath: String,
    homePath: String,
    prefixPath: String
): IntArray

        @JvmStatic
        external fun readPty(
            fd: Int
        ): String

        @JvmStatic
        external fun closePty(
            fd: Int
        ): Int
        @JvmStatic
external fun killAndWaitPid(pid: Int): Int
        @JvmStatic
        external fun resizePty(
            fd: Int,
            cols: Int,
            rows: Int
        ): Int
    }
}