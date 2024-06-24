import { useState } from 'react';
import { useErrorContext } from '../../../components/ErrorContext';
import { SelectInput, SelectOption } from '../../../components/FormControls';
import { useDIContext } from '../../../di-context';
import { useAsyncData } from '../../../hooks/data-hooks';
import { Deck } from '../../../shared/types';

interface Props {
  onSelectDeck: (deck: Deck | null) => void;
}

/** A dropdown control to choose a target deck for modification. */
export function AdminDeckSelector({ onSelectDeck }: Props) {
  const [targetDeck, setTargetDeck] = useState<Deck | null>(null);
  const { deckRepository } = useDIContext();
  const { setError } = useErrorContext();
  const [decks, decksError] = useAsyncData(deckRepository.getDecks());

  if (decksError) setError(decksError);

  const deckOptions = new Array<SelectOption<string>>();
  deckOptions.push(['', 'New deck...']);
  decks?.forEach((d) => deckOptions.push([d.id, d.title]));

  function handleSelectTarget(targetID: string) {
    if (targetID === '') {
      setTargetDeck(null);
      onSelectDeck(null);
    } else {
      const deck = decks?.find((d) => d.id === targetID);
      if (deck) {
        setTargetDeck(deck);
        onSelectDeck(deck);
      }
    }
  }

  return (
    <SelectInput
      className="admin-deck-selector"
      value={targetDeck?.id ?? ''}
      options={deckOptions}
      onChange={handleSelectTarget}
    />
  );
}
