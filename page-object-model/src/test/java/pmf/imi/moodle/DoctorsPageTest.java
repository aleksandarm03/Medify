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

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertNotNull;
import static org.testng.Assert.assertTrue;

public class DoctorsPageTest {

    private static final String VALID_JMBG = "5005005005005";
    private static final String VALID_PASSWORD = "Patient123!";
    private static final String ADMIN_JMBG = "1001001001001";
    private static final String ADMIN_PASSWORD = "Admin123!";
    private static final String API_URL = "http://127.0.0.1:3232";
    private static final int API_RETRY_ATTEMPTS = 3;

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

    @Test
    public void testRejectedDoctorIsNotVisibleInSearchResults() throws Exception {
        String suffix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("ddHHmmss"));
        String doctorFirstName = "AutoReject" + suffix;
        String doctorLastName = "Doctor";
        String doctorJmbg = "97" + suffix + "111";

        String registerResponse = registerDoctor(doctorJmbg, doctorFirstName, doctorLastName);
        String doctorId = extractJsonValue(registerResponse, "_id");
        assertNotNull(doctorId, "Registracija doktora nije vratila _id.");

        String adminToken = loginAndGetToken(ADMIN_JMBG, ADMIN_PASSWORD);
        rejectDoctor(doctorId, adminToken);

        driver.get(DoctorsPage.DOCTORS_URL);
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/doctors"));

        doctorsPage.setName(doctorFirstName);
        doctorsPage.clickSearch();

        assertEquals(doctorsPage.getDoctorCardsCount(), 0,
                "Odbijeni doktor ne sme biti vidljiv u pretrazi doktora.");
    }

    private String registerDoctor(String jmbg, String firstName, String lastName) throws IOException, InterruptedException {
        String body = String.format(
                "{\"JMBG\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"password\":\"Doctor123!\",\"homeAddress\":\"Test Address 1\",\"phoneNumber\":\"0601234567\",\"gender\":\"male\",\"role\":\"doctor\",\"specialization\":\"Neurolog\",\"shift\":\"morning\"}",
                jmbg,
                firstName,
                lastName
        );

        HttpResponse<String> response = sendJson("POST", API_URL + "/auth/register", body, null);
        assertTrue(response.statusCode() == 201,
                "Registracija doktora nije uspela. Status: " + response.statusCode() + " Body: " + response.body());
        return response.body();
    }

    private String loginAndGetToken(String jmbg, String password) throws IOException, InterruptedException {
        String body = String.format("{\"JMBG\":\"%s\",\"password\":\"%s\"}", jmbg, password);
        HttpResponse<String> response = sendJson("POST", API_URL + "/auth/login", body, null);
        assertTrue(response.statusCode() == 200,
                "Admin login nije uspeo. Status: " + response.statusCode() + " Body: " + response.body());

        String token = extractJsonValue(response.body(), "token");
        assertNotNull(token, "Login odgovor ne sadrzi token.");
        return token;
    }

    private void rejectDoctor(String doctorId, String adminToken) throws IOException, InterruptedException {
        String body = "{\"reason\":\"Automated POM regression test\"}";
        HttpResponse<String> response = sendJson("POST", API_URL + "/api/admin/reject-user/" + doctorId, body, adminToken);
        assertTrue(response.statusCode() == 200,
                "Odbijanje doktora nije uspelo. Status: " + response.statusCode() + " Body: " + response.body());
    }

    private HttpResponse<String> sendJson(String method, String url, String body, String bearerToken)
            throws IOException, InterruptedException {
        HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json");

        if (bearerToken != null && !bearerToken.isEmpty()) {
            builder.header("Authorization", "Bearer " + bearerToken);
        }

        HttpRequest request = switch (method) {
            case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body)).build();
            case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofString(body)).build();
            default -> throw new IllegalArgumentException("Nepodrzan HTTP metod: " + method);
        };

        IOException lastException = null;
        for (int attempt = 1; attempt <= API_RETRY_ATTEMPTS; attempt++) {
            try {
                return client.send(request, HttpResponse.BodyHandlers.ofString());
            } catch (IOException exception) {
                lastException = exception;
                if (attempt == API_RETRY_ATTEMPTS) {
                    break;
                }
                Thread.sleep(300L * attempt);
            }
        }

        throw lastException;
    }

    private String extractJsonValue(String json, String key) {
        Pattern pattern = Pattern.compile("\\\"" + Pattern.quote(key) + "\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
}
