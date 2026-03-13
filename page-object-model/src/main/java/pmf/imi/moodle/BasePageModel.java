package pmf.imi.moodle;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public abstract class BasePageModel {
    public static final String BASE_URL  = "http://localhost:4200";
    WebDriver driver;
    WebDriverWait wait;
    public static int timeout = 10;
    JavascriptExecutor js;

    public BasePageModel(WebDriver driver) {
        PageFactory.initElements(driver, this);
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(timeout));
        js = (JavascriptExecutor) driver;
    }
}
