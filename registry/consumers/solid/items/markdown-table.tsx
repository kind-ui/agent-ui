import { MarkdownTable } from "../components/ui/solid/markdown-table.js";

export default function MarkdownTableItem() {
  return (
    <MarkdownTable aria-label="Table">
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Step</td>
        </tr>
      </tbody>
    </MarkdownTable>
  );
}
