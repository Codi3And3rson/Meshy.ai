import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

describe("AuthContext", () => {
  beforeEach(() => {
    // Suppress expected React error boundaries from showing up in test logs
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const TestComponent = () => {
    useAuth();
    return <div>Test</div>;
  };

  it("throws an error when useAuth is used outside of AuthProvider", () => {
    expect(() => render(<TestComponent />)).toThrow("useAuth must be used inside AuthProvider");
  });

  it("does not throw an error when useAuth is used inside of AuthProvider", () => {
    expect(() => render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )).not.toThrow();
  });
});
