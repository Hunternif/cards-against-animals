import { useState } from 'react';
import {
  ResponseCardInGame,
  TagInGame,
  anyTagsKey,
  noTagsKey,
} from '../../../shared/types';
import { useGameContext } from './GameContext';

interface Props {
  cards: ResponseCardInGame[];
  onSelectedTags: (tagNames: string[]) => void;
}

/**
 * UI that lets you choose a tag to fetch for every given card.
 */
export function CardTagExchangePanel({ cards, onSelectedTags }: Props) {
  const { lobby } = useGameContext();

  const [selectedTags, setSelectedTags] = useState<
    Map<ResponseCardInGame, TagInGame>
  >(new Map());

  const tags = [...lobby.response_tags.values()];

  function handleSelect(card: ResponseCardInGame, tag: TagInGame) {
    const newSelectedTags = new Map(selectedTags);
    newSelectedTags.set(card, tag);
    setSelectedTags(newSelectedTags);
    onSelectedTags([...newSelectedTags.values()].map((t) => t.name));
  }

  return (
    <div className="card-tag-exchange-panel">
      {cards.map((c) => (
        <CardContainer
          key={c.id}
          card={c}
          tags={tags}
          onSelect={(tag) => handleSelect(c, tag)}
        />
      ))}
    </div>
  );
}

interface CardContainterProps {
  card: ResponseCardInGame;
  tags: TagInGame[];
  onSelect: (tag: TagInGame) => void;
}

function CardContainer({ card, tags, onSelect }: CardContainterProps) {
  const [selectedTag, setSelectedTag] = useState(tags[0]);

  function handleSelect(tag: TagInGame) {
    setSelectedTag(tag);
    onSelect(tag);
  }

  return (
    <div key={card.id} className="card">
      <ul>
        {tags.map((t) => (
          <TagItem
            key={t.name}
            tag={t}
            selected={t.name === selectedTag.name}
            onSelect={handleSelect}
          />
        ))}
      </ul>
    </div>
  );
}

interface TagItemProps {
  tag: TagInGame;
  selected?: boolean;
  onSelect: (tag: TagInGame) => void;
}
function TagItem({ tag, selected, onSelect }: TagItemProps) {
  const classes = ['item'];
  if (selected) classes.push('selected');
  if (tag.card_count === 0) classes.push('disabled');
  if (tag.name === anyTagsKey || tag.name === noTagsKey) {
    classes.push('technical');
  }
  // Translate technical names:
  let tagName = tag.name;
  switch (tagName) {
    case anyTagsKey:
      tagName = 'any tag';
      break;
    case noTagsKey:
      tagName = 'no tags';
      break;
  }

  function handleSelect(tag: TagInGame) {
    if (tag.card_count > 0) onSelect(tag);
  }

  return (
    <li
      key={tag.name}
      className={classes.join(' ')}
      onClick={() => handleSelect(tag)}
    >
      <span className="tag-name">{tagName}</span>
      <span className="card-count">{tag.card_count}</span>
    </li>
  );
}
