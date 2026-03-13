package pmf.imi.moodle;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class ProfilePage extends BasePageModel {
    public static final String PROFILE_URL = BasePageModel.BASE_URL + "/profile";

    @FindBy(css = ".profile-header h1")
    private WebElement profileFullName;

    @FindBy(css = ".btn-edit")
    private WebElement editButton;

    @FindBy(css = ".profile-grid")
    private WebElement profileGrid;

    public ProfilePage(WebDriver driver) {
        super(driver);
    }

    public String getProfileFullName() {
        wait.until(ExpectedConditions.visibilityOf(profileFullName));
        return profileFullName.getText();
    }

    public boolean isProfileGridVisible() {
        wait.until(ExpectedConditions.visibilityOf(profileGrid));
        return profileGrid.isDisplayed();
    }

    public String getEditButtonText() {
        wait.until(ExpectedConditions.visibilityOf(editButton));
        return editButton.getText();
    }

    public void clickEditButton() {
        wait.until(ExpectedConditions.elementToBeClickable(editButton)).click();
    }
}
