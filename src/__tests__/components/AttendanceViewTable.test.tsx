/**
 * @jest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AttendanceViewTable from "../../components/AttendanceViewTable";
import type { AttendanceViewRow } from "../../types/attendance";

const baseRows: AttendanceViewRow[] = [
  {
    member: { name: "Bravo", email: "b@example.com" },
    status: "No Response",
    reason: "",
    comments: "",
    lastUpdated: null,
  },
  {
    member: { name: "Alpha", email: "a@example.com" },
    status: "Going",
    reason: "",
    comments: "",
    lastUpdated: 2000,
  },
  {
    member: { name: "", email: "c@example.com" },
    status: "Not Going",
    reason: "",
    comments: "",
    lastUpdated: 1000,
  },
];

const baseSummary = {
  going: 1,
  notGoing: 1,
  noResponse: 1,
  total: 3,
};

const renderTable = () =>
  render(
    <AttendanceViewTable
      rows={baseRows}
      summary={baseSummary}
      eventName="Test"
    />
  );

const getDataRows = () => screen.getAllByRole("row").slice(1);

describe("AttendanceViewTable controls", () => {
  it("sorts by name by default", () => {
    renderTable();
    const [firstRow] = getDataRows();
    const cells = within(firstRow).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Alpha");
  });

  it("toggles email sort direction", async () => {
    const user = userEvent.setup();
    renderTable();

    const emailSort = screen.getByRole("button", { name: /אימייל/ });
    await user.click(emailSort);
    await user.click(emailSort);

    const [firstRow] = getDataRows();
    const cells = within(firstRow).getAllByRole("cell");
    expect(cells[1]).toHaveTextContent("c@example.com");
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    renderTable();

    const statusSelect = screen.getByRole("combobox", { name: "סטטוס" });
    await user.selectOptions(statusSelect, "Going");

    const rows = getDataRows();
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getAllByRole("cell")[0]).toHaveTextContent("Alpha");
  });

  it("filters by search input", async () => {
    const user = userEvent.setup();
    renderTable();

    const searchInput = screen.getByPlaceholderText("חיפוש לפי שם או אימייל");
    await user.type(searchInput, "c@example.com");

    const rows = getDataRows();
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getAllByRole("cell")[1]).toHaveTextContent(
      "c@example.com"
    );
  });

  it("filters correctly with duplicate emails", async () => {
    const user = userEvent.setup();
    render(
      <AttendanceViewTable
        rows={[
          {
            member: { name: "Dana", email: "dup@example.com" },
            status: "Going",
            reason: "",
            comments: "",
            lastUpdated: 4000,
          },
          {
            member: { name: "Dana", email: "dup@example.com" },
            status: "No Response",
            reason: "",
            comments: "",
            lastUpdated: null,
          },
        ]}
        summary={{ going: 1, notGoing: 0, noResponse: 1, total: 2 }}
        eventName="Test"
      />
    );

    const statusSelect = screen.getByRole("combobox", { name: "סטטוס" });
    await user.selectOptions(statusSelect, "No Response");

    const rows = getDataRows();
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("לא ענו");
  });
});

describe("AttendanceViewTable summaries and styling", () => {
  it("renders summary counts", () => {
    renderTable();

    expect(screen.getByText(/^מגיעים: 1$/)).toBeInTheDocument();
    expect(screen.getByText(/^לא מגיעים: 1$/)).toBeInTheDocument();
    expect(screen.getByText(/^לא ענו: 1$/)).toBeInTheDocument();
    expect(screen.getByText(/^סה״כ: 3$/)).toBeInTheDocument();
  });

  it("matches row coloring snapshot", () => {
    const { asFragment } = renderTable();
    expect(asFragment()).toMatchSnapshot();
  });
});
