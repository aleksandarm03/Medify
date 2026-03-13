package pmf.imi.moodle;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.time.Duration;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

public class RegisterPageTest {

    private WebDriver driver;
    private RegisterPage registerPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get(RegisterPage.REGISTER_URL);
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));
        registerPage = new RegisterPage(driver);
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testRegisterPageHeading() {
        assertEquals(registerPage.getHeadingText(), "Registracija");
    }

    @Test
    public void testEmptySubmitStaysOnRegisterPage() {
        registerPage.clickSubmit();
        assertEquals(driver.getCurrentUrl(), RegisterPage.REGISTER_URL);
    }

    @Test
    public void testPasswordMismatchShowsValidationError() {
        registerPage.fillRequiredFields(
                "1111111111111",
                "Petar",
                "Petrovic",
                "StrongPass123",
                "DifferentPass123",
                "Knez Mihailova 1",
                "0601234567"
        );

        registerPage.clickSubmit();

        assertEquals(registerPage.getErrorMessage(), "Lozinke se ne poklapaju");
        assertEquals(driver.getCurrentUrl(), RegisterPage.REGISTER_URL);
    }

    @Test
    public void testShortPasswordShowsValidationError() {
        registerPage.fillRequiredFields(
                "2222222222222",
                "Ana",
                "Anic",
                "123",
                "123",
                "Nemanjina 10",
                "0612345678"
        );

        registerPage.clickSubmit();

        assertEquals(registerPage.getErrorMessage(), "Lozinka mora imati najmanje 6 karaktera");
        assertEquals(driver.getCurrentUrl(), RegisterPage.REGISTER_URL);
    }

    @Test
    public void testLoginLinkNavigatesToLoginPage() {
        registerPage.clickLoginLink();
        assertTrue(driver.getCurrentUrl().contains("/login"));
    }
}
