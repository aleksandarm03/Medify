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
import java.util.List;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;

public class AdminStatisticsPageTest {

    private static final String ADMIN_JMBG = "1001001001001";
    private static final String ADMIN_PASSWORD = "Admin123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private AdminStatisticsPage adminStatisticsPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get(LoginPage.LOGIN_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(ADMIN_JMBG, ADMIN_PASSWORD);

        driver.get(AdminStatisticsPage.ADMIN_STATISTICS_URL);
        wait.until(ExpectedConditions.urlContains("/admin/statistics"));

        adminStatisticsPage = new AdminStatisticsPage(driver);
        adminStatisticsPage.waitForPageToSettle();
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testAdminStatisticsPageHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/admin/statistics"));
        assertEquals(adminStatisticsPage.getHeadingText(), "Statistika termina");
        assertFalse(adminStatisticsPage.hasErrorMessage(), "Ne sme biti prikazana greška pri učitavanju statistike.");
    }

    @Test
    public void testOverallStatisticsCardsAreDisplayed() {
        assertEquals(adminStatisticsPage.getStatCardsCount(), 5);
        assertEquals(
                adminStatisticsPage.getStatLabels(),
                List.of("UKUPNI TERMINI", "ZAKAZANI", "ZAVRŠENI", "OTKAZAO PACIJENT", "OTKAZAO DOKTOR")
        );
        assertTrue(adminStatisticsPage.getStatValues().stream().allMatch(this::isNumeric));
    }

    @Test
    public void testDoctorStatisticsTableHeadersAreDisplayed() {
        assertEquals(adminStatisticsPage.getTableHeadingText(), "Statistika po doktoru");
        assertEquals(
                adminStatisticsPage.getTableHeaders(),
                List.of("Doktor", "Ukupno", "Zakazani", "Završeni", "Otkazao doktor", "Završenost", "Stopa otkazivanja doktora")
        );
    }

    @Test
    public void testDoctorStatisticsRowsAreDisplayed() {
        assertTrue(adminStatisticsPage.getRowsCount() > 0,
                "Admin statistika treba da prikaže doktore iz seed termina.");
        assertFalse(adminStatisticsPage.hasEmptyState(),
                "Tabela treba da bude prikazana kada postoje termini za doktore.");
    }

    @Test
    public void testFirstDoctorStatisticsRowHasExpectedCells() {
        List<String> cells = adminStatisticsPage.getFirstRowCells();

        assertEquals(cells.size(), 7);
        assertFalse(cells.get(0).isEmpty(), "Ime doktora mora biti prikazano.");
        assertTrue(isNumeric(cells.get(1)), "Ukupan broj termina mora biti numerički.");
        assertTrue(isNumeric(cells.get(2)), "Broj zakazanih termina mora biti numerički.");
        assertTrue(isNumeric(cells.get(3)), "Broj završenih termina mora biti numerički.");
        assertTrue(isNumeric(cells.get(4)), "Broj otkazivanja doktora mora biti numerički.");
        assertTrue(cells.get(5).matches("\\d+%"), "Završenost mora biti prikazana kao procenat.");
        assertTrue(cells.get(6).matches("\\d+%"), "Stopa otkazivanja doktora mora biti prikazana kao procenat.");
    }

    @Test
    public void testCompletionAndCancellationProgressBarsAreDisplayed() {
        assertTrue(adminStatisticsPage.getCompletionProgressTexts().stream().allMatch(this::isPercent));
        assertTrue(adminStatisticsPage.getCancellationProgressTexts().stream().allMatch(this::isPercent));

        assertTrue(adminStatisticsPage.getCompletionProgressClasses().stream()
                .allMatch(cssClass -> cssClass.contains("progress-fill") && cssClass.contains("rate-")));
        assertTrue(adminStatisticsPage.getCancellationProgressClasses().stream()
                .allMatch(cssClass -> cssClass.contains("progress-fill")
                        && cssClass.contains("cancellation")
                        && cssClass.contains("rate-")));
    }

    private boolean isNumeric(String value) {
        return value.matches("\\d+");
    }

    private boolean isPercent(String value) {
        return value.matches("\\d+%");
    }
}
