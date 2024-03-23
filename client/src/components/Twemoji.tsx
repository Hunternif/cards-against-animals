import { FormEvent, useEffect, useState } from 'react';
import twemoji from 'twemoji';
import { copyFields } from '../shared/utils';

interface Props extends React.HTMLAttributes<HTMLSpanElement> { }

/**
 * Renders twemoji (twitter emoji) as SVG image.
 * Adapted from https://gist.github.com/chibicode/fe195d792270910226c928b69a468206
 */
export function Twemoji(props: Props) {
  const children = props.children?.toString() ?? "";
  const newProps = copyFields(props, ["children"]);
  const [innerHtml, setInnerHtml] = useState(parseEmoji(children));

  function parseEmoji(str: string): string {
    return twemoji.parse(str ?? "", {
      folder: "svg",
      ext: ".svg",
      className: "twemoji emoji",
    });
  }
  // TODO: parse emoji while typing
  function refreshHTML(event: FormEvent<HTMLSpanElement>) {
    setInnerHtml(parseEmoji(event.currentTarget.innerText));
  }

  // Cancel twemoji rendering while editing content
  // useEffect(() => {
  //   if (props.contentEditable) {
  //     setInnerHtml(children);
  //   }
  // }, [props.contentEditable]);

  return <span {...newProps}
    dangerouslySetInnerHTML={{ __html: innerHtml }}
  // onInput={refreshHTML}
  />;
}