import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const LS_KEY = "meshy_user_key_v1";

const TestComponent = () => {
  const { apiKey, setApiKey, logout, isAuthed } = useAuth();

  return (
    <div>
      <div data-testid="apiKey">{apiKey}</div>
      <div data-testid="isAuthed">{isAuthed ? "true" : "false"}</div>
      <button onClick={() => setApiKey("new_key")}>Set Key</button>
      <button onClick={() => setApiKey("")}>Clear Key</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  let getItemMock, setItemMock, removeItemMock;

  beforeEach(() => {
    getItemMock = vi.spyOn(Storage.prototype, "getItem").mockReturnValue("");
    setItemMock = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
    removeItemMock = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error if useAuth is used outside AuthProvider", () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow("useAuth must be used inside AuthProvider");
    consoleError.mockRestore();
  });

  it("initializes apiKey from localStorage", () => {
    getItemMock.mockReturnValue("test_init_key");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getItemMock).toHaveBeenCalledWith(LS_KEY);
    expect(screen.getByTestId("apiKey").textContent).toBe("test_init_key");
    expect(screen.getByTestId("isAuthed").textContent).toBe("true");
  });

  it("initializes empty apiKey when localStorage is empty", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("apiKey").textContent).toBe("");
    expect(screen.getByTestId("isAuthed").textContent).toBe("false");
  });

  it("updates apiKey and stores in localStorage when setApiKey is called", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Set Key").click();
    });

    expect(screen.getByTestId("apiKey").textContent).toBe("new_key");
    expect(screen.getByTestId("isAuthed").textContent).toBe("true");
    expect(setItemMock).toHaveBeenCalledWith(LS_KEY, "new_key");
  });

  it("removes apiKey from localStorage when setApiKey is called with falsy value", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Clear Key").click();
    });

    expect(screen.getByTestId("apiKey").textContent).toBe("");
    expect(screen.getByTestId("isAuthed").textContent).toBe("false");
    expect(removeItemMock).toHaveBeenCalledWith(LS_KEY);
  });

  it("clears apiKey when logout is called", () => {
    getItemMock.mockReturnValue("existing_key");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("apiKey").textContent).toBe("existing_key");

    act(() => {
      screen.getByText("Logout").click();
    });

    expect(screen.getByTestId("apiKey").textContent).toBe("");
    expect(screen.getByTestId("isAuthed").textContent).toBe("false");
    // Note: logout() calls setApiKey(""), which calls removeItem
    expect(removeItemMock).toHaveBeenCalledWith(LS_KEY);
  });
});
