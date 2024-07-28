import { useState } from 'react';
import { DeckCardSet } from '../../../api/deck/deck-card-set';
import { GameButton } from '../../../components/Buttons';
import { ScrollContainer } from '../../../components/layout/ScrollContainer';
import { VirtualTable } from '../../../components/VirtualTable';
import { useDIContext } from '../../../di-context';
import {
  Deck,
  DeckCard,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../../shared/types';
import {
  adminDeckRowHeight,
  adminDeckRowHeightWithBorder,
  CardContentRow,
} from './AdminDeckCardRow';
import { DeckStats } from './AdminDeckTableHeader';
import { NewTagModal } from './NewTagModal';

interface Props {
  deck: Deck;
}

export function AdminTagsTable({ deck }: Props) {
  const [showNewTag, setShowNewTag] = useState(false);
  const [cards, setCards] = useState(DeckCardSet.fromDeck(deck));

  function refreshCards() {
    // Update data to force refresh in the table.
    setCards(DeckCardSet.fromDeck(deck));
  }

  return (
    <>
      <NewTagModal
        deck={deck}
        show={showNewTag}
        onHide={() => setShowNewTag(false)}
      />
      <ScrollContainer scrollLight className="table-container">
        <VirtualTable
          className="admin-deck-table standalone"
          rowHeight={adminDeckRowHeightWithBorder}
          data={cards.cards}
          header={
            <TagsHeader
              deck={deck}
              cards={cards}
              onNewTag={() => setShowNewTag(true)}
            />
          }
          render={(card) => (
            <TagsCardRow deck={deck} card={card} onUpdate={refreshCards} />
          )}
        />
      </ScrollContainer>
    </>
  );
}

interface HeaderProps {
  deck: Deck;
  cards: DeckCardSet;
  onNewTag: () => void;
}

function TagsHeader({ deck, cards, onNewTag }: HeaderProps) {
  return (
    <tr className="admin-deck-table-header">
      <th className="col-card-id">ID</th>
      <th className="col-card-content">
        Content
        <span className="deck-count">
          <DeckStats cards={cards} />
        </span>
      </th>
      {[...deck.tags.values()].map((t) => (
        <th className="col-card-tag" key={t.name}>
          {t.name}
        </th>
      ))}
      <th className="col-card-tag">
        <GameButton inline lighter onClick={onNewTag}>
          + New tag
        </GameButton>
      </th>
    </tr>
  );
}

interface RowProps {
  deck: Deck;
  card: DeckCard;
  onUpdate: () => void;
}

function TagsCardRow({ deck, card, onUpdate }: RowProps) {
  const isPrompt = card instanceof PromptDeckCard;
  const classes = ['card-row'];
  classes.push(isPrompt ? 'row-prompt' : 'row-response');
  if (card instanceof ResponseDeckCard && card.action)
    classes.push('action-card');

  return (
    <tr className={classes.join(' ')}>
      <td className="col-card-id">{card.id}</td>
      <td
        className="col-card-content"
        style={{
          height: adminDeckRowHeight,
        }}
      >
        <CardContentRow>{card.content}</CardContentRow>
      </td>
      {[...deck.tags.values()].map((t) => (
        <TagCell
          key={t.name}
          deck={deck}
          card={card}
          tag={t.name}
          onUpdate={onUpdate}
        />
      ))}
      <td className="col-card-tag">{/* New tag */}</td>
    </tr>
  );
}

interface CellProps {
  deck: Deck;
  card: DeckCard;
  tag: string;
  onUpdate: () => void;
}

function TagCell({ deck, card, tag, onUpdate }: CellProps) {
  const { deckRepository } = useDIContext();

  async function handleToggle(tagName: string, checked: boolean) {
    const index = card.tags.indexOf(tagName);
    if (checked) {
      if (index === -1) {
        card.tags.push(tagName);
      }
    } else {
      if (index > -1) {
        card.tags.splice(index, 1);
      }
    }
    onUpdate();
    await deckRepository.updateCard(deck, card);
  }

  const checked = card.tags.indexOf(tag) > -1;
  const classes = ['tag-cell', 'col-card-tag'];
  classes.push(checked ? 'checked' : 'unchecked');

  return (
    <td
      className={classes.join(' ')}
      onClick={() => handleToggle(tag, !checked)}
    >
      {tag}
    </td>
  );
}
