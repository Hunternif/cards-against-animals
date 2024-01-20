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
  return <span {...newProps}
    dangerouslySetInnerHTML={{
      __html: twemoji.parse(children ?? "", {
        folder: "svg",
        ext: ".svg",
        className: "twemoji emoji",
      })
    }}
  />;
}