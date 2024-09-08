import { FormEvent, useState } from 'react';
import twemoji from 'twemoji';
import { copyFields } from '../shared/utils';

interface Props extends React.HTMLAttributes<HTMLSpanElement> {}

const symbolsRegex = /(♂)/;
const symbolsRegexGlobal = new RegExp(symbolsRegex, 'g');

/**
 * Renders twemoji (twitter emoji) as SVG image.
 * Adapted from https://gist.github.com/chibicode/fe195d792270910226c928b69a468206
 */
export function Twemoji(props: Props) {
  const children = props.children?.toString() ?? '';
  const newProps = copyFields(props, ['children']);
  const [innerHtml, setInnerHtml] = useState(parseEmoji(children));

  function parseEmoji(str: string): string {
    const twemojiHtml = twemoji.parse(str ?? '', {
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
      folder: 'svg',
      ext: '.svg',
      className: 'twemoji emoji',
      callback: function (iconHex, options: TwemojiOptions, variant) {
        // Convert from hex to the original character:
        const iconText = String.fromCharCode(parseInt(iconHex, 16));
        if (symbolsRegex.test(iconText)) {
          return false;
        }
        return `${options.base}${options.size}/${iconHex}${options.ext}`;
      },
    });
    // Fixes a rendering bug in Chrome, where symbols like '♂' become extra thin
    // whenever font weight is set:
    return twemojiHtml.replace(
      symbolsRegexGlobal,
      '<span class="symbol-text">$1</span>',
    );
  }
  // TODO: parse emoji while typing
  function refreshHTML(event: FormEvent<HTMLSpanElement>) {
    setInnerHtml(parseEmoji(event.currentTarget.innerText));
  }

  return (
    <span
      {...newProps}
      dangerouslySetInnerHTML={{ __html: innerHtml }}
      // onInput={refreshHTML}
    />
  );
}
