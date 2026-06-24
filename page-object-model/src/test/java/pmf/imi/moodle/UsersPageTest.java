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

public class UsersPageTest {

    private static final String ADMIN_JMBG = "1001001001001";
    private static final String ADMIN_PASSWORD = "Admin123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private UsersPage usersPage;

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

        driver.get(UsersPage.USERS_URL);
        wait.until(ExpectedConditions.urlContains("/users"));

        usersPage = new UsersPage(driver);
        usersPage.waitForPageToSettle();
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testUsersPageHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/users"));
        assertEquals(usersPage.getHeadingText(), "Korisnici");
        assertFalse(usersPage.hasErrorMessage(), "Ne sme biti prikazana greška pri učitavanju korisnika.");
    }

    @Test
    public void testUsersTableHeadersAndRowsAreDisplayed() {
        List<String> headers = usersPage.getTableHeaders();

        assertTrue(headers.containsAll(List.of("JMBG", "Ime", "Prezime", "Uloga", "Telefon", "Adresa", "Akcije")));
        assertTrue(usersPage.getRowsCount() > 0, "Admin treba da vidi korisnike iz seed podataka.");
        assertFalse(usersPage.hasEmptyState());
    }

    @Test
    public void testFirstUserRowHasExpectedCells() {
        List<String> cells = usersPage.getFirstRowCells();

        assertTrue(cells.size() >= 7);
        assertTrue(cells.get(0).matches("\\d{13}"), "JMBG mora imati 13 cifara.");
        assertFalse(cells.get(1).isEmpty());
        assertFalse(cells.get(2).isEmpty());
        assertTrue(List.of("Administrator", "Doktor", "Pacijent").contains(cells.get(3)));
        assertFalse(cells.get(4).isEmpty());
        assertFalse(cells.get(5).isEmpty());
        assertTrue(cells.get(cells.size() - 1).contains("Izmeni"));
        assertTrue(cells.get(cells.size() - 1).contains("Obriši"));
    }

    @Test
    public void testRoleBadgesAreDisplayedWithRoleClasses() {
        assertTrue(usersPage.getRoleBadgeTexts().stream()
                .allMatch(role -> List.of("Administrator", "Doktor", "Pacijent").contains(role)));
        assertTrue(usersPage.getRoleBadgeClasses().stream().allMatch(cssClass -> cssClass.contains("role-")));
    }

    @Test
    public void testEditUserModalCanBeOpenedAndClosed() {
        usersPage.openFirstEditModal();

        assertEquals(usersPage.getEditModalHeadingText(), "Izmeni korisnika");
        assertTrue(usersPage.getEditModalLabels().containsAll(List.of("Ime *", "Prezime *", "Telefon *", "Adresa *")));

        usersPage.closeEditModal();
    }

    @Test
    public void testDeleteConfirmationModalCanBeOpenedAndClosed() {
        usersPage.openFirstDeleteModal();

        String modalText = usersPage.getDeleteModalText();
        assertTrue(modalText.contains("Potvrda brisanja"));
        assertTrue(modalText.contains("Ova akcija je nepovratna!"));

        usersPage.closeDeleteModal();
    }
}
