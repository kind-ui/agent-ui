import defaultMdxComponents from "fumadocs-ui/mdx";
import { Fragment } from "react";
import { frameworkColumns, frameworkNames, frameworkNamesIntro } from "@/lib/frameworks";

/**
 * How a component's controlled props and callbacks are spelled in each framework (plan D5):
 * `<FrameworkNames name="step" />`. Renders nothing when it has neither.
 */
export function FrameworkNames({ name }: { name: string }) {
  const rows = frameworkNames(name);
  if (!rows.length) return null;
  const Table = defaultMdxComponents.table;
  return (
    <>
      <p>{frameworkNamesIntro}</p>
      <Table className="[&_code]:whitespace-nowrap">
        <thead>
          <tr>
            {frameworkColumns.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells) => (
            <tr key={cells.join()}>
              {frameworkColumns.map((label, column) => (
                <td key={label}>
                  {cells[column]?.map((each, index) => (
                    <Fragment key={each}>
                      {index > 0 && ", "}
                      <code>{each}</code>
                    </Fragment>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
