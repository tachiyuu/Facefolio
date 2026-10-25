package com.tachiyuu.materialbook.utils

import java.net.URL
import java.net.URLDecoder

fun fbRedirectSanitizer(link: String): String {
    try {
        var url = URL(link)

        if (url.host == "l.facebook.com" && url.path == "/l.php") {
            val params = url.query.split("&").associate {
                val (key, value) = it.split("=", limit = 2)
                key to URLDecoder.decode(value, "UTF-8")
            }
            url = URL(params["u"] ?: return link)
        }

        // Filter out fbclid but do NOT re-encode the values
        // Re-encoding causes double-encoding when the URL is shared via Intent
        val params = url.query?.split("&")
            ?.filter { !it.startsWith("fbclid=") }
            ?.joinToString("&")

        return buildString {
            append("${url.protocol}://${url.host}")
            if (url.port != -1 && url.port != url.defaultPort) append(":${url.port}")
            append(url.path)
            if (!params.isNullOrBlank()) append("?").append(params)
        }
    } catch (_: Exception) {
        return link
    }
}