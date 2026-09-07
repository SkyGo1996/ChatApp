import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ProfileWash } from "./ProfileWash";

describe("ProfileWash", () => {
  describe("when children are provided", () => {
    it("should render children when style is omitted", async () => {
      // Arrange
      // Act
      await render(
        <ProfileWash>
          <Text>Wash content</Text>
        </ProfileWash>
      );

      // Assert
      expect(screen.getByText("Wash content")).toBeTruthy();
    });
  });
});
