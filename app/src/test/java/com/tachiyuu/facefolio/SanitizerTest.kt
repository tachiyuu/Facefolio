package com.tachiyuu.facefolio

import com.tachiyuu.facefolio.utils.Script
import com.tachiyuu.facefolio.utils.fbRedirectSanitizer
import com.tachiyuu.facefolio.utils.fetchScripts
import com.tachiyuu.facefolio.utils.wrapScripts
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SanitizerTest {

    @Test
    fun testFbRedirectSanitizer_unwrapsFacebookRedirect() {
        val original = "https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2Farticle%3Fid%3D123&h=AT123"
        val cleaned = fbRedirectSanitizer(original)
        assertEquals("https://example.com/article?id=123", cleaned)
    }

    @Test
    fun testFbRedirectSanitizer_stripsFbclid() {
        val original = "https://example.com/page?id=456&fbclid=IwAR123abc&utm_source=fb"
        val cleaned = fbRedirectSanitizer(original)
        assertEquals("https://example.com/page?id=456&utm_source=fb", cleaned)
    }

    @Test
    fun testFetchScripts_onlyIncludesEnabledScripts() {
        val scripts = listOf(
            Script(isEnabled = true, resourceId = 1, scriptTitle = "EnabledScript"),
            Script(isEnabled = false, resourceId = 2, scriptTitle = "DisabledScript")
        )
        val result = fetchScripts(scripts) { id ->
            if (id == 1) "console.log('enabled');" else "console.log('disabled');"
        }
        assertTrue(result.contains("EnabledScript"))
        assertTrue(result.contains("console.log('enabled');"))
        assertFalse(result.contains("DisabledScript"))
    }

    @Test
    fun testWrapScripts_namesBundleFacefolioScripts() {
        val wrapped = wrapScripts("// test code")
        assertTrue(wrapped.contains("sourceURL=facefolio-scripts.js"))
    }
}
