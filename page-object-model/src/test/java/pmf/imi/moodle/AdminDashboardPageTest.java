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

public class AdminDashboardPageTest {

    private static final String ADMIN_JMBG = "1001001001001";
    private static final String ADMIN_PASSWORD = "Admin123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private AdminDashboardPage adminDashboardPage;

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

        driver.get(AdminDashboardPage.ADMIN_DASHBOARD_URL);
        wait.until(ExpectedConditions.urlContains("/admin/dashboard"));

        adminDashboardPage = new AdminDashboardPage(driver);
        adminDashboardPage.waitForDashboardToLoad();
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testAdminDashboardHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/admin/dashboard"));
        assertEquals(adminDashboardPage.getHeadingText(), "Admin Dashboard");
        assertFalse(adminDashboardPage.hasErrorMessage(), "Dashboard ne sme da prikaže grešku pri učitavanju.");
    }

    @Test
    public void testRefreshButtonReloadsDashboard() {
        assertEquals(adminDashboardPage.getRefreshButtonText(), "Osveži");
        assertTrue(adminDashboardPage.isRefreshButtonEnabled());

        adminDashboardPage.clickRefresh();

        assertTrue(driver.getCurrentUrl().contains("/admin/dashboard"));
        assertEquals(adminDashboardPage.getRefreshButtonText(), "Osveži");
        assertTrue(adminDashboardPage.isRefreshButtonEnabled());
    }

    @Test
    public void testKpiCardsAreDisplayed() {
        assertEquals(adminDashboardPage.getKpiCardsCount(), 4);
        assertEquals(
                adminDashboardPage.getKpiLabels(),
                List.of("UKUPNO KORISNIKA", "TERMINI DANAS", "ZAHTEVI ZA ODOBRENJE", "STOPA ZAVRŠAVANJA")
        );
        assertTrue(adminDashboardPage.getKpiValues().stream().allMatch(this::isNumericOrPercent));
        assertTrue(adminDashboardPage.getCompletionRateCardText().contains("%"));
        assertTrue(adminDashboardPage.getCompletionRateCardText().contains("/"));
    }

    @Test
    public void testUsersAndAppointmentsStatisticsAreDisplayed() {
        assertEquals(
                adminDashboardPage.getUsersSectionHeadings(),
                List.of("Korisnici po ulogama", "Termini po statusu")
        );
        assertEquals(adminDashboardPage.getRoleLabels(), List.of("Administratori", "Doktori", "Pacijenti"));
        assertTrue(adminDashboardPage.getRoleCounts().stream().allMatch(this::isNumeric));

        assertEquals(
                adminDashboardPage.getAppointmentStatLabels(),
                List.of("Zakazani", "Završeni", "Otkazao pacijent", "Otkazao doktor")
        );
        assertTrue(adminDashboardPage.getAppointmentStatCounts().stream().allMatch(this::isNumeric));
    }

    @Test
    public void testTopDoctorsSectionIsRenderedWhenDataExists() {
        int topDoctorCardsCount = adminDashboardPage.getTopDoctorCardsCount();

        if (topDoctorCardsCount == 0) {
            return;
        }

        String firstDoctorCardText = adminDashboardPage.getFirstTopDoctorCardText();
        assertTrue(firstDoctorCardText.contains("Ukupno termina"));
        assertTrue(firstDoctorCardText.contains("Završeno"));
        assertTrue(firstDoctorCardText.contains("Stopa"));
        assertTrue(firstDoctorCardText.contains("%"));
    }

    @Test
    public void testRecentActivitySectionsAreDisplayed() {
        assertEquals(adminDashboardPage.getRecentSectionHeadings(), List.of("Novi korisnici", "Najnoviji termini"));
        assertTrue(adminDashboardPage.getRecentActivityItemsCount() > 0);
    }

    @Test
    public void testSystemHealthSectionIsDisplayed() {
        assertEquals(
                adminDashboardPage.getSystemHealthLabels(),
                List.of("Medicinski kartoni", "Recepti", "Dostupnosti", "Aktivni doktori", "Baza podataka")
        );
        assertTrue(adminDashboardPage.getSystemHealthValues().stream().allMatch(value -> !value.isEmpty()));
        assertEquals(adminDashboardPage.getDatabaseStatusText(), "connected");
    }

    @Test
    public void testQuickLinksAreDisplayed() {
        assertEquals(
                adminDashboardPage.getQuickLinkLabels(),
                List.of("Upravljanje korisnicima", "Svi termini", "Medicinski kartoni", "Recepti", "Statistike")
        );
    }

    @Test
    public void testQuickLinkNavigatesToAdminAppointments() {
        adminDashboardPage.clickQuickLink("Svi termini");

        wait.until(ExpectedConditions.urlContains("/admin/appointments"));
        assertTrue(driver.getCurrentUrl().contains("/admin/appointments"));
    }

    private boolean isNumeric(String value) {
        return value.matches("\\d+");
    }

    private boolean isNumericOrPercent(String value) {
        return value.matches("\\d+%?");
    }
}
