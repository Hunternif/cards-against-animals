import { VirtualTable } from '../../../components/VirtualTable';
import { DeckCard } from '../../../shared/types';
import { AdminDeckCardRow, adminDeckRowHeight } from './AdminDeckCardRow';
import { AdminDeckControlRow } from './AdminDeckControlRow';
import { AdminDeckHeaderRow } from './AdminDeckHeaderRow';

interface Props {
  cards: DeckCard[];
}

export function AdminCopyCardsDialog({ cards }: Props) {
  return (
    <>
      <AdminDeckControlRow readOnly cards={cards} />
      <VirtualTable
        className="admin-deck-table"
        rowHeight={adminDeckRowHeight}
        data={cards}
        render={(card) => <AdminDeckCardRow card={card} />}
      />
    </>
  );
}
