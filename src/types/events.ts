export interface GlobalEvents {
  id: number;
  description: string;
  cost: number;
  influence: 'positive' | 'negative';
}

export interface LocaleEvents {
  id: number;
  description: string;
  cost: number;
  role: 'reachtruck' | 'picker';
  influence: 'positive' | 'negative';
}

export interface ChoiceEvents {
  id: number;
  description: string;
  decisions: {
    positive: string;
    negative: string;
  };
}

/**
 * Ступени уговоров после решения уволить сотрудника.
 * На каждой ступени показывается один случайный текст из массива.
 * В текстах {name} — метка, куда подставляется имя сотрудника.
 */
export interface DismissPleasList {
  firstStep: string[];
  secondStep: string[];
  thirdStep: string[];
}
