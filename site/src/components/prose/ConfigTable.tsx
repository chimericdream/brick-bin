import type { ConfigVar } from '@/content/config';

import classes from './Prose.module.css';

function Default({ value }: { value: ConfigVar['default'] }) {
  if ('code' in value) return <code>{value.code}</code>;
  if ('tag' in value) return <span className="tag tag--missing">{value.tag}</span>;
  return <>{value.text}</>;
}

/**
 * A configuration table (SPEC 6.20). Each variable name links to its own row, so it can be shared.
 * Under 720px every row becomes a block: name, purpose, then "Default: value".
 */
export function ConfigTable({ vars }: { vars: ConfigVar[] }) {
  return (
    <div className={classes.tableWrap}>
      <table className={classes.stack}>
        <thead>
          <tr>
            <th scope="col">Variable</th>
            <th scope="col">Purpose</th>
            <th scope="col">Default</th>
          </tr>
        </thead>
        <tbody>
          {vars.map((v) => (
            <tr key={v.name} id={v.name}>
              <th scope="row">
                <a className={classes.var} href={`#${v.name}`}>
                  {v.name}
                </a>
              </th>
              <td>
                {v.purpose}
                {v.compose && <span className={classes.where}>{v.compose}</span>}
              </td>
              <td
                className={
                  'text' in v.default && v.default.wrap
                    ? `${classes.default} ${classes.defaultWrap}`
                    : classes.default
                }
                data-label="Default"
              >
                <Default value={v.default} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
