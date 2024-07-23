import { useState } from 'react';
import { useResponseCount } from '../../../api/lobby/lobby-hooks';
import { SelectInput } from '../../../components/FormControls';
import { ResponseCardInGame, TagInGame } from '../../../shared/types';
import { CardResponse } from './CardResponse';
import { useGameContext } from './GameContext';

interface Props {
  cards: ResponseCardInGame[];
}

const anyTagKey = 'any tag';

export function CardTagExchangePanel({ cards }: Props) {
  const { lobby } = useGameContext();
  const responseCount = useResponseCount(lobby);
  const anyTag = new TagInGame(anyTagKey, responseCount);

  const [selectedTags, setSelectedTags] = useState<
    Map<ResponseCardInGame, TagInGame>
  >(new Map());

  const tags = [anyTag, ...lobby.response_tags.values()];

  function handleSelect(card: ResponseCardInGame, tag: TagInGame) {
    const newSelectedTags = new Map(selectedTags);
    newSelectedTags.set(card, tag);
    setSelectedTags(newSelectedTags);
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
  const [selectedTagName, setSelectedTagName] = useState(anyTagKey);
  const tagMap = new Map(tags.map((t) => [t.name, t]));

  function handleSelect(tagName: string) {
    const tag = tagMap.get(tagName)!;
    setSelectedTagName(tagName);
    onSelect(tag);
  }

  return (
    <div key={card.id} className="card-container">
      <SelectInput
        value={selectedTagName}
        options={tags.map((tag) => [
          tag.name,
          `${tag.name}: ${tag.card_count}`,
        ])}
        onChange={handleSelect}
      />
      <CardResponse card={card} />
    </div>
  );
}
