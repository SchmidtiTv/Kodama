import { openUrl } from "@tauri-apps/plugin-opener";

function renderInline(text, keyPrefix) {
  const parts = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2] != null) parts.push(<strong key={`${keyPrefix}-${index}`}>{match[2]}</strong>);
    else if (match[3] != null) parts.push(<em key={`${keyPrefix}-${index}`}>{match[3]}</em>);
    else if (match[4] != null) {
      parts.push(
        <code
          key={`${keyPrefix}-${index}`}
          className="px-1 py-0.5 rounded bg-elevated"
          style={{ fontSize: "0.92em" }}
        >
          {match[4]}
        </code>
      );
    } else if (match[5] != null) {
      const url = match[6];
      parts.push(
        <span
          key={`${keyPrefix}-${index}`}
          onClick={() => openUrl(url).catch(() => {})}
          className="text-accent cursor-pointer hover:underline"
        >
          {match[5]}
        </span>
      );
    }
    last = match.index + match[0].length;
    index += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function renderNewsBody(body) {
  if (!body) return null;
  const blocks = [];
  let list = null;
  const flushList = () => {
    if (!list) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5 my-1 flex flex-col gap-0.5">
        {list}
      </ul>
    );
    list = null;
  };
  const headingClasses = {
    1: "text-t15 font-bold mt-2.5 mb-1",
    2: "text-t13 font-semibold mt-2 mb-0.5",
    3: "text-t12 font-semibold mt-1.5 mb-0.5",
  };

  body.split("\n").forEach((line, index) => {
    const text = line.trim();
    if (!text) {
      flushList();
      return;
    }
    const heading = text.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      blocks.push(
        <div key={index} className={`${headingClasses[level]} text-primary`}>
          {renderInline(heading[2], `h${index}`)}
        </div>
      );
      return;
    }
    if (text.startsWith("- ") || text.startsWith("* ")) {
      if (!list) list = [];
      list.push(<li key={index}>{renderInline(text.slice(2), `li${index}`)}</li>);
      return;
    }
    flushList();
    blocks.push(
      <p key={index} className="my-1">
        {renderInline(text, `p${index}`)}
      </p>
    );
  });
  flushList();
  return blocks;
}
