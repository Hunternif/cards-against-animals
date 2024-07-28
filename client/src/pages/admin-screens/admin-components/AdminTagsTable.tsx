import { DeckCardSet } from '../../../api/deck/deck-card-set';
import { GameButton } from '../../../components/Buttons';
import { Checkbox } from '../../../components/Checkbox';
import { ScrollContainer } from '../../../components/layout/ScrollContainer';
import { VirtualTable } from '../../../components/VirtualTable';
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

interface Props {
  deck: Deck;
  cards: DeckCardSet;
}

export function AdminTagsTable({ deck, cards }: Props) {
  return (
    <ScrollContainer scrollLight className="table-container">
      <VirtualTable
        className="admin-deck-table standalone"
        rowHeight={adminDeckRowHeightWithBorder}
        data={cards.cards}
        header={<TagsHeader deck={deck} cards={cards} />}
        render={(card) => <TagsCardRow deck={deck} card={card} />}
      />
    </ScrollContainer>
  );
}

interface HeaderProps {
  deck: Deck;
  cards: DeckCardSet;
}

function TagsHeader({ deck, cards }: HeaderProps) {
  return (
    <tr className="admin-deck-table-header">
      <th className="col-card-id">ID</th>
      <th className="col-card-content">
        Content
        <span className="deck-count">
          <DeckStats cards={cards} />
        </span>
      </th>
      {deck.tags.map((t) => (
        <th className="col-card-tag" key={t.name}>
          {t.name}
        </th>
      ))}
      <th className="col-card-tag">
        <GameButton inline lighter>
          + New tag
        </GameButton>
      </th>
    </tr>
  );
}

interface RowProps {
  deck: Deck;
  card: DeckCard;
}

function TagsCardRow({ deck, card }: RowProps) {
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
      {deck.tags.map((t) => (
        <td className="col-card-tag" key={t.name}>
          <Checkbox checked={card.tags.indexOf(t.name) > -1} />
        </td>
      ))}
      <td className="col-card-tag">{/* New tag */}</td>
    </tr>
  );
}
