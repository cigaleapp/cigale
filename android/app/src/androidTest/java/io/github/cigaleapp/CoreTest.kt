package io.github.cigaleapp

import android.util.Log
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.espresso.web.assertion.WebViewAssertions.webMatches
import androidx.test.espresso.web.sugar.Web.onWebView
import androidx.test.espresso.web.webdriver.DriverAtoms.findElement
import androidx.test.espresso.web.webdriver.DriverAtoms.getText
import androidx.test.espresso.web.webdriver.Locator
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import org.hamcrest.CoreMatchers.allOf
import org.hamcrest.CoreMatchers.containsString
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
@LargeTest
class CoreTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun insectaProtocol() {
        val webview = onWebView()
        val body = findElement(Locator.TAG_NAME, "body")

        println("Checking for loading")
        Log.d("io.github.cigaleapp", "Checking for loading")

        webview.withElement(body).check(
            webMatches(getText(), containsString("Loading…"))
        )

        // onView(isRoot()).perform(
        //		waitForWebText("CIGALE", 5, TimeUnit.MINUTES)
        //	)

        println("Waiting 4mn")
        Log.d("io.github.cigaleapp", "Waiting 4mn")

        // TODO: make wait for text work
        Thread.sleep(4 * 60 * 1_000)

        println("Checking for CIGALE text")
        Log.d("io.github.cigaleapp", "Checking for CIGALE text")

        webview.withElement(body).check(
            webMatches(getText(), containsString("CIGALE"))
        )
    }
}
