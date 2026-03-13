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

import static org.testng.Assert.*;

public class LoginPageTest {


    // Kredencijali iz seed skripte
    private static final String VALID_JMBG     = "5005005005005";
    private static final String VALID_PASSWORD = "Patient123!";

    private WebDriver driver;
    private LoginPage loginPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get(LoginPage.LOGIN_URL);
        // Čekamo da Angular renderuje formu prije nego što test počne
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));
        loginPage = new LoginPage(driver);
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testLoginPageTitle() {
        assertEquals(loginPage.getTitle(), "Medify");
    }

    @Test
    public void testEmptyLogin() {
        loginPage.clickSubmit();
        assertEquals(driver.getCurrentUrl(), LoginPage.LOGIN_URL);
    }

    @Test
    public void testLoginWithWrongPassword() {
        loginPage.setUsername(VALID_JMBG);
        loginPage.setPassword(" pogresnaLozinka123!");
        loginPage.clickSubmit();
        String error = loginPage.getErrorMessage();
        assertNotNull(error);
        assertFalse(error.isEmpty());
    }

    @Test
    public void testLoginWithNonExistentUser() {
        loginPage.setUsername("0000000000000");
        loginPage.setPassword("NijeVazno123!");
        loginPage.clickSubmit();
        String error = loginPage.getErrorMessage();
        assertNotNull(error);
        assertFalse(error.isEmpty());
    }

    @Test
    public void testSuccessfulLogin() {
        loginPage.login(VALID_JMBG, VALID_PASSWORD);
        // Nakon uspješne prijave, app preusmjerava van /login stranice
        assertFalse(driver.getCurrentUrl().contains("/login"));
    }
}