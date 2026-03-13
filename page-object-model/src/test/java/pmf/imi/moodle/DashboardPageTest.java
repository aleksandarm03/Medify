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

public class DashboardPageTest {

    private static final String VALID_JMBG = "5005005005005";
    private static final String VALID_PASSWORD = "Patient123!";

    private WebDriver driver;
    private DashboardPage dashboardPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();

        driver.get(LoginPage.LOGIN_URL);
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(VALID_JMBG, VALID_PASSWORD);

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/dashboard"));

        dashboardPage = new DashboardPage(driver);
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testDashboardUrlAfterLogin() {
        assertTrue(driver.getCurrentUrl().contains("/dashboard"));
    }

    @Test
    public void testDashboardHasWelcomeHeadingAndQuickActions() {
        assertTrue(dashboardPage.getWelcomeHeadingText().contains("Dobrodošli"));
        assertEquals(dashboardPage.getQuickActionsTitleText(), "Brze akcije");
    }

    @Test
    public void testDashboardQuickActionsCardsAreVisible() {
        assertTrue(dashboardPage.getQuickActionsCardsCount() > 0);
    }

    @Test
    public void testRefreshButtonKeepsUserOnDashboard() {
        dashboardPage.clickRefresh();
        assertTrue(driver.getCurrentUrl().contains("/dashboard"));
    }
}
