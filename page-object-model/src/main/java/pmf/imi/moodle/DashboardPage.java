package pmf.imi.moodle;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

public class DashboardPage extends BasePageModel {
    public static final String DASHBOARD_URL = BasePageModel.BASE_URL + "/dashboard";

    @FindBy(css = ".dashboard-head h1")
    private WebElement welcomeHeading;

    @FindBy(css = ".section-title")
    private WebElement quickActionsTitle;

    @FindBy(css = ".refresh-btn")
    private WebElement refreshButton;

    @FindBy(css = ".dashboard-cards .card")
    private List<WebElement> quickActionCards;

    public DashboardPage(WebDriver driver) {
        super(driver);
    }

    public String getWelcomeHeadingText() {
        wait.until(ExpectedConditions.visibilityOf(welcomeHeading));
        return welcomeHeading.getText();
    }

    public String getQuickActionsTitleText() {
        wait.until(ExpectedConditions.visibilityOf(quickActionsTitle));
        return quickActionsTitle.getText();
    }

    public int getQuickActionsCardsCount() {
        wait.until(ExpectedConditions.visibilityOfAllElements(quickActionCards));
        return quickActionCards.size();
    }

    public void clickRefresh() {
        wait.until(ExpectedConditions.elementToBeClickable(refreshButton)).click();
    }
}
