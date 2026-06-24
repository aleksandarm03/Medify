package pmf.imi.moodle;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
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
    private static final String REQUIRED_FIELDS_ERROR = "Molimo unesite JMBG i lozinku";

    private WebDriver driver;
    private LoginPage loginPage;
    private WebDriverWait wait;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.get(LoginPage.LOGIN_URL);
        // Čekamo da Angular renderuje formu pre nego što test počne
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));
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
    public void testLoginPageHeadingsAreDisplayed() {
        assertEquals(visibleText(By.cssSelector(".login-card h1")), "Medify");
        assertEquals(visibleText(By.cssSelector(".login-card h2")), "Prijavljivanje");
    }

    @Test
    public void testLoginFormInitialState() {
        WebElement jmbgField = visibleElement(By.id("jmbg"));
        WebElement passwordField = visibleElement(By.id("password"));
        WebElement submitButton = visibleElement(By.cssSelector("button[type='submit']"));

        assertEquals(jmbgField.getAttribute("name"), "jmbg");
        assertEquals(jmbgField.getAttribute("type"), "text");
        assertEquals(jmbgField.getAttribute("placeholder"), "Unesite JMBG");
        assertEquals(jmbgField.getAttribute("required"), "true");

        assertEquals(passwordField.getAttribute("name"), "password");
        assertEquals(passwordField.getAttribute("type"), "password");
        assertEquals(passwordField.getAttribute("placeholder"), "Unesite lozinku");
        assertEquals(passwordField.getAttribute("required"), "true");

        assertEquals(submitButton.getText(), "Prijavi se");
        assertTrue(submitButton.isEnabled());
        assertFalse(isElementPresent(By.cssSelector(".error-message")));
    }

    @Test
    public void testEmptyLoginShowsValidationError() {
        loginPage.clickSubmit();

        assertEquals(waitForErrorMessage(), REQUIRED_FIELDS_ERROR);
        assertEquals(driver.getCurrentUrl(), LoginPage.LOGIN_URL);
        assertEquals(visibleElement(By.cssSelector("button[type='submit']")).getText(), "Prijavi se");
    }

    @Test
    public void testMissingPasswordShowsValidationError() {
        loginPage.setUsername(VALID_JMBG);
        loginPage.clickSubmit();

        assertEquals(waitForErrorMessage(), REQUIRED_FIELDS_ERROR);
        assertEquals(valueOf(By.id("jmbg")), VALID_JMBG);
        assertEquals(valueOf(By.id("password")), "");
        assertEquals(driver.getCurrentUrl(), LoginPage.LOGIN_URL);
    }

    @Test
    public void testMissingJmbgShowsValidationError() {
        loginPage.setPassword(VALID_PASSWORD);
        loginPage.clickSubmit();

        assertEquals(waitForErrorMessage(), REQUIRED_FIELDS_ERROR);
        assertEquals(valueOf(By.id("jmbg")), "");
        assertEquals(valueOf(By.id("password")), VALID_PASSWORD);
        assertEquals(driver.getCurrentUrl(), LoginPage.LOGIN_URL);
    }

    @Test
    public void testLoginWithWrongPassword() {
        loginPage.setUsername(VALID_JMBG);
        loginPage.setPassword("pogresnaLozinka123!");
        loginPage.clickSubmit();

        String error = waitForErrorMessage();
        assertNotNull(error);
        assertFalse(error.isEmpty());
        assertEquals(driver.getCurrentUrl(), LoginPage.LOGIN_URL);
        assertLoginButtonReady();
    }

    @Test
    public void testLoginWithNonExistentUser() {
        loginPage.setUsername("0000000000000");
        loginPage.setPassword("NijeVazno123!");
        loginPage.clickSubmit();

        String error = waitForErrorMessage();
        assertNotNull(error);
        assertFalse(error.isEmpty());
        assertEquals(driver.getCurrentUrl(), LoginPage.LOGIN_URL);
        assertLoginButtonReady();
    }

    @Test
    public void testErrorMessageClearsAfterSubmittingCredentialsAgain() {
        loginPage.clickSubmit();
        assertEquals(waitForErrorMessage(), REQUIRED_FIELDS_ERROR);

        loginPage.setUsername(VALID_JMBG);
        loginPage.setPassword("pogresnaLozinka123!");
        loginPage.clickSubmit();

        String error = waitForErrorMessageDifferentFrom(REQUIRED_FIELDS_ERROR);
        assertFalse(error.isEmpty());
    }

    @Test
    public void testRegisterLinkNavigatesToRegisterPage() {
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".register-link a"))).click();

        wait.until(ExpectedConditions.urlContains("/register"));
        assertTrue(driver.getCurrentUrl().contains("/register"));
    }

    @Test
    public void testSuccessfulLogin() {
        loginPage.login(VALID_JMBG, VALID_PASSWORD);
        wait.until(ExpectedConditions.urlContains("/dashboard"));

        assertFalse(driver.getCurrentUrl().contains("/login"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard"));
    }

    private WebElement visibleElement(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    private String visibleText(By locator) {
        return visibleElement(locator).getText();
    }

    private String valueOf(By locator) {
        return visibleElement(locator).getAttribute("value");
    }

    private String waitForErrorMessage() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".error-message"))).getText();
    }

    private String waitForErrorMessageDifferentFrom(String previousMessage) {
        By errorLocator = By.cssSelector(".error-message");

        return wait.until(driver -> {
            try {
                java.util.List<WebElement> errors = driver.findElements(errorLocator);
                if (errors.isEmpty() || !errors.get(0).isDisplayed()) {
                    return null;
                }

                String text = errors.get(0).getText();
                return !text.isEmpty() && !text.equals(previousMessage) ? text : null;
            } catch (org.openqa.selenium.StaleElementReferenceException ignored) {
                return null;
            }
        });
    }

    private boolean isElementPresent(By locator) {
        return !driver.findElements(locator).isEmpty();
    }

    private void assertLoginButtonReady() {
        WebElement submitButton = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[type='submit']")));
        assertEquals(submitButton.getText(), "Prijavi se");
        assertTrue(submitButton.isEnabled());
    }
}