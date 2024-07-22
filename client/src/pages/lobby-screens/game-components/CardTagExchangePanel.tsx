import { ResponseCardInGame } from '../../../shared/types';
import { CardResponse } from './CardResponse';

interface Props {
  cards: ResponseCardInGame[];
}

export function CardTagExchangePanel({ cards }: Props) {
  return (
    <div className="card-tag-exchange-panel">
      {cards.map((c) => (
        <CardResponse card={c}  />
      ))}
    </div>
  );
}
