package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;
import java.util.stream.Collectors;

public class AdminDashboardPage extends BasePageModel {
    public static final String ADMIN_DASHBOARD_URL = BasePageModel.BASE_URL + "/admin/dashboard";

    private static final By DASHBOARD_CONTENT = By.cssSelector(".dashboard-content");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");
    private static final By LOADING = By.cssSelector(".loading");

    @FindBy(css = ".dashboard-header h1")
    private WebElement heading;

    @FindBy(css = ".btn-refresh")
    private WebElement refreshButton;

    @FindBy(css = ".kpi-card")
    private List<WebElement> kpiCards;

    @FindBy(css = ".kpi-card h3")
    private List<WebElement> kpiLabels;

    @FindBy(css = ".kpi-card .kpi-value")
    private List<WebElement> kpiValues;

    @FindBy(css = ".users-section .section-card h2")
    private List<WebElement> usersSectionHeadings;

    @FindBy(css = ".role-stat .role-label")
    private List<WebElement> roleLabels;

    @FindBy(css = ".role-stat .role-count")
    private List<WebElement> roleCounts;

    @FindBy(css = ".appointment-stat .stat-label")
    private List<WebElement> appointmentStatLabels;

    @FindBy(css = ".appointment-stat .stat-count")
    private List<WebElement> appointmentStatCounts;

    @FindBy(css = ".top-doctors-section .doctor-card")
    private List<WebElement> topDoctorCards;

    @FindBy(css = ".recent-section .section-card h2")
    private List<WebElement> recentSectionHeadings;

    @FindBy(css = ".recent-section .activity-item")
    private List<WebElement> recentActivityItems;

    @FindBy(css = ".system-health .health-label")
    private List<WebElement> systemHealthLabels;

    @FindBy(css = ".system-health .health-value")
    private List<WebElement> systemHealthValues;

    @FindBy(css = ".system-health .status-ok")
    private WebElement databaseStatus;

    @FindBy(css = ".quick-link")
    private List<WebElement> quickLinks;

    @FindBy(css = ".quick-link .link-label")
    private List<WebElement> quickLinkLabels;

    public AdminDashboardPage(WebDriver driver) {
        super(driver);
    }

    public void waitForDashboardToLoad() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(LOADING));
        wait.until(ExpectedConditions.or(
                ExpectedConditions.visibilityOfElementLocated(DASHBOARD_CONTENT),
                ExpectedConditions.visibilityOfElementLocated(ERROR_MESSAGE)
        ));
    }

    public String getHeadingText() {
        waitForDashboardToLoad();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
    }

    public String getRefreshButtonText() {
        wait.until(ExpectedConditions.visibilityOf(refreshButton));
        return refreshButton.getText();
    }

    public boolean isRefreshButtonEnabled() {
        wait.until(ExpectedConditions.visibilityOf(refreshButton));
        return refreshButton.isEnabled();
    }

    public void clickRefresh() {
        wait.until(ExpectedConditions.elementToBeClickable(refreshButton)).click();
        waitForDashboardToLoad();
    }

    public int getKpiCardsCount() {
        waitForDashboardToLoad();
        wait.until(ExpectedConditions.visibilityOfAllElements(kpiCards));
        return kpiCards.size();
    }

    public List<String> getKpiLabels() {
        waitForDashboardToLoad();
        return textOfVisibleElements(kpiLabels);
    }

    public List<String> getKpiValues() {
        waitForDashboardToLoad();
        return textOfVisibleElements(kpiValues);
    }

    public String getCompletionRateCardText() {
        waitForDashboardToLoad();
        return kpiCards.get(3).getText();
    }

    public List<String> getUsersSectionHeadings() {
        waitForDashboardToLoad();
        return textOfVisibleElements(usersSectionHeadings);
    }

    public List<String> getRoleLabels() {
        waitForDashboardToLoad();
        return textOfVisibleElements(roleLabels);
    }

    public List<String> getRoleCounts() {
        waitForDashboardToLoad();
        return textOfVisibleElements(roleCounts);
    }

    public List<String> getAppointmentStatLabels() {
        waitForDashboardToLoad();
        return textOfVisibleElements(appointmentStatLabels);
    }

    public List<String> getAppointmentStatCounts() {
        waitForDashboardToLoad();
        return textOfVisibleElements(appointmentStatCounts);
    }

    public int getTopDoctorCardsCount() {
        waitForDashboardToLoad();
        return driver.findElements(By.cssSelector(".top-doctors-section .doctor-card")).size();
    }

    public String getFirstTopDoctorCardText() {
        waitForDashboardToLoad();
        wait.until(ExpectedConditions.visibilityOfAllElements(topDoctorCards));
        return topDoctorCards.get(0).getText();
    }

    public List<String> getRecentSectionHeadings() {
        waitForDashboardToLoad();
        return textOfVisibleElements(recentSectionHeadings);
    }

    public int getRecentActivityItemsCount() {
        waitForDashboardToLoad();
        wait.until(ExpectedConditions.visibilityOfAllElements(recentActivityItems));
        return recentActivityItems.size();
    }

    public List<String> getSystemHealthLabels() {
        waitForDashboardToLoad();
        return textOfVisibleElements(systemHealthLabels);
    }

    public List<String> getSystemHealthValues() {
        waitForDashboardToLoad();
        return textOfVisibleElements(systemHealthValues);
    }

    public String getDatabaseStatusText() {
        waitForDashboardToLoad();
        return wait.until(ExpectedConditions.visibilityOf(databaseStatus)).getText();
    }

    public List<String> getQuickLinkLabels() {
        waitForDashboardToLoad();
        return textOfVisibleElements(quickLinkLabels);
    }

    public void clickQuickLink(String label) {
        waitForDashboardToLoad();
        WebElement link = quickLinks.stream()
                .filter(element -> element.getText().contains(label))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Brzi link nije pronađen: " + label));

        wait.until(ExpectedConditions.elementToBeClickable(link)).click();
    }

    public boolean hasErrorMessage() {
        return !driver.findElements(ERROR_MESSAGE).isEmpty()
                && driver.findElement(ERROR_MESSAGE).isDisplayed();
    }

    private List<String> textOfVisibleElements(List<WebElement> elements) {
        wait.until(ExpectedConditions.visibilityOfAllElements(elements));
        return elements.stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }
}
