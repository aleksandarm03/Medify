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

public class DoctorsPageTest {

    private static final String VALID_JMBG = "5005005005005";
    private static final String VALID_PASSWORD = "Patient123!";

    private WebDriver driver;
    private DoctorsPage doctorsPage;

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

        driver.get(DoctorsPage.DOCTORS_URL);
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/doctors"));

        doctorsPage = new DoctorsPage(driver);
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testDoctorsPageHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/doctors"));
        assertEquals(doctorsPage.getHeadingText(), "Pretraga doktora");
    }

    @Test
    public void testSearchBySpecializationReturnsResults() {
        doctorsPage.setSpecialization("Kardiolog");
        doctorsPage.clickSearch();

        assertTrue(doctorsPage.getDoctorCardsCount() > 0);
        assertTrue(doctorsPage.getFirstDoctorCardText().contains("Kardiolog"));
    }

    @Test
    public void testClearSearchResetsInputs() {
        doctorsPage.setSpecialization("Dermatolog");
        doctorsPage.setName("Jelena");
        doctorsPage.clickSearch();

        doctorsPage.clickClear();

        assertEquals(doctorsPage.getSpecializationValue(), "");
        assertEquals(doctorsPage.getNameValue(), "");
    }

    @Test
    public void testOpenDoctorDetailsNavigatesToDoctorIdRoute() {
        assertTrue(doctorsPage.getDoctorCardsCount() > 0);
        doctorsPage.openFirstDoctorDetails();
        assertTrue(driver.getCurrentUrl().matches(".*/doctors/[^/]+$"));
    }
}
